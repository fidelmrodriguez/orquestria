#!/usr/bin/env python3
"""Retenção automática do Orquestria (executada fora do Blitz pelo GitHub Actions).

Requisitos: psycopg 3, secret ORQUESTRIA_MAINTENANCE_DATABASE_URL.
Nenhuma credencial ou identificador de conta é exibido nos logs.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

# Sem import em tempo de módulo: testes da política usam apenas stdlib.


@dataclass(frozen=True)
class Policy:
    guest_tasks_days: int = 30
    guest_projects_days: int = 45
    guest_workspaces_days: int = 60
    user_inactive_days: int = 180
    user_grace_days: int = 30
    pressure_percent: int = 85
    max_guest_tasks_per_run: int = 250
    max_guest_projects_per_run: int = 50
    max_guest_workspaces_per_run: int = 50
    max_expired_sessions_per_run: int = 2000
    max_users_per_run: int = 1


def parse_limit_bytes(raw: str | None) -> int | None:
    """Não adivinhar o limite/plano do Neon. Sem limite: apenas Guest e sessões."""
    if not raw or not raw.strip():
        return None
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError("ORQUESTRIA_DATABASE_LIMIT_BYTES deve ser inteiro positivo") from exc
    if value < 64 * 1024 * 1024:
        raise ValueError("Limite de armazenamento inválido ou menor que 64 MiB")
    return value


def under_pressure(database_bytes: int, limit_bytes: int | None, percent: int = 85) -> bool:
    return limit_bytes is not None and database_bytes * 100 >= limit_bytes * percent


def may_remove_user(*, account_type: str, username: str, created_at: datetime,
                    last_active_at: datetime, marked_at: datetime | None,
                    now: datetime, pressure: bool, policy: Policy) -> bool:
    """Defesa extra antes de qualquer remoção de conta; SQL revalida tudo."""
    if not pressure or account_type != "USER" or username.lower() == "guest" or marked_at is None:
        return False
    from datetime import timedelta
    return (created_at <= now - timedelta(days=policy.user_inactive_days)
            and last_active_at <= now - timedelta(days=policy.user_inactive_days)
            and marked_at <= now - timedelta(days=policy.user_grace_days))


def scalar(cur: Any, query: str, params: tuple[Any, ...] = ()) -> Any:
    cur.execute(query, params)
    return cur.fetchone()[0]


def delete_limited(cur: Any, query: str, params: tuple[Any, ...]) -> int:
    cur.execute(query, params)
    return cur.rowcount


def run(conn: Any, *, limit_bytes: int | None, policy: Policy = Policy()) -> dict[str, Any]:
    """Tudo transacional e serializado por advisory lock; sem necessidade de API Blitz."""
    result: dict[str, Any] = {"run_at": datetime.now(timezone.utc).isoformat(),
                              "guest_tasks": 0, "guest_projects": 0,
                              "guest_workspaces": 0, "expired_sessions": 0,
                              "candidate_accounts": 0, "deleted_accounts": 0}
    with conn.cursor() as cur:
        with conn.transaction():
            # Lock transacional também funciona em conexões com pooler (PgBouncer).
            if not scalar(cur, "SELECT pg_try_advisory_xact_lock(6196374521)"):
                result["status"] = "already_running"
                return result
            migration_ok = scalar(cur, """
                SELECT EXISTS (
                    SELECT 1 FROM flyway_schema_history
                    WHERE version = '9' AND success = true)
                  AND EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'app_users'
                      AND column_name = 'cleanup_candidate_since')
            """)
            if not migration_ok:
                raise RuntimeError("Migração V9 não aplicada: nenhuma exclusão realizada")
            guest_ids = [row[0] for row in cur.execute(
                "SELECT id FROM app_users WHERE account_type = 'GUEST'").fetchall()]
            if len(guest_ids) != 1:
                raise RuntimeError("É necessário exatamente um usuário GUEST; manutenção interrompida")
            guest_id = guest_ids[0]

            # Conservar a última autenticação antes de limpar sessões antigas.
            cur.execute("""
                UPDATE app_users u SET
                    last_active_at = GREATEST(u.last_active_at, recent.last_session),
                    cleanup_candidate_since = NULL
                FROM (
                    SELECT user_id, MAX(created_at) AS last_session
                    FROM auth_sessions GROUP BY user_id
                ) recent
                WHERE recent.user_id = u.id AND recent.last_session > u.last_active_at
            """)
            result["expired_sessions"] = delete_limited(cur, """
                DELETE FROM auth_sessions WHERE id IN (
                    SELECT id FROM auth_sessions WHERE expires_at < CURRENT_TIMESTAMP
                    ORDER BY expires_at LIMIT %s)
            """, (policy.max_expired_sessions_per_run,))

            # Tarefas antigas do Guest, exceto quando receberam comentário recente.
            result["guest_tasks"] = delete_limited(cur, """
                DELETE FROM tasks WHERE id IN (
                    SELECT t.id FROM tasks t JOIN projects p ON p.id = t.project_id
                    WHERE p.owner_id = %s
                      AND t.updated_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                      AND NOT EXISTS (
                          SELECT 1 FROM task_comments c WHERE c.task_id = t.id
                            AND c.created_at >= CURRENT_TIMESTAMP - (%s * INTERVAL '1 day'))
                    ORDER BY t.updated_at, t.id LIMIT %s)
            """, (guest_id, policy.guest_tasks_days, policy.guest_tasks_days,
                   policy.max_guest_tasks_per_run))

            # Apagar colunas junto dos projetos já vazios via FK, preservando
            # projetos com tarefas ou colunas criadas recentemente.
            result["guest_projects"] = delete_limited(cur, """
                DELETE FROM projects WHERE id IN (
                    SELECT p.id FROM projects p WHERE p.owner_id = %s
                      AND p.created_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                      AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id)
                      AND NOT EXISTS (
                          SELECT 1 FROM board_columns c WHERE c.project_id = p.id
                           AND c.created_at >= CURRENT_TIMESTAMP - (%s * INTERVAL '1 day'))
                    ORDER BY p.created_at, p.id LIMIT %s)
            """, (guest_id, policy.guest_projects_days, policy.guest_projects_days,
                   policy.max_guest_projects_per_run))
            result["guest_workspaces"] = delete_limited(cur, """
                DELETE FROM workspaces WHERE id IN (
                    SELECT w.id FROM workspaces w WHERE w.owner_id = %s
                      AND w.created_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                      AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.workspace_id = w.id)
                    ORDER BY w.created_at, w.id LIMIT %s)
            """, (guest_id, policy.guest_workspaces_days,
                   policy.max_guest_workspaces_per_run))

            # pg_database_size é uma aproximação, NÃO a cota faturada do Neon.
            db_bytes = int(scalar(cur, "SELECT pg_database_size(current_database())"))
            result["database_bytes_approx"] = db_bytes
            result["configured_limit_bytes"] = limit_bytes
            pressure = under_pressure(db_bytes, limit_bytes, policy.pressure_percent)
            result["pressure"] = pressure

            # Sem pressão, desmarcar candidatos; jamais fazer limpeza temporal
            # de contas pessoais quando o banco está confortável.
            if not pressure:
                cur.execute("""
                    UPDATE app_users SET cleanup_candidate_since = NULL
                    WHERE account_type = 'USER' AND cleanup_candidate_since IS NOT NULL
                """)
                result["status"] = "guest_only"
                return result

            # Reativação ou nova sessão: cancela automaticamente a candidatura.
            cur.execute("""
                UPDATE app_users u SET cleanup_candidate_since = NULL
                WHERE u.account_type = 'USER' AND cleanup_candidate_since IS NOT NULL
                  AND (u.last_active_at >= CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                       OR EXISTS (SELECT 1 FROM auth_sessions s
                                  WHERE s.user_id = u.id AND s.expires_at > CURRENT_TIMESTAMP))
            """, (policy.user_inactive_days,))

            # Inicia período de carência. Não remove usuários recém-inativos.
            cur.execute("""
                UPDATE app_users u SET cleanup_candidate_since = CURRENT_TIMESTAMP
                WHERE u.account_type = 'USER' AND lower(u.username) <> 'guest'
                  AND u.cleanup_candidate_since IS NULL
                  AND u.created_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                  AND u.last_active_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                  AND NOT EXISTS (
                      SELECT 1 FROM auth_sessions s WHERE s.user_id = u.id
                        AND s.expires_at > CURRENT_TIMESTAMP)
            """, (policy.user_inactive_days, policy.user_inactive_days))
            result["candidate_accounts"] = cur.rowcount

            # 1 conta/dia, depois de no mínimo 180 dias inativa + 30 dias marcada.
            # FOR UPDATE bloqueia a conta enquanto revalidamos a elegibilidade.
            cur.execute("""
                SELECT u.id, u.account_type, u.username, u.created_at,
                       u.last_active_at, u.cleanup_candidate_since
                FROM app_users u WHERE u.account_type = 'USER'
                  AND lower(u.username) <> 'guest'
                  AND u.cleanup_candidate_since < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                  AND u.created_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                  AND u.last_active_at < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
                  AND NOT EXISTS (
                      SELECT 1 FROM auth_sessions s WHERE s.user_id = u.id
                        AND s.expires_at > CURRENT_TIMESTAMP)
                ORDER BY u.last_active_at, u.id LIMIT %s FOR UPDATE OF u SKIP LOCKED
            """, (policy.user_grace_days, policy.user_inactive_days,
                   policy.user_inactive_days, policy.max_users_per_run))
            for user_id, account_type, username, created_at, last_active_at, marked_at in cur.fetchall():
                if not may_remove_user(account_type=account_type, username=username,
                        created_at=created_at, last_active_at=last_active_at,
                        marked_at=marked_at, now=datetime.now(timezone.utc),
                        pressure=pressure, policy=policy):
                    continue
                # Ordem das referências: comentários cascata -> tarefas -> colunas
                # -> projetos -> workspaces -> sessões -> associações -> usuário.
                cur.execute("DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE owner_id = %s)", (user_id,))
                cur.execute("DELETE FROM board_columns WHERE project_id IN (SELECT id FROM projects WHERE owner_id = %s)", (user_id,))
                cur.execute("DELETE FROM projects WHERE owner_id = %s", (user_id,))
                cur.execute("DELETE FROM workspaces WHERE owner_id = %s", (user_id,))
                # Atribuições feitas por outros proprietários não podem ficar órfãs.
                cur.execute("UPDATE tasks SET assignee_id = NULL WHERE assignee_id = %s", (str(user_id),))
                cur.execute("DELETE FROM auth_sessions WHERE user_id = %s", (user_id,))
                # team_members e user_tags são ON DELETE CASCADE; proibição do Guest no WHERE.
                cur.execute("DELETE FROM app_users WHERE id = %s AND account_type = 'USER' AND lower(username) <> 'guest'", (user_id,))
                if cur.rowcount != 1:
                    raise RuntimeError("Exclusão de conta divergente: transação revertida")
                result["deleted_accounts"] += 1
            result["status"] = "pressure_cleanup"
            return result


def main() -> None:
    url = os.environ.get("ORQUESTRIA_MAINTENANCE_DATABASE_URL", "").strip()
    if not url:
        raise SystemExit("Configure o GitHub secret ORQUESTRIA_MAINTENANCE_DATABASE_URL")
    try:
        limit_bytes = parse_limit_bytes(os.environ.get("ORQUESTRIA_DATABASE_LIMIT_BYTES"))
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    import psycopg
    # Nunca imprime a string de conexão; requer SSL de preferência no URL (sslmode=require).
    with psycopg.connect(url, autocommit=True, connect_timeout=15, application_name="orquestria_maintenance") as conn:
        result = run(conn, limit_bytes=limit_bytes)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    if limit_bytes is None:
        print("Atenção: sem limite configurado; contas reais NÃO são removidas. Guest/sessões limpos.")


if __name__ == "__main__":
    main()
