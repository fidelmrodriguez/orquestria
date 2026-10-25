"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AUTH_TOKEN_STORAGE_KEY, getAuthToken, restoreAuthSession, type AuthUser } from "@/lib/auth-client";
import {
  apiRequest, deleteActionPath, deleteOperation, humanName, unpackList,
  type DeleteTarget, type Entity
} from "@/lib/kanban-deletion";
import {
  canDeleteColumn, canDeleteWorkspace, projectCountInWorkspace,
  requiresTypedConfirmation, taskCountInColumn
} from "@/lib/kanban-deletion-policy";

const getApiBase = () => (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");
const SUCCESS_NOTICE_KEY = "orquestria:etapa6:exclusao-confirmada";
const ALL_WORKSPACES = "__all__";
const NO_WORKSPACE = "__none__";

type Pending = { target: DeleteTarget; name: string; description: string };
const order = (a: Entity, b: Entity) => (a.position ?? 0) - (b.position ?? 0);

type EntityLike = Entity & { workspaceId?: string; columnId?: string };
const workspaceIdOf = (entity: Entity) => (entity as EntityLike).workspaceId ?? "";
const columnIdOf = (entity: Entity) => (entity as EntityLike).columnId ?? "";
const shortId = (id: string) => id.length > 8 ? id.slice(0, 8) : id;

export default function BoardDeletionActions() {
  const API_BASE = getApiBase();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
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
  const [workspaceFilter, setWorkspaceFilter] = useState<string>(ALL_WORKSPACES);
  const [projectId, setProjectId] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  useEffect(() => { setPortalRoot(document.body); }, []);

  const verifySession = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!mounted.current) return;
    setToken(currentToken);
    console.info("[Orquestria][etapa6] disponibilidade do painel", {
      tokenPresente: Boolean(currentToken), apiConfigurada: Boolean(API_BASE)
    });
    if (!currentToken) {
      setUser(null);
      setOpen(false);
      setPending(null);
      setWorkspaces([]); setProjects([]); setColumns([]); setTasks([]);
      return;
    }
    try {
      const currentUser = await restoreAuthSession();
      if (!mounted.current || getAuthToken() !== currentToken) return;
      setUser(currentUser);
      if (!currentUser) {
        setToken(null);
        setOpen(false);
        setPending(null);
      }
      console.info("[Orquestria][etapa6] validação inicial", { sucesso: Boolean(currentUser) });
    } catch {
      if (mounted.current && getAuthToken() === currentToken) {
        setUser(null);
        setToken(currentToken);
        console.warn("[Orquestria][etapa6] validação inicial indisponível; nova tentativa ao abrir o painel");
      }
    }
  }, [API_BASE]);

  useEffect(() => {
    mounted.current = true;
    void verifySession();
    try {
      const lastNotice = window.sessionStorage.getItem(SUCCESS_NOTICE_KEY);
      if (lastNotice) {
        setNotice(lastNotice);
        window.sessionStorage.removeItem(SUCCESS_NOTICE_KEY);
      }
    } catch { /* aviso opcional */ }

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

  const refreshOverview = useCallback(async (accessToken: string) => {
    const [ws, ps] = await Promise.all([
      apiRequest(API_BASE, "/api/workspaces", accessToken, "GET", "listar-workspaces"),
      apiRequest(API_BASE, "/api/projects", accessToken, "GET", "listar-projetos")
    ]);
    if (!mounted.current) return;
    const orderedWorkspaces = unpackList(ws).sort((a, b) => humanName(a).localeCompare(humanName(b), "pt-BR"));
    const orderedProjects = unpackList(ps).sort((a, b) => humanName(a).localeCompare(humanName(b), "pt-BR"));
    setWorkspaces(orderedWorkspaces);
    setProjects(orderedProjects);
    setLoaded(true);
  }, [API_BASE]);

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
  }, [API_BASE]);

  async function openPanel() {
    if (busy) return;
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null); setToken(null);
      setError("Sua sessão não está disponível. Entre novamente.");
      return;
    }
    setToken(currentToken);
    setOpen(true); setBusy(true); setError(""); setLoaded(false);
    setProjects([]); setWorkspaces([]); setColumns([]); setTasks([]);
    setWorkspaceFilter(ALL_WORKSPACES);
    setProjectId(""); setProjectLoaded(false); setPending(null);
    try {
      const validUser = await restoreAuthSession();
      if (!mounted.current || getAuthToken() !== currentToken) return;
      if (!validUser) {
        setUser(null); setToken(null);
        setError("A sessão expirou. Volte ao login e entre novamente.");
        return;
      }
      setUser(validUser);
      await refreshOverview(currentToken);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Falha ao validar a sessão ou carregar projetos.";
      console.warn("[Orquestria][etapa6] falha ao abrir gerenciamento", {
        tipo: cause instanceof Error ? cause.name : "erro_desconhecido"
      });
      setError(message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function selectProject(nextId: string, workspaceId?: string) {
    if (!token || busy) return;
    setError(""); setBusy(true);
    if (workspaceId) setWorkspaceFilter(workspaceId);
    try {
      await loadProject(nextId, token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar tarefas.");
    } finally {
      setBusy(false);
    }
  }

  function ask(target: DeleteTarget, name: string, description: string) {
    setError(""); setTyped(""); setPending({ target, name, description });
  }

  async function confirmDeletion() {
    if (!pending || !token || !user || busy) return;
    if (requiresTypedConfirmation(pending.target.kind, user.accountType === "GUEST") && typed !== "EXCLUIR") return;
    setBusy(true); setError("");
    const operation = deleteOperation(pending.target);
    try {
      await apiRequest(API_BASE, deleteActionPath(pending.target), token, "POST", operation);
      try {
        window.sessionStorage.setItem(SUCCESS_NOTICE_KEY, `Exclusão confirmada: ${pending.name}. Quadro atualizado.`);
      } catch { /* opcional */ }
      window.location.reload();
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : "Não foi possível excluir.";
      setError(reason);
      if (token) {
        try {
          await refreshOverview(token);
          if (projectId) await loadProject(projectId, token);
        } catch { /* mantém erro original */ }
      }
    } finally {
      setBusy(false);
    }
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

  const workspaceMap = useMemo(() => new Map(workspaces.map((workspace) => [workspace.id, workspace])), [workspaces]);
  const duplicateProjectNames = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      const name = humanName(project);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return counts;
  }, [projects]);

  const workspaceGroups = useMemo(() => {
    const visibleProjects = workspaceFilter === ALL_WORKSPACES
      ? projects
      : projects.filter((project) => {
          const wid = workspaceIdOf(project);
          return workspaceFilter === NO_WORKSPACE ? !wid : wid === workspaceFilter;
        });

    const buckets = new Map<string, Entity[]>();
    visibleProjects.forEach((project) => {
      const wid = workspaceIdOf(project) || NO_WORKSPACE;
      buckets.set(wid, [...(buckets.get(wid) ?? []), project]);
    });

    return Array.from(buckets.entries())
      .map(([workspaceId, groupedProjects]) => ({
        workspaceId,
        workspaceName: workspaceId === NO_WORKSPACE ? "Projetos sem workspace" : humanName(workspaceMap.get(workspaceId) as Entity),
        projects: groupedProjects.sort((a, b) => humanName(a).localeCompare(humanName(b), "pt-BR"))
      }))
      .sort((a, b) => a.workspaceName.localeCompare(b.workspaceName, "pt-BR"));
  }, [projects, workspaceFilter, workspaceMap]);

  const selectedProject = projects.find((project) => project.id === projectId) ?? null;
  const selectedWorkspace = selectedProject ? workspaceMap.get(workspaceIdOf(selectedProject) || "") ?? null : null;
  const needsTyping = pending ? requiresTypedConfirmation(pending.target.kind, user?.accountType === "GUEST") : false;
  const isGuest = user?.accountType === "GUEST";

  if (!token || !API_BASE || !portalRoot) return null;

  return createPortal(
    <>
      <div style={{ zIndex: 60 }} className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4 md:top-24 md:bottom-auto">
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {notice && (
            <div role="status" className="max-w-[min(92vw,700px)] rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg dark:bg-slate-900 dark:text-emerald-200">
              {notice}
              <button type="button" onClick={() => setNotice("")} className="ml-2 underline">Fechar</button>
            </div>
          )}
          {!open && (
            <button
              type="button"
              onClick={() => void openPanel()}
              aria-label="Abrir gerenciamento de exclusões"
              className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Gerenciar exclusões
            </button>
          )}
        </div>
      </div>

      {open && (
        <div style={{ zIndex: 70 }} className="fixed inset-0 bg-slate-950/70 p-3 sm:p-6">
          <div className="mx-auto flex h-full max-h-[95vh] w-full max-w-6xl flex-col rounded-3xl bg-white text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
            <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Gerenciar exclusões do Kanban</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Escolha primeiro o workspace, depois o projeto. Nomes repetidos aparecem com o workspace e o identificador curto.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setOpen(false); setPending(null); setError(""); }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Fechar
                </button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="overflow-y-auto border-b border-slate-200 p-5 lg:border-b-0 lg:border-r dark:border-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Como usar</h3>
                  <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    <li><strong>1.</strong> Selecione um workspace para enxergar o contexto.</li>
                    <li><strong>2.</strong> Abra um projeto para ver colunas e tarefas.</li>
                    <li><strong>3.</strong> Exclua itens descartáveis e confirme a operação.</li>
                  </ol>
                </div>

                {isGuest && (
                  <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                    Você está na conta guest. Os dados são compartilhados com outros visitantes.
                    Use uma conta pessoal para testes destrutivos.
                  </p>
                )}

                {busy && (
                  <p role="status" className="mt-4 rounded-xl bg-blue-50 px-3 py-3 text-sm text-blue-900">
                    Validando sessão e consultando a API...
                  </p>
                )}

                {error && (
                  <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-800">
                    {error}
                    {!pending && (
                      <button type="button" disabled={busy} className="ml-3 underline" onClick={() => void openPanel()}>
                        Tentar novamente
                      </button>
                    )}
                  </div>
                )}

                <section className="mt-6" aria-label="Filtros por workspace">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">Workspaces</h3>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{workspaces.length} total</span>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => { setWorkspaceFilter(ALL_WORKSPACES); setProjectId(""); setProjectLoaded(false); setColumns([]); setTasks([]); }}
                      className={`rounded-2xl border px-4 py-3 text-left ${workspaceFilter === ALL_WORKSPACES ? "border-blue-500 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-900"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong>Todos os workspaces</strong>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{projects.length} projeto{projects.length === 1 ? "" : "s"}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Use esta opção para ver tudo junto.</p>
                    </button>

                    {workspaces.map((workspace) => {
                      const count = projectCountInWorkspace(projects, workspace.id);
                      const active = workspaceFilter === workspace.id;
                      return (
                        <div key={workspace.id} className={`rounded-2xl border px-4 py-3 ${active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => { setWorkspaceFilter(workspace.id); setProjectId(""); setProjectLoaded(false); setColumns([]); setTasks([]); }}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <strong>{humanName(workspace)}</strong>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{count} projeto{count === 1 ? "" : "s"}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {count === 0 ? "Workspace vazio: pode ser excluído." : "Selecione para listar apenas os projetos deste workspace."}
                            </p>
                          </button>
                          <div className="mt-3">
                            <button
                              type="button"
                              disabled={busy || !canDeleteWorkspace(projects, workspace.id, loaded)}
                              title={count ? "Exclua os projetos vinculados antes" : "Excluir workspace vazio"}
                              onClick={() => ask({ kind: "workspace", id: workspace.id }, humanName(workspace), "Este workspace vazio será excluído.")}
                              className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Excluir workspace
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </aside>

              <main className="overflow-y-auto p-5">
                <section aria-label="Projetos">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">Projetos</h3>
                      <p className="text-sm text-slate-500">Os projetos são exibidos agrupados por workspace para evitar confusão entre nomes repetidos.</p>
                    </div>
                    {workspaceFilter !== ALL_WORKSPACES && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { setWorkspaceFilter(ALL_WORKSPACES); setProjectId(""); setProjectLoaded(false); setColumns([]); setTasks([]); }}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      >
                        Limpar filtro de workspace
                      </button>
                    )}
                  </div>

                  {loaded && projects.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">Nenhum projeto encontrado para esta conta.</p>}
                  {loaded && projects.length > 0 && workspaceGroups.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">Nenhum projeto corresponde ao workspace selecionado.</p>}

                  <div className="mt-4 space-y-5">
                    {workspaceGroups.map((group) => (
                      <section key={group.workspaceId} className="rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/40">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h4 className="font-semibold">{group.workspaceName}</h4>
                              <p className="text-xs text-slate-500">{group.projects.length} projeto{group.projects.length === 1 ? "" : "s"} neste contexto</p>
                            </div>
                            {group.workspaceId !== NO_WORKSPACE && (
                              <span className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600">workspace</span>
                            )}
                          </div>
                        </div>
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                          {group.projects.map((project) => {
                            const duplicate = (duplicateProjectNames.get(humanName(project)) ?? 0) > 1;
                            const isSelected = project.id === projectId;
                            const workspaceName = group.workspaceName;
                            return (
                              <li key={project.id} className="px-4 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <strong className="text-base">{humanName(project)}</strong>
                                      {isSelected && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-900">selecionado</span>}
                                      {duplicate && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">nome repetido</span>}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                      Workspace: <strong>{workspaceName}</strong>
                                      {duplicate && <> · ID curto: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{shortId(project.id)}</code></>}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => void selectProject(project.id, workspaceIdOf(project) || undefined)}
                                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
                                    >
                                      Ver tarefas e colunas
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => ask({ kind: "project", id: project.id }, humanName(project), `O projeto \"${humanName(project)}\" e todo o seu conteúdo serão removidos permanentemente.`)}
                                      className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
                                    >
                                      Excluir projeto
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))}
                  </div>
                </section>

                {selectedProject && (
                  <section aria-label="Detalhes do projeto selecionado" className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projeto selecionado</p>
                          <h3 className="mt-1 text-xl font-bold">{humanName(selectedProject)}</h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Workspace: <strong>{selectedWorkspace ? humanName(selectedWorkspace) : "Projetos sem workspace"}</strong>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1">{columns.length} coluna{columns.length === 1 ? "" : "s"}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">{tasks.length} tarefa{tasks.length === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {!projectLoaded && <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">Carregando colunas e tarefas do projeto...</p>}
                      {projectLoaded && columns.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">O projeto ainda não possui colunas.</p>}

                      {projectLoaded && columns.length > 0 && (
                        <div className="space-y-4">
                          {columns.map((column) => {
                            const count = taskCountInColumn(tasks, column.id);
                            const columnTasks = tasks.filter((task) => columnIdOf(task) === column.id);
                            return (
                              <article key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-base font-semibold">{humanName(column)}</h4>
                                      <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600 shadow-sm">{count} tarefa{count === 1 ? "" : "s"}</span>
                                      {count === 0 ? (
                                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">coluna vazia</span>
                                      ) : (
                                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">remova as tarefas primeiro</span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">Exclua as tarefas individualmente; a coluna só pode ser removida quando estiver vazia.</p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={busy || !canDeleteColumn(tasks, column.id, projectLoaded)}
                                    title={count ? "Mova ou exclua as tarefas antes de remover a coluna" : "Excluir coluna vazia"}
                                    onClick={() => ask({ kind: "column", projectId, id: column.id }, humanName(column), "Esta coluna vazia será excluída.")}
                                    className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Excluir coluna
                                  </button>
                                </div>

                                {columnTasks.length > 0 ? (
                                  <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                                    {columnTasks.map((task) => (
                                      <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                                        <div>
                                          <strong>{humanName(task)}</strong>
                                          <p className="text-xs text-slate-500">Coluna: {humanName(column)}</p>
                                        </div>
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => ask({ kind: "task", projectId, id: task.id }, humanName(task), "Esta tarefa e seus comentários serão excluídos.")}
                                          className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
                                        >
                                          Excluir tarefa
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">Nenhuma tarefa nesta coluna. Ela já pode ser excluída.</p>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </main>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <div style={{ zIndex: 80 }} className="fixed inset-0 flex items-center justify-center bg-slate-950/80 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
            <h2 id="delete-title" className="text-xl font-bold">Confirmar exclusão</h2>
            <p className="mt-3 text-sm">Você está prestes a excluir <strong>{pending.name}</strong>.</p>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">{pending.description}</p>
            {needsTyping && (
              <label className="mt-5 block text-sm font-medium">
                Digite <strong>EXCLUIR</strong> para confirmar:
                <input
                  autoFocus
                  autoComplete="off"
                  disabled={busy}
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  value={typed}
                  onChange={(event: { target: { value: string } }) => setTyped(event.target.value)}
                />
              </label>
            )}
            {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => { setPending(null); setTyped(""); setError(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40">Cancelar</button>
              <button type="button" disabled={busy || Boolean(needsTyping && typed !== "EXCLUIR")} onClick={() => void confirmDeletion()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Excluindo..." : "Confirmar exclusão"}</button>
            </div>
          </section>
        </div>
      )}
    </>,
    portalRoot
  );
}
