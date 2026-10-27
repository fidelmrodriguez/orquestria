-- Última atividade persistida independentemente da expiração/remoção das sessões.
-- Nenhuma conta ou informação anterior é excluída por esta migração.
ALTER TABLE app_users
    ADD COLUMN last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE app_users
    ADD COLUMN cleanup_candidate_since TIMESTAMPTZ;

-- Em instalações existentes, preservar o sinal mais recente de uso disponível.
UPDATE app_users u
SET last_active_at = GREATEST(
    u.created_at,
    COALESCE((SELECT MAX(s.created_at) FROM auth_sessions s WHERE s.user_id = u.id), u.created_at)
);
CREATE INDEX idx_app_users_retention ON app_users(account_type, last_active_at)
    WHERE account_type = 'USER';
