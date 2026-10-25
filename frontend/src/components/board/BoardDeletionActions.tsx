"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, getAuthToken, restoreAuthSession, type AuthUser } from "@/lib/auth-client";
import {
  apiRequest, deleteActionPath, deleteOperation, humanName, unpackList,
  type DeleteTarget, type Entity
} from "@/lib/kanban-deletion";
import {
  canDeleteColumn, canDeleteWorkspace, projectCountInWorkspace,
  requiresTypedConfirmation, taskCountInColumn
} from "@/lib/kanban-deletion-policy";

const API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");
const SUCCESS_NOTICE_KEY = "orquestria:etapa6:exclusao-confirmada";

type Pending = { target: DeleteTarget; name: string; description: string };
const order = (a: Entity, b: Entity) => (a.position ?? 0) - (b.position ?? 0);

export default function BoardDeletionActions() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [workspaces, setWorkspaces] = useState<Entity[]>([]);
  const [projects, setProjects] = useState<Entity[]>([]);
  const [columns, setColumns] = useState<Entity[]>([]);
  const [tasks, setTasks] = useState<Entity[]>([]);
  const [projectId, setProjectId] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  // /api/auth/me é fonte de verdade; não se basear só no token no storage.
  const verifySession = useCallback(async () => {
    try {
      const currentUser = await restoreAuthSession();
      if (!mounted.current) return;
      setUser(currentUser);
      setToken(currentUser ? getAuthToken() : null);
      if (!currentUser) { setOpen(false); setPending(null); }
    } catch {
      // Falha transitória no Blitz não remove a sessão, mas suspende controles destrutivos.
      if (mounted.current) { setUser(null); setToken(null); setOpen(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void verifySession();
    try {
      const lastNotice = window.sessionStorage.getItem(SUCCESS_NOTICE_KEY);
      if (lastNotice) {
        setNotice(lastNotice);
        window.sessionStorage.removeItem(SUCCESS_NOTICE_KEY);
      }
    } catch { /* Armazenamento opcional para mensagem de sucesso. */ }

    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_TOKEN_STORAGE_KEY) void verifySession();
    };
    const onAuthChanged = () => { void verifySession(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("orquestria:auth-changed", onAuthChanged);
    return () => {
      mounted.current = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("orquestria:auth-changed", onAuthChanged);
    };
  }, [verifySession]);

  // Sempre consulta o servidor: o Zustand pode conter dados desatualizados.
  const refreshOverview = useCallback(async (accessToken: string) => {
    const [ws, ps] = await Promise.all([
      apiRequest(API_BASE, "/api/workspaces", accessToken, "GET", "listar-workspaces"),
      apiRequest(API_BASE, "/api/projects", accessToken, "GET", "listar-projetos")
    ]);
    if (!mounted.current) return;
    setWorkspaces(unpackList(ws).sort((a,b) => humanName(a).localeCompare(humanName(b), "pt-BR")));
    setProjects(unpackList(ps).sort((a,b) => humanName(a).localeCompare(humanName(b), "pt-BR")));
    setLoaded(true);
  }, []);

  const loadProject = useCallback(async (nextId: string, accessToken: string) => {
    setProjectId(nextId);
    setProjectLoaded(false);
    setColumns([]); setTasks([]);
    if (!nextId) return;
    const [cs, ts] = await Promise.all([
      apiRequest(API_BASE, `/api/projects/${encodeURIComponent(nextId)}/columns`, accessToken, "GET", "listar-colunas"),
      apiRequest(API_BASE, `/api/projects/${encodeURIComponent(nextId)}/tasks`, accessToken, "GET", "listar-tarefas")
    ]);
    if (!mounted.current) return;
    setColumns(unpackList(cs).sort(order));
    setTasks(unpackList(ts).sort(order));
    setProjectLoaded(true);
  }, []);

  async function openPanel() {
    if (!token || !user || busy) return;
    setOpen(true); setBusy(true); setError(""); setLoaded(false);
    try {
      await refreshOverview(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar seus projetos.");
    } finally { setBusy(false); }
  }

  async function selectProject(nextId: string) {
    if (!token || busy) return;
    setError(""); setBusy(true);
    try { await loadProject(nextId, token); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar tarefas."); }
    finally { setBusy(false); }
  }

  function ask(target: DeleteTarget, name: string, description: string) {
    setError(""); setTyped(""); setPending({ target, name, description });
  }

  async function confirmDeletion() {
    if (!pending || !token || busy) return;
    if (requiresTypedConfirmation(pending.target.kind, user?.accountType === "GUEST") && typed !== "EXCLUIR") return;
    setBusy(true); setError("");
    const operation = deleteOperation(pending.target);
    try {
      await apiRequest(API_BASE, deleteActionPath(pending.target), token, "POST", operation);
      // O board-store do Kanban é mantido em memória. Recarregar reidrata
      // a visão real após o 204 e evita cartões fantasmas / ações repetidas.
      try {
        window.sessionStorage.setItem(SUCCESS_NOTICE_KEY, `Exclusão confirmada: ${pending.name}. Quadro atualizado.`);
      } catch { /* A exclusão já foi confirmada pelo servidor. */ }
      window.location.reload();
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : "Não foi possível excluir.";
      setError(reason);
      // Se houve alteração concorrente, refaz a consulta antes de outra tentativa.
      if (token) {
        try {
          await refreshOverview(token);
          if (projectId) await loadProject(projectId, token);
        } catch { /* Mostrar a causa original e permitir nova consulta. */ }
      }
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setPending(null); setOpen(false); setError("");
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, busy]);

  if (!user || !token || !API_BASE) return null;

  const isGuest = user.accountType === "GUEST";
  const selectedProject = projects.find(p => p.id === projectId);
  const needsTyping = pending && requiresTypedConfirmation(pending.target.kind, isGuest);

  return (
    <>
      <div className="fixed bottom-20 right-5 z-[65] flex max-w-[min(92vw,360px)] flex-col items-end gap-2">
        {notice && <div role="status" className="rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg dark:bg-slate-900 dark:text-emerald-200">
          {notice} <button type="button" onClick={() => setNotice("")} className="ml-2 underline">Fechar</button>
        </div>}
        {!open && <button type="button" onClick={() => void openPanel()} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-blue-700" aria-label="Gerenciar exclusões do Kanban">
          Gerenciar exclusões
        </button>}
      </div>

      {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
        <section role="dialog" aria-modal="true" aria-label="Excluir itens do Kanban" className="flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold">Gerenciar exclusões do Kanban</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Selecione um projeto para excluir tarefas ou colunas. Todas as exclusões exigem confirmação.</p>
            </div>
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setPending(null); setError(""); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Fechar</button>
          </header>

          <div className="space-y-6 overflow-y-auto px-5 py-5">
            {isGuest && <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">Você está na conta guest: os dados são compartilhados com outros visitantes. Prefira uma conta pessoal para testar exclusões.</p>}
            {busy && <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">Consultando ou atualizando a API...</p>}
            {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
              {!pending && <button type="button" disabled={busy} className="ml-3 underline" onClick={() => void openPanel()}>Tentar novamente</button>}
            </div>}

            <section aria-label="Projetos e tarefas">
              <h3 className="text-lg font-semibold">Projetos</h3>
              {loaded && projects.length === 0 && <p className="mt-2 text-sm text-slate-500">Nenhum projeto encontrado nesta conta.</p>}
              <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
                {projects.map(project => <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-sm font-semibold">{humanName(project)}</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={() => void selectProject(project.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">Ver tarefas e colunas</button>
                    <button type="button" disabled={busy} onClick={() => ask({ kind: "project", id: project.id }, humanName(project), "Todo o projeto, colunas, tarefas e comentários serão removidos.")} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40">Excluir projeto</button>
                  </div>
                </li>)}
              </ul>
            </section>

            {selectedProject && <section aria-label="Tarefas e colunas selecionadas" className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold">{humanName(selectedProject)} — colunas e tarefas</h3>
              {!projectLoaded && <p className="mt-2 text-sm">Carregando dados do projeto...</p>}
              {projectLoaded && columns.length === 0 && <p className="mt-2 text-sm">O projeto ainda não tem colunas.</p>}
              {projectLoaded && columns.map(column => {
                const count = taskCountInColumn(tasks, column.id);
                return <div key={column.id} className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-sm">{humanName(column)} ({count} tarefa{count === 1 ? "" : "s"})</strong>
                    <button type="button" disabled={busy || !canDeleteColumn(tasks, column.id, projectLoaded)} title={count ? "Mova ou exclua as tarefas antes de remover a coluna" : "Excluir coluna vazia"} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => ask({ kind: "column", projectId, id: column.id }, humanName(column), "Esta coluna vazia será excluída.")}>Excluir coluna</button>
                  </div>
                  <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                    {tasks.filter(task => task.columnId === column.id).map(task => <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span>{humanName(task)}</span>
                      <button type="button" disabled={busy} onClick={() => ask({ kind: "task", projectId, id: task.id }, humanName(task), "Esta tarefa e seus comentários serão excluídos.")} className="rounded-lg px-3 py-2 font-semibold text-red-700 disabled:opacity-40">Excluir tarefa</button>
                    </li>)}
                  </ul>
                </div>;
              })}
              {projectLoaded && tasks.some(task => !columns.some(column => column.id === task.columnId)) && <p className="mt-2 text-sm text-amber-700">Algumas tarefas não têm coluna reconhecida. Não tente excluir colunas até conferir o quadro.</p>}
            </section>}

            <section aria-label="Workspaces">
              <h3 className="text-lg font-semibold">Workspaces</h3>
              <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
                {workspaces.map(workspace => {
                  const count = projectCountInWorkspace(projects, workspace.id);
                  return <li key={workspace.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <span>{humanName(workspace)} · {count} projeto{count === 1 ? "" : "s"}</span>
                    <button type="button" disabled={busy || !canDeleteWorkspace(projects, workspace.id, loaded)} title={count ? "Exclua os projetos vinculados antes" : "Excluir workspace vazio"} className="rounded-lg border border-red-300 px-3 py-2 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => ask({ kind: "workspace", id: workspace.id }, humanName(workspace), "Este workspace vazio será excluído.")}>Excluir workspace</button>
                  </li>;
                })}
              </ul>
            </section>
          </div>
        </section>
      </div>}

      {pending && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4">
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
          <h2 id="delete-title" className="text-xl font-bold">Confirmar exclusão</h2>
          <p className="mt-3 text-sm">Você está prestes a excluir <strong>{pending.name}</strong>.</p>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{pending.description}</p>
          {needsTyping && <label className="mt-5 block text-sm font-medium">
            Digite <strong>EXCLUIR</strong> para confirmar:
            <input autoFocus autoComplete="off" disabled={busy} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={typed} onChange={(event: { target: { value: string } }) => setTyped(event.target.value)} />
          </label>}
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={busy} onClick={() => { setPending(null); setTyped(""); setError(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40">Cancelar</button>
            <button type="button" disabled={busy || Boolean(needsTyping && typed !== "EXCLUIR")} onClick={() => void confirmDeletion()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Excluindo..." : "Confirmar exclusão"}</button>
          </div>
        </section>
      </div>}
    </>
  );
}
