"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const POLL_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 12000;
const SLOW_START_MS = 60000;

type GateStatus = "checking" | "ready";

type ReadinessPayload = { status?: "ready" | "waking" };

/**
 * Bloqueia tanto o LoginScreen quanto o Kanban até o Java estar pronto.
 * Funciona com ou sem token: a restauração de sessão existente acontece
 * depois, na aplicação, evitando 401/falhas durante o cold start.
 */
export default function ApiReadinessGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const runRef = useRef<(() => void) | null>(null);

  const checkNow = useCallback(() => { runRef.current?.(); }, []);

  useEffect(() => {
    let disposed = false;
    let active = false;
    let confirmedReady = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const schedule = () => {
      if (disposed) return;
      retryTimer = setTimeout(() => { void check(); }, POLL_INTERVAL_MS);
    };

    const check = async () => {
      if (disposed || active) return;
      active = true;
      setAttempt((previous) => previous + 1);
      controller = new AbortController();
      const requestController = controller;
      timeoutTimer = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch("/api/orquestria-readiness", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: requestController.signal
        });
        const payload = await response.json() as ReadinessPayload;
        if (disposed) return;
        if (response.ok && payload.status === "ready") {
          confirmedReady = true;
          setStatus("ready");
          return;
        }
      } catch {
        // Em queda do serviço ou falha de rede, manter o gate e tentar novamente.
      } finally {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = null;
        active = false;
        controller = null;
        if (!disposed && !confirmedReady) {
          // Não existe uma segunda consulta enquanto a anterior está em voo.
          schedule();
        }
      }
    };

    runRef.current = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      void check();
    };

    slowTimer = setTimeout(() => { if (!disposed) setSlow(true); }, SLOW_START_MS);
    void check();

    return () => {
      disposed = true;
      runRef.current = null;
      if (retryTimer) clearTimeout(retryTimer);
      if (slowTimer) clearTimeout(slowTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      controller?.abort();
    };
  }, []);

  if (status === "ready") return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,.15),_transparent_38%),linear-gradient(140deg,#f8fafc,#eef2ff)] px-5 py-10 text-slate-950" aria-live="polite">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/95 px-7 py-9 text-center shadow-xl sm:px-10 sm:py-12" aria-label="Inicialização do Orquestria">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg" aria-hidden="true">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[.25em] text-blue-700">Orquestria</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Preparando seu ambiente</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Estamos iniciando a API Java e conectando ao PostgreSQL para carregar seus projetos com segurança.
        </p>
        <div className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />
          Aguardando o servidor ficar disponível
        </div>
        {slow && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            A inicialização está levando mais tempo que o habitual. A verificação continua automaticamente.
          </p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Não é necessário abrir o Blitz ou clicar em Wake. Esta tela sairá automaticamente quando a API estiver pronta.
        </p>
        {slow && (
          <button type="button" onClick={checkNow} className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Verificar agora
          </button>
        )}
        <span className="sr-only">Verificações efetuadas: {attempt}</span>
      </section>
    </main>
  );
}
