"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, getAuthToken, restoreAuthSession } from "@/lib/auth-client";
import {
  apiRequest, deleteActionPath, deleteOperation, humanName, unpackList,
  type DeleteTarget, type Entity
} from "@/lib/kanban-deletion";

const API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");

type PendingDeletion = { target: DeleteTarget; label: string; impact: string };

const keyOf = (item: Entity) => item.id;
const byName = (a: Entity, b: Entity) => humanName(a).localeCompare(humanName(b), "pt-BR");

export default function GerenciarPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Entity[]>([]);
  const [projects, setProjects] = useState<Entity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("__all__");
  const [columns, setColumns] = useState<Entity[]>([]);
  const [tasks, setTasks] = useState<Entity[]>([]);
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [retryProject, setRetryProject] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    let active = true;
    // A página de gerenciamento não monta o LoginScreen. Verifica /me por conta própria.
    const verifySession = async () => {
      setReady(false);
      setSessionError(null);
      try {
        const user = await restoreAuthSession();
        if (active) setToken(user ? getAuthToken() : null);
      } catch (cause) {
        if (active) {
          setToken(null);
          setSessionError(cause instanceof Error ? cause.message : "Falha ao verificar a sessão.");
        }
      } finally {
        if (active) setReady(true);
      }
    };
    void verifySession();
    // Logout em outra aba deve remover imediatamente as operações destrutivas desta página.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_TOKEN_STORAGE_KEY) return;
      if (!event.newValue) {
        setToken(null);
        setSelectedProjectId("");
        setColumns([]);
        setTasks([]);
        setProjects([]);
        setWorkspaces([]);
        setReady(true);
      } else {
        void verifySession();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => { active = false; window.removeEventListener("storage", handleStorage); };
  }, []);

  const refreshOverview = useCallback(async (accessToken: string) => {
    const [workspaceResult, projectResult, invitedResult] = await Promise.all([
      apiRequest(API_BASE, "/api/workspaces", accessToken, "GET", "listar-workspaces"),
      apiRequest(API_BASE, "/api/projects", accessToken, "GET", "listar-projetos"),
      apiRequest(API_BASE, "/api/projects/invited", accessToken, "GET", "listar-projetos")
    ]);
    const shared = unpackList(invitedResult).map(item => ({ ...item,
      workspaceId: item.workspaceId ? `invited-${item.workspaceId}` : `invited-unassigned-${item.id}`
    }));
    const sharedSpaces = shared.map(item => ({ id: item.workspaceId!,
      name: `${item.workspaceName || "Projetos compartilhados"} (convidado)`, invited: true }));
    const ownedSpaces = unpackList(workspaceResult);
    setWorkspaces([...ownedSpaces, ...sharedSpaces.filter((space, idx, all) => all.findIndex(entry => entry.id === space.id) === idx)].sort(byName));
    setProjects([...unpackList(projectResult), ...shared].sort(byName));
  }, []);

  const refreshProject = useCallback(async (projectId: string, accessToken: string) => {
    setDependenciesLoaded(false);
    setProjectError(null);
    const [columnResult, taskResult] = await Promise.all([
      apiRequest(API_BASE, `/api/projects/${encodeURIComponent(projectId)}/columns`, accessToken, "GET", "listar-colunas"),
      apiRequest(API_BASE, `/api/projects/${encodeURIComponent(projectId)}/tasks`, accessToken, "GET", "listar-tarefas")
    ]);
    setColumns(unpackList(columnResult).sort((a,b) => (a.position ?? 0) - (b.position ?? 0)));
    setTasks(unpackList(taskResult).sort((a,b) => (a.position ?? 0) - (b.position ?? 0)));
    setDependenciesLoaded(true);
  }, []);

  useEffect(() => {
    if (!ready || !token || !API_BASE) return;
    let cancelled = false;
    (async () => {
      setBusy(true); setError(null);
      try { await refreshOverview(token); }
      catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Erro ao carregar os dados."); }
      finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [ready, token, refreshOverview]);

  useEffect(() => {
    if (!selectedProjectId || !token) {
      setColumns([]); setTasks([]); setDependenciesLoaded(false); setProjectError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true); setError(null);
      try { await refreshProject(selectedProjectId, token); }
      catch (cause) {
        if (!cancelled) {
          const reason = cause instanceof Error ? cause.message : "Erro ao carregar quadro.";
          setError(reason);
          setProjectError(reason);
          // Falha de consulta não deve deixar um indicador de carregamento eterno.
          setDependenciesLoaded(true);
        }
      }
      finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedProjectId, token, refreshProject, retryProject]);

  function askDelete(target: DeleteTarget, label: string, impact: string) {
    setError(null); setMessage(null); setConfirmation("");
    setPending({ target, label, impact });
  }

  async function confirmDelete() {
    if (!pending || !token || busy) return;
    if ((pending.target.kind === "project" || pending.target.kind === "workspace") && confirmation !== "EXCLUIR") return;
    const target = pending.target;
    setBusy(true); setError(null); setMessage(null);
    try {
      // O navegador tinha o preflight de DELETE bloqueado. A rota POST explícita
      // reutiliza o mesmo serviço transacional e as mesmas validações no Java.
      await apiRequest(API_BASE, deleteActionPath(target), token, "POST", deleteOperation(target));
      setPending(null); setConfirmation("");
      if (target.kind === "project" && target.id === selectedProjectId) {
        setSelectedProjectId(""); setColumns([]); setTasks([]);
      }
      // Nunca confundir falha na releitura com falha na exclusão já confirmada.
      try {
        await refreshOverview(token);
        if (target.kind !== "project" && selectedProjectId) await refreshProject(selectedProjectId, token);
        setMessage("Exclusão confirmada pela API. As listas foram atualizadas. Ao voltar ao quadro, recarregue a página.");
      } catch (refreshFailure) {
        console.warn("[Orquestria][gerenciar] exclusao_confirmada_releitura_falhou", {
          operacao: deleteOperation(target),
          tipo: refreshFailure instanceof Error ? refreshFailure.name : "desconhecido"
        });
        setMessage("A API confirmou a exclusão, mas não foi possível atualizar a lista. Atualize a página antes de tentar outra operação.");
      }
    } catch (cause) {
      // Não fechamos a confirmação em caso de falha: o usuário vê o motivo do erro.
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o item.");
    } finally { setBusy(false); }
  }

  const selectedProject = projects.find(project => project.id === selectedProjectId);
  const linkedProjects = (workspaceId: string) => projects.filter(project => project.workspaceId === workspaceId).length;
  const tasksInColumn = (columnId: string) => tasks.filter(task => task.columnId === columnId).length;
  const destructive = pending?.target.kind === "workspace" || pending?.target.kind === "project";
  const workspaceMap = new Map(workspaces.map(workspace => [workspace.id, workspace]));
  const workspaceName = (project: Entity) => project.workspaceId
    ? humanName(workspaceMap.get(project.workspaceId) ?? { id: project.workspaceId })
    : "Sem workspace";
  const duplicateCounts = new Map<string, number>();
  projects.forEach(project => duplicateCounts.set(humanName(project), (duplicateCounts.get(humanName(project)) ?? 0) + 1));
  const visibleProjects = projects.filter(project => workspaceFilter === "__all__" ||
    (workspaceFilter === "__none__" ? !project.workspaceId : project.workspaceId === workspaceFilter));
  const groupIds = Array.from(new Set(visibleProjects.map(project => project.workspaceId || "__none__")));
  const selectedWorkspaceName = selectedProject ? workspaceName(selectedProject) : "";
  const hasOrphanTasks = tasks.some(task => !task.columnId || !columns.some(col => col.id === task.columnId));


  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-8">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-600">Orquestria / Gerenciamento</p>
            <h1 className="mt-2 text-3xl font-bold">Gerenciar itens</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Selecione o workspace e depois o projeto. A exclusão é permanente e sempre exige confirmação.
            </p>
          </div>
          <a href="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900">Voltar ao Kanban</a>
        </header>

        {!ready ? (
          <p role="status" className="rounded-xl bg-white px-4 py-4 text-sm shadow-sm dark:bg-slate-900">Verificando sua sessão...</p>
        ) : !API_BASE ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">URL da API não configurada no Netlify.</p>
        ) : !token ? (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            {sessionError || "Não há sessão ativa."} <a className="underline" href="/">Voltar ao login</a>
          </div>
        ) : (
          <>
            <div aria-live="polite" className="space-y-2">
              {busy && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Consultando o servidor...</p>}
              {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              {message && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
            </div>

            <div className="grid min-w-0 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
              <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <h2 className="text-lg font-bold">Workspaces</h2>
                  <p className="mt-1 text-xs text-slate-500">Filtre os projetos pelo espaço de trabalho.</p>
                </div>
                <div className="space-y-2">
                  <button type="button" disabled={busy} onClick={() => {setWorkspaceFilter("__all__");setSelectedProjectId("");}} className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-semibold ${workspaceFilter === "__all__" ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200"}`}>
                    Todos os workspaces <span className="ml-1 text-xs font-normal text-slate-500">({projects.length})</span>
                  </button>
                  {workspaces.map(workspace => {
                    const count = linkedProjects(workspace.id);
                    return (
                      <div key={workspace.id} className={`rounded-xl border px-3 py-3 ${workspaceFilter === workspace.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                        <button type="button" disabled={busy} className="w-full text-left text-sm font-semibold" onClick={() => {setWorkspaceFilter(workspace.id);setSelectedProjectId("");}}>
                          <span className="block [overflow-wrap:anywhere]">{humanName(workspace)}</span>
                          <span className="mt-1 block text-xs font-normal text-slate-500">{count} projeto{count === 1 ? "" : "s"}</span>
                        </button>
                        {!workspace.invited && <button type="button" disabled={busy || count > 0} title={count ? "Exclua primeiro os projetos vinculados" : "Excluir workspace vazio"} onClick={() => askDelete({kind:"workspace",id:workspace.id},humanName(workspace),"O workspace vazio será removido permanentemente.")} className="mt-3 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-30">Excluir workspace</button>}
                      </div>
                    );
                  })}
                  {projects.some(project=>!project.workspaceId) && (
                    <button type="button" disabled={busy} onClick={() => {setWorkspaceFilter("__none__");setSelectedProjectId("");}} className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-semibold ${workspaceFilter === "__none__" ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200"}`}>
                      Projetos sem workspace
                    </button>
                  )}
                  {workspaces.length === 0 && <p className="text-sm text-slate-500">Nenhum workspace cadastrado.</p>}
                </div>
              </aside>

              <div className="min-w-0 space-y-5">
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">Projetos</h2>
                      <p className="mt-1 text-sm text-slate-500">Cada projeto mostra seu workspace. Nomes repetidos são diferenciados por ID.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{visibleProjects.length} projeto{visibleProjects.length === 1 ? "" : "s"}</span>
                  </div>
                  {visibleProjects.length === 0 && <p className="mt-5 text-sm text-slate-500">Nenhum projeto neste filtro.</p>}
                  <div className="mt-4 space-y-4">
                    {groupIds.map(groupId => {
                      const groupProjects = visibleProjects.filter(project => (project.workspaceId || "__none__") === groupId);
                      const groupName = groupId === "__none__" ? "Sem workspace" : humanName(workspaceMap.get(groupId) ?? {id:groupId});
                      return (
                        <div key={groupId} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="bg-slate-50 px-4 py-3 dark:bg-slate-800"><h3 className="min-w-0 text-sm font-bold [overflow-wrap:anywhere]">Workspace: {groupName}</h3></div>
                          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {groupProjects.map(project => <li key={project.id} className="flex min-w-0 flex-wrap items-center justify-between gap-4 px-4 py-4">
                              <div className="min-w-0 max-w-full flex-1 basis-full sm:basis-56">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <strong className="min-w-0 max-w-full [overflow-wrap:anywhere]">{humanName(project)}</strong>
                                  {selectedProjectId === project.id && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-900">Selecionado</span>}
                                </div>
                                <p className="mt-1 max-w-full text-xs text-slate-500 [overflow-wrap:anywhere]">{workspaceName(project)}{(duplicateCounts.get(humanName(project)) ?? 0) > 1 && ` · ID: ${project.id.slice(0,8)}`}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={busy} onClick={() => setSelectedProjectId(project.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">Ver tarefas</button>
                                <button type="button" disabled={busy} onClick={() => askDelete({kind:"project",id:project.id}, `${humanName(project)} (${workspaceName(project)})`,"Todas as colunas, tarefas e comentários do projeto serão removidos.")} className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">Excluir projeto</button>
                              </div>
                            </li>)}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {selectedProject && <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Projeto selecionado</p>
                  <h2 className="mt-2 text-xl font-bold [overflow-wrap:anywhere]">{humanName(selectedProject)}</h2>
                  <p className="mt-1 text-sm text-slate-500">Workspace: <strong>{selectedWorkspaceName}</strong></p>
                  <p className="mt-1 text-sm text-slate-500">Primeiro remova ou mova as tarefas; depois exclua a coluna vazia.</p>
                  {!dependenciesLoaded ? <p role="status" className="mt-4 text-sm">Carregando colunas e tarefas...</p> : projectError ? (
                    <div role="alert" className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-800">
                      {projectError}
                      <button type="button" disabled={busy} onClick={() => setRetryProject(value => value + 1)} className="ml-3 underline">Tentar novamente</button>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {columns.length === 0 && <p className="text-sm text-slate-500">Projeto sem colunas.</p>}
                      {hasOrphanTasks && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Há tarefas sem coluna reconhecida. Confira os dados antes de excluir colunas.</p>}
                      {columns.map(column => {
                        const count = tasksInColumn(column.id);
                        const columnTasks = tasks.filter(task => task.columnId === column.id);
                        return <div key={column.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="font-bold [overflow-wrap:anywhere]">{humanName(column)} <span className="text-sm font-normal text-slate-500">({count} tarefa{count === 1 ? "" : "s"})</span></h3>
                              <p className="mt-1 text-xs text-slate-500">{count ? "Remova as tarefas desta coluna primeiro." : "Coluna vazia, pode ser excluída."}</p>
                            </div>
                            <button type="button" disabled={busy || count > 0 || hasOrphanTasks} title={count ? "A coluna contém tarefas" : "Excluir coluna vazia"} onClick={() => askDelete({kind:"column",projectId:selectedProjectId,id:column.id}, humanName(column),"A coluna vazia será excluída.")} className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-30">Excluir coluna</button>
                          </div>
                          {columnTasks.length > 0 && <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
                            {columnTasks.map(task => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><strong className="min-w-0 [overflow-wrap:anywhere]">{humanName(task)}</strong><button type="button" disabled={busy} onClick={() => askDelete({kind:"task",projectId:selectedProjectId,id:task.id},humanName(task),"A tarefa e seus comentários serão excluídos permanentemente.")} className="rounded-lg border border-rose-200 px-3 py-2 font-semibold text-rose-700">Excluir tarefa</button></li>)}
                          </ul>}
                        </div>;
                      })}
                    </div>
                  )}
                </section>}
              </div>
            </div>
          </>
        )}
      </div>

      {pending && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-heading" className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-950 shadow-2xl">
          <h2 id="delete-heading" className="text-xl font-bold">Confirmar exclusão</h2>
          <p className="mt-3 text-sm [overflow-wrap:anywhere]">Item: <strong>{pending.label}</strong></p>
          <p className="mt-2 text-sm text-rose-700">{pending.impact}</p>
          {destructive && <label className="mt-5 block text-sm font-medium">Digite <strong>EXCLUIR</strong> para confirmar:
            <input autoFocus autoComplete="off" disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-2" />
          </label>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={busy} onClick={() => {setPending(null);setConfirmation("");setError(null);}} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
            <button type="button" disabled={busy || (destructive && confirmation !== "EXCLUIR")} onClick={() => void confirmDelete()} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Excluindo..." : "Confirmar exclusão"}</button>
          </div>
        </section>
      </div>}
    </main>
  );
}
