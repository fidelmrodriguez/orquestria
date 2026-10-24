"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth-client";
import {
  apiRequest, humanName, targetPath, unpackList,
  type DeleteTarget, type Entity
} from "@/lib/kanban-deletion";

const API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");

type PendingDeletion = { target: DeleteTarget; label: string; impact: string };

const keyOf = (item: Entity) => item.id;
const byName = (a: Entity, b: Entity) => humanName(a).localeCompare(humanName(b), "pt-BR");

export default function GerenciarPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [workspaces, setWorkspaces] = useState<Entity[]>([]);
  const [projects, setProjects] = useState<Entity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [columns, setColumns] = useState<Entity[]>([]);
  const [tasks, setTasks] = useState<Entity[]>([]);
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    setToken(getAuthToken());
    setReady(true);
  }, []);

  const refreshOverview = useCallback(async (accessToken: string) => {
    const [workspaceResult, projectResult] = await Promise.all([
      apiRequest(API_BASE, "/api/workspaces", accessToken),
      apiRequest(API_BASE, "/api/projects", accessToken)
    ]);
    setWorkspaces(unpackList(workspaceResult).sort(byName));
    setProjects(unpackList(projectResult).sort(byName));
  }, []);

  const refreshProject = useCallback(async (projectId: string, accessToken: string) => {
    setDependenciesLoaded(false);
    const [columnResult, taskResult] = await Promise.all([
      apiRequest(API_BASE, `/api/projects/${encodeURIComponent(projectId)}/columns`, accessToken),
      apiRequest(API_BASE, `/api/projects/${encodeURIComponent(projectId)}/tasks`, accessToken)
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
      setColumns([]); setTasks([]); setDependenciesLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true); setError(null);
      try { await refreshProject(selectedProjectId, token); }
      catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Erro ao carregar quadro."); }
      finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedProjectId, token, refreshProject]);

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
      await apiRequest(API_BASE, targetPath(target), token, "DELETE");
      setPending(null); setConfirmation("");
      if (target.kind === "project" && target.id === selectedProjectId) {
        setSelectedProjectId(""); setColumns([]); setTasks([]);
      }
      await refreshOverview(token);
      if (target.kind !== "project" && selectedProjectId) await refreshProject(selectedProjectId, token);
      setMessage("Exclusão confirmada pela API. As listas foram atualizadas. Ao voltar ao quadro, recarregue a página.");
    } catch (cause) {
      // Não fechamos a confirmação em caso de falha: o usuário vê o motivo do erro.
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o item.");
    } finally { setBusy(false); }
  }

  const selectedProject = projects.find(project => project.id === selectedProjectId);
  const linkedProjects = (workspaceId: string) => projects.filter(project => project.workspaceId === workspaceId).length;
  const tasksInColumn = (columnId: string) => tasks.filter(task => task.columnId === columnId).length;
  const destructive = pending?.target.kind === "workspace" || pending?.target.kind === "project";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-600 dark:text-blue-400">Orquestria · Etapa 6</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Gerenciar exclusões</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Operações reais na API Java. Use uma conta pessoal e recursos descartáveis para testar.</p>
          </div>
          <a href="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900">Voltar ao Kanban</a>
        </header>

        {!ready ? <p>Carregando sessão...</p> : !API_BASE ?
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">URL da API não configurada no Netlify.</p> : !token ?
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">Não há sessão ativa. <a className="underline" href="/">Volte à página inicial para entrar</a>.</div> : <>
          <div aria-live="polite" className="space-y-2">
            {busy && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">Consultando ou atualizando dados no servidor...</p>}
            {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{message}</p>}
          </div>

          <section aria-labelledby="projects-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 id="projects-title" className="text-xl font-semibold">Projetos</h2>
            <p className="mt-1 text-sm text-slate-500">Excluir um projeto apaga também suas colunas, tarefas e comentários.</p>
            {projects.length === 0 && <p className="mt-4 text-sm">Nenhum projeto cadastrado nesta conta.</p>}
            <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
              {projects.map(project => <li key={keyOf(project)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="font-medium">{humanName(project)}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => setSelectedProjectId(project.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700">Ver colunas e tarefas</button>
                  <button type="button" disabled={busy} onClick={() => askDelete({ kind: "project", id: project.id }, humanName(project), "Todas as colunas, tarefas e comentários desse projeto serão removidos permanentemente.")} className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300">Excluir projeto</button>
                </div>
              </li>)}
            </ul>
          </section>

          {selectedProject && <section aria-labelledby="items-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 id="items-title" className="text-xl font-semibold">Quadro: {humanName(selectedProject)}</h2>
            <p className="mt-1 text-sm text-slate-500">Primeiro exclua ou mova as tarefas. Uma coluna com tarefas não pode ser excluída.</p>
            {!dependenciesLoaded ? <p className="mt-4 text-sm">Carregando colunas e tarefas para validação...</p> :
            <div className="mt-5 space-y-5">
              {columns.length === 0 && <p>O projeto não tem colunas.</p>}
              {columns.map(column => {
                const numberOfTasks = tasksInColumn(column.id);
                const columnTasks = tasks.filter(task => task.columnId === column.id);
                return <div key={column.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">{humanName(column)} <span className="text-xs font-normal text-slate-500">({numberOfTasks} tarefa{numberOfTasks !== 1 ? "s" : ""})</span></h3>
                    <button type="button" disabled={busy || numberOfTasks > 0} title={numberOfTasks ? "Mova ou exclua as tarefas antes" : "Excluir coluna vazia"} onClick={() => askDelete({ kind: "column", projectId: selectedProjectId, id: column.id }, humanName(column), "A coluna vazia será removida do quadro.")} className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-300">Excluir coluna</button>
                  </div>
                  <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {columnTasks.map(task => <li key={task.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>{humanName(task)}</span>
                      <button type="button" disabled={busy} onClick={() => askDelete({ kind: "task", projectId: selectedProjectId, id: task.id }, humanName(task), "A tarefa e seus comentários serão excluídos permanentemente.")} className="rounded-lg px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300">Excluir tarefa</button>
                    </li>)}
                  </ul>
                </div>;
              })}
              {tasks.filter(task => !task.columnId || !columns.some(column => column.id === task.columnId)).length > 0 && <p className="text-sm text-amber-700">Há tarefas sem coluna correspondente na resposta da API; nenhuma exclusão de coluna é sugerida para elas.</p>}
            </div>}
          </section>}

          <section aria-labelledby="workspaces-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 id="workspaces-title" className="text-xl font-semibold">Workspaces</h2>
            <p className="mt-1 text-sm text-slate-500">Um workspace só pode ser removido quando não possuir projetos vinculados.</p>
            {workspaces.length === 0 && <p className="mt-4 text-sm">Nenhum workspace cadastrado nesta conta.</p>}
            <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
              {workspaces.map(workspace => <li key={workspace.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{humanName(workspace)} <span className="text-xs text-slate-500">· {linkedProjects(workspace.id)} projeto(s)</span></span>
                <button type="button" disabled={busy || linkedProjects(workspace.id) > 0} title={linkedProjects(workspace.id) ? "Exclua ou mova os projetos vinculados antes" : "Excluir workspace vazio"} onClick={() => askDelete({ kind: "workspace", id: workspace.id }, humanName(workspace), "O workspace vazio será excluído permanentemente.")} className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-300">Excluir workspace</button>
              </li>)}
            </ul>
          </section>
          <p className="text-xs text-slate-500">Esta página usa os endpoints da Etapa 6. A API é responsável por validar propriedade e dependências; nenhuma exclusão acontece sem confirmação.</p>
        </>}
      </div>

      {pending && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8">
        <section role="dialog" aria-modal="true" aria-labelledby="delete-heading" className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
          <h2 id="delete-heading" className="text-xl font-bold">Confirmar exclusão</h2>
          <p className="mt-3 text-sm">Você está prestes a excluir <strong>{pending.label}</strong>.</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{pending.impact}</p>
          {destructive && <label className="mt-5 block text-sm font-medium">Digite <strong>EXCLUIR</strong> para confirmar:
            <input className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" autoFocus disabled={busy} />
          </label>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" disabled={busy} onClick={() => { setPending(null); setConfirmation(""); setError(null); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancelar</button>
            <button type="button" disabled={busy || (destructive && confirmation !== "EXCLUIR")} onClick={() => void confirmDelete()} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Excluindo..." : "Confirmar exclusão"}</button>
          </div>
        </section>
      </div>}
    </main>
  );
}
