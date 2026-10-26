"use client";

import { useEffect, useState, type ReactNode } from "react";

const POLL_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 12000;

type GateStatus = "checking" | "ready";
type ReadinessPayload = { status?: string };

/**
 * Aguarda a API Java ficar pronta antes de montar login, cadastro, Kanban
 * ou a tela de gerenciamento, inclusive quando já existe uma sessão salva.
 * O aviso de duração é estático; as verificações continuam automáticas.
 */
export default function ApiReadinessGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Contador visual de tempo decorrido: não interfere nas tentativas de readiness.
  // Calculado a partir do relógio, para não atrasar caso a aba fique em segundo plano.
  useEffect(() => {
    const startedAt = Date.now();
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    let disposed = false;
    let checking = false;
    let confirmedReady = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const check = async () => {
      if (disposed || checking || confirmedReady) return;
      checking = true;
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
        // Não confundir a página HTML de wake-up do Blitz com saúde UP.
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        if (response.ok && contentType.includes("json")) {
          const payload = await response.json() as ReadinessPayload;
          if (!disposed && payload?.status === "UP") {
            confirmedReady = true;
            console.info("[Orquestria][readiness] API Java disponível");
            setStatus("ready");
          }
        }
      } catch {
        // Falhas de rede e timeout são normais durante o despertar do Blitz.
      } finally {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = null;
        checking = false;
        controller = null;
        if (!disposed && !confirmedReady) {
          // Apenas uma tentativa por vez, com nova consulta automática.
          retryTimer = setTimeout(() => { void check(); }, POLL_INTERVAL_MS);
        }
      }
    };

    void check();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
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
        <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-wide text-slate-950" role="timer" aria-label={`Tempo decorrido: ${elapsedLabel}`} aria-live="off">
          {elapsedLabel}
        </p>
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          <strong>Tempo de inicialização:</strong> quando o servidor está em repouso, o primeiro acesso pode levar cerca de 3 minutos. Isso é esperado no ambiente de demonstração.
        </p>
        <p className="mt-4 text-xs text-slate-500">
          A conexão é verificada automaticamente. Assim que a API estiver pronta, você seguirá para a aplicação sem precisar fazer nada.
        </p>
      </section>
    </main>
  );
}
