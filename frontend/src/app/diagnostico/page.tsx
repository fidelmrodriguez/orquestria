"use client";

import { FormEvent, useState } from "react";
import { getAuthToken } from "@/lib/auth-client";

type Projeto = { id: string; name: string; description: string | null; createdAt: string; workspaceId?: string | null };
type Workspace = { id: string; name: string; description: string | null };
type Coluna = { id: string; projectId: string; title: string; position: number; color: string };
type Tarefa = { id: string; projectId: string; columnId: string; title: string; priority: string; position: number };

const apiUrl = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL ?? "").trim().replace(/\/$/, "");

async function parseJson(res: Response): Promise<unknown> {
  const raw = await res.text();
  try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (path !== "/actuator/health" && !token) throw new Error("Entre no Orquestria antes de acessar o diagnóstico.");
  const headers = new Headers(options?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiUrl}${path}`, { cache: "no-store", ...options, headers });
  const body = await parseJson(response);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body as T;
}
const jsonPost = (value: unknown): RequestInit => ({
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
});

export default function DiagnosticoPage() {
  const [health, setHealth] = useState("Ainda não testado");
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [columns, setColumns] = useState<Coluna[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskColumn, setTaskColumn] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadBoard(projectId: string) {
    if (!projectId) { setColumns([]); setTasks([]); return; }
    const [loadedColumns, loadedTasks] = await Promise.all([
      request<Coluna[]>(`/api/projects/${projectId}/columns`),
      request<Tarefa[]>(`/api/projects/${projectId}/tasks`),
    ]);
    setColumns(loadedColumns);
    setTasks(loadedTasks);
    setTaskColumn(current => loadedColumns.some(c => c.id === current) ? current : (loadedColumns[0]?.id ?? ""));
  }

  async function check() {
    if (!apiUrl) return;
    setBusy(true);
    setMessage("");
    try {
      console.info("[Orquestria] Consultando API Java no Blitz");
      const [status, list, spaces] = await Promise.all([
        request<unknown>("/actuator/health"),
        request<Projeto[]>("/api/projects"),
        request<Workspace[]>("/api/workspaces"),
      ]);
      setHealth(JSON.stringify(status));
      setProjects(list);
      setWorkspaces(spaces);
      const projectId = list.some(p => p.id === selectedProject) ? selectedProject : (list[0]?.id ?? "");
      setSelectedProject(projectId);
      await loadBoard(projectId);
      setMessage(`API respondendo; ${list.length} projeto(s), ${spaces.length} workspace(s).`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Orquestria] Erro ao consultar API:", detail);
      setMessage(detail);
    } finally { setBusy(false); }
  }

  async function saveWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceName.trim() || !apiUrl) return;
    setBusy(true);
    try {
      const created = await request<Workspace>("/api/workspaces", jsonPost({name: workspaceName.trim()}));
      setWorkspaces(previous => [created, ...previous]);
      setSelectedWorkspace(created.id);
      setWorkspaceName("");
      setMessage(`Workspace "${created.name}" salvo no PostgreSQL.`);
    } catch(error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !apiUrl) return;
    setBusy(true);
    try {
      const created = await request<Projeto>("/api/projects", jsonPost({
        name: name.trim(),
        description: "Criado pela página de diagnóstico",
        ...(selectedWorkspace ? {workspaceId: selectedWorkspace} : {}),
      }));
      setProjects(previous => [created, ...previous]);
      setSelectedProject(created.id);
      setColumns([]);
      setTasks([]);
      setTaskColumn("");
      setName("");
      setMessage("Projeto salvo no PostgreSQL. Atualize a página e consulte novamente.");
    } catch(error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }

  async function saveColumn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!columnName.trim() || !selectedProject) return;
    setBusy(true);
    try {
      await request<Coluna>(`/api/projects/${selectedProject}/columns`, jsonPost({
        title: columnName.trim(), position: columns.length, color: "slate",
      }));
      setColumnName("");
      await loadBoard(selectedProject);
      setMessage("Coluna salva no PostgreSQL.");
    } catch(error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim() || !taskColumn || !selectedProject) return;
    setBusy(true);
    try {
      await request<Tarefa>(`/api/projects/${selectedProject}/tasks`, jsonPost({
        title: taskTitle.trim(), columnId: taskColumn, priority: "MEDIA", position: tasks.length,
      }));
      setTaskTitle("");
      await loadBoard(selectedProject);
      setMessage("Tarefa salva no PostgreSQL.");
    } catch(error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }

  async function moveTask(task: Tarefa, columnId: string) {
    if (!selectedProject || task.columnId === columnId) return;
    const projectId = selectedProject;
    const targetColumn = columns.find(column => column.id === columnId)?.title ?? columnId;
    setBusy(true);
    setMessage(`Movendo "${task.title}" para "${targetColumn}"...`);

    try {
      const updated = await request<Tarefa>(`/api/projects/${projectId}/tasks/${task.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, position: task.position }),
      });
      console.info("[Orquestria] Resposta da movimentação (POST)", {
        taskId: task.id, previousColumnId: task.columnId,
        requestedColumnId: columnId, returnedColumnId: updated.columnId,
      });
      if (updated.columnId !== columnId) {
        throw new Error("A API respondeu à movimentação, mas devolveu a coluna anterior.");
      }

      // Consulta novamente o backend após a movimentação. A confirmação não depende do estado local.
      // O parâmetro serve para distinguir a leitura de qualquer resposta cacheada em proxies.
      const persistedTasks = await request<Tarefa[]>(
        `/api/projects/${projectId}/tasks?verificacao=${Date.now()}`,
        { cache: "no-store" },
      );
      setTasks(persistedTasks);
      const persisted = persistedTasks.find(item => item.id === task.id);
      console.info("[Orquestria] Leitura após mover tarefa", {
        taskId: task.id, expectedColumnId: columnId,
        persistedColumnId: persisted?.columnId ?? null,
      });
      if (!persisted) {
        throw new Error("A API respondeu à movimentação, mas a tarefa não apareceu na nova consulta.");
      }
      if (persisted.columnId !== columnId) {
        throw new Error("A API aceitou a movimentação, mas a consulta seguinte retornou a coluna anterior.");
      }
      setMessage(`Confirmado no PostgreSQL: "${task.title}" está em "${targetColumn}". Você pode atualizar a página.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Orquestria] Falha ao mover ou confirmar tarefa", {
        taskId: task.id, projectId, expectedColumnId: columnId, error: detail,
      });
      setMessage(`Movimentação não confirmada: ${detail}`);
      // Restaura a apresentação usando a fonte real dos dados, sem simular sucesso.
      try { await loadBoard(projectId); } catch (reloadError) {
        console.error("[Orquestria] Não foi possível recarregar o quadro", reloadError);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-slate-900">
      <a className="text-sm underline" href="/">Voltar ao Orquestria</a>
      <h1 className="mt-6 text-3xl font-semibold">Diagnóstico da API</h1>
      <p className="mt-3 text-slate-600">Testes de integração entre o frontend no Netlify, o backend Java no Blitz e o PostgreSQL no Neon.</p>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Endereço configurado da API</p>
        <p className="mt-1 break-all font-mono text-sm">{apiUrl || "Configure NEXT_PUBLIC_ORQUESTRIA_API_URL no Netlify."}</p>
        <p className="mt-4 break-all text-sm"><strong>Saúde:</strong> {health}</p>
        <button className="mt-4 rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-40" disabled={!apiUrl || busy}
          onClick={check} type="button">{busy ? "Consultando..." : "Verificar conexão e atualizar dados"}</button>
        {message && <p className="mt-4 break-words text-sm text-slate-700" aria-live="polite">{message}</p>}
      </section>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={saveWorkspace}>
          <input className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3" aria-label="Nome do workspace"
            placeholder="Ex.: Operação Digital" maxLength={120} value={workspaceName} onChange={e => setWorkspaceName(e.target.value)}/>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" disabled={!apiUrl || busy || !workspaceName.trim()} type="submit">Criar workspace</button>
        </form>
        <p className="mt-3 text-sm text-slate-600">{workspaces.length} workspace(s) carregado(s).</p>
        {workspaces.length > 0 && <ul className="mt-2 list-inside list-disc text-sm">{workspaces.map(w => <li key={w.id}>{w.name}</li>)}</ul>}
      </section>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Projetos</h2>
        <p className="mt-2 text-sm text-slate-600">Crie projetos de demonstração e, se quiser, associe-os a um workspace.</p>
        <form className="mt-3 flex flex-col gap-2" onSubmit={saveProject}>
          <input className="rounded-lg border border-slate-300 p-3" aria-label="Nome do projeto"
            placeholder="Ex.: Projeto de demonstração" maxLength={120} value={name} onChange={e => setName(e.target.value)}/>
          <select className="rounded-lg border border-slate-300 p-3" value={selectedWorkspace} onChange={e => setSelectedWorkspace(e.target.value)} aria-label="Workspace do projeto">
            <option value="">Sem workspace</option>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" disabled={!apiUrl || busy || !name.trim()} type="submit">Salvar projeto no PostgreSQL</button>
        </form>
        <ul className="mt-4 divide-y divide-slate-200">
          {projects.map(p => <li className="py-2" key={p.id}>
            <p className="font-medium">{p.name}</p><p className="break-all font-mono text-xs text-slate-500">{p.id}</p>
          </li>)}
        </ul>
      </section>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Kanban — API Java</h2>
        <p className="mt-2 text-sm text-slate-600">Selecione um projeto e teste colunas, tarefas e movimentação. Este painel é separado do quadro principal.</p>
        <select className="mt-3 w-full rounded-lg border border-slate-300 p-3" aria-label="Projeto do quadro" value={selectedProject}
          onChange={async e => {
            const id = e.target.value;
            setSelectedProject(id);
            try { await loadBoard(id); } catch(err) { setMessage(String(err)); }
          }}>
          <option value="">Selecione um projeto</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selectedProject && <>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={saveColumn}>
            <input className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3" placeholder="Ex.: Backlog" aria-label="Nome da coluna"
              maxLength={80} value={columnName} onChange={e => setColumnName(e.target.value)}/>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" type="submit" disabled={busy || !columnName.trim()}>Criar coluna</button>
          </form>
          <p className="mt-3 text-sm text-slate-600">Colunas: {columns.length}</p>
          <ul className="mt-1 list-inside list-disc text-sm">{columns.map(c => <li key={c.id}>{c.title}</li>)}</ul>
          <form className="mt-4 flex flex-col gap-2" onSubmit={saveTask}>
            <input className="rounded-lg border border-slate-300 p-3" placeholder="Ex.: Implementar endpoints" aria-label="Título da tarefa"
              maxLength={180} value={taskTitle} onChange={e => setTaskTitle(e.target.value)}/>
            <select className="rounded-lg border border-slate-300 p-3" aria-label="Coluna inicial da tarefa" value={taskColumn} onChange={e => setTaskColumn(e.target.value)}>
              <option value="">Selecione a coluna</option>
              {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" type="submit"
              disabled={busy || !taskTitle.trim() || !taskColumn}>Criar tarefa</button>
          </form>
          <h3 className="mt-5 font-semibold">Tarefas no PostgreSQL ({tasks.length})</h3>
          <ul className="mt-2 divide-y divide-slate-200">
            {tasks.map(task => <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between" key={task.id}>
              <span className="text-sm font-medium">{task.title}</span>
              <select className="rounded-lg border border-slate-300 p-2 text-sm" aria-label={`Mover tarefa ${task.title}`} value={task.columnId}
                disabled={busy} onChange={e => void moveTask(task, e.target.value)}>
                {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </li>)}
          </ul>
        </>}
      </section>
      <p className="mt-6 text-sm text-slate-600">Faça login no Orquestria antes de utilizar esta página. As consultas usam sua sessão e só mostram dados da sua conta. A conta guest é pública e compartilhada.</p>
    </main>
  );
}
