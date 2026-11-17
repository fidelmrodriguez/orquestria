"use client";

import { useEffect, useState, type ReactNode } from "react";

const POLL_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 12000;

type GateStatus = "checking" | "ready";
type ReadinessPayload = { status?: string };
const DIRECT_API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "https://orquestria-api.fidelmrodriguez.prod.page").trim().replace(/\/+$/, "");
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
        // Como no Monavero, aceitar a primeira resposta valida do proxy OU da API direta.
        // O acesso direto so funciona quando o backend permite a origem no CORS.
        const proxyCheck = async () => {
          const response = await fetch("/api/orquestria-readiness", {
            method: "GET", cache: "no-store", headers: { Accept: "application/json" },
            signal: requestController.signal
          });
          const type = response.headers.get("content-type")?.toLowerCase() || "";
          if (!type.includes("json")) throw new Error("Proxy retornou HTML");
          const payload = await response.json() as ReadinessPayload;
          if (response.ok && payload.status === "UP") return true;
          throw new Error("Proxy: " + payload.status);
        };
        const directCheck = async () => {
          const response = await fetch(`${DIRECT_API_BASE}/actuator/health`, {
            method: "GET", cache: "no-store", credentials: "omit",
            headers: { Accept: "application/json" }, signal: requestController.signal
          });
          const type = response.headers.get("content-type")?.toLowerCase() || "";
          if (!response.ok || !type.includes("json")) throw new Error("API ainda nao pronta");
          const payload = await response.json() as ReadinessPayload;
          if (payload.status !== "UP") throw new Error("Spring ainda nao pronto");
          return true;
        };
        await Promise.any([proxyCheck(), directCheck()]);
        if (!disposed) {
          confirmedReady = true;
          console.info("[Orquestria][readiness] API Java disponivel");
          setStatus("ready");
        }
      } catch {
        // Como no Monavero, manter o visitante no Netlify e tentar novamente.
        // Nenhuma navegação automática para a página de wake-up do Blitz.
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
    <main className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,.15),_transparent_38%),linear-gradient(140deg,#f8fafc,#eef2ff)] px-4 py-4 text-slate-950 dark:bg-slate-950 dark:bg-none dark:text-slate-100 sm:px-5 sm:py-10" aria-live="polite">
      <section className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/95 px-5 py-6 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900/95 sm:rounded-[2rem] sm:px-10 sm:py-12" aria-label="Inicialização do Orquestria">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg dark:bg-blue-600 sm:size-16 sm:rounded-2xl" aria-hidden="true">
          <svg className="size-6 animate-spin sm:size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.2em] text-blue-700 dark:text-blue-300 sm:mt-7 sm:text-xs sm:tracking-[.25em]">Orquestria</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:mt-3 sm:text-3xl">Preparando seu ambiente</h1>
        <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
          <span className="sm:hidden">Conectando à API Java e ao PostgreSQL.</span>
          <span className="hidden sm:inline">Estamos iniciando a API Java e conectando ao PostgreSQL para carregar seus projetos com segurança.</span>
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 sm:mt-7 sm:text-sm">
          <span className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" aria-hidden="true" />
          Aguardando o servidor ficar disponível
        </div>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-wide text-slate-950 dark:text-white sm:mt-3 sm:text-2xl" role="timer" aria-label={`Tempo decorrido: ${elapsedLabel}`} aria-live="off">
          {elapsedLabel}
        </p>
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:mt-5 sm:px-4 sm:text-sm sm:leading-6">
          <strong>Tempo de inicialização:</strong> o primeiro acesso pode levar até cerca de 3 minutos quando o servidor está em repouso.
        </p>
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:mt-4">
          A conexão é verificada automaticamente; você continuará aqui enquanto a API inicia.
        </p>
      </section>
    </main>
  );
}
