import type { Column, Member, Priority, Project, Task, Workspace } from "@/types/board";
import { clearAuthToken, getAuthToken } from "@/lib/auth-client";

export const apiUrl = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");
export const isApiMode = Boolean(apiUrl);
export const UNASSIGNED_WORKSPACE_ID = "workspace-sem-vinculo";

export type ApiWorkspace = { id: string; name: string; description: string | null };
export type ApiProject = { id: string; name: string; description: string | null; workspaceId: string | null; createdAt: string };
export type ApiColumn = { id: string; projectId: string; title: string; position: number; color: string };
export type ApiComment = { id: string; authorId: string; message: string; createdAt: string };
export type ApiTask = {
  id: string; projectId: string; columnId: string; title: string; description: string | null;
  priority: string; position: number; dueDate: string | null; createdAt: string; updatedAt: string;
  assigneeId?: string | null; tags?: string[]; comments?: ApiComment[];
};

export async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!isApiMode) throw new Error("A URL da API Java não foi configurada.");
  const token = getAuthToken();
  if (!token) throw new Error("Sessão ausente. Entre novamente.");
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiUrl}${path}`, { cache: "no-store", ...options, headers });
  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event("orquestria:auth-expired"));
    throw new Error("A sessão expirou. Entre novamente.");
  }
  if (!response.ok) {
    const body = (await response.text()).slice(0, 240);
    throw new Error(`API Java: HTTP ${response.status}${body ? ` — ${body}` : ""}`);
  }
  return response.json() as Promise<T>;
}

export function postApi<T>(path: string, data: unknown) {
  return requestApi<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

const priorityToApi: Record<Priority, string> = { baixa: "BAIXA", media: "MEDIA", alta: "ALTA", critica: "CRITICA" };
export function toApiPriority(priority: Priority) { return priorityToApi[priority]; }
export function toApiDate(value?: string) { return value?.slice(0, 10) || null; }
function toPriority(priority: string): Priority {
  const value = priority?.toLowerCase();
  return value === "baixa" || value === "alta" || value === "critica" ? value : "media";
}
function mapColumn(column: ApiColumn): Column {
  return {
    id: column.id, projectId: column.projectId, title: column.title, order: column.position,
    color: column.color.startsWith("bg-") ? column.color : "bg-slate-400"
  };
}
function mapTask(task: ApiTask, member: Member): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    columnId: task.columnId,
    title: task.title,
    description: task.description || "",
    priority: toPriority(task.priority),
    assigneeId: task.assigneeId || member.id,
    dueDate: task.dueDate ? `${task.dueDate}T12:00:00.000Z` : "",
    tags: task.tags || [],
    comments: (task.comments || []).map((comment) => ({ ...comment })),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

/** Dados do servidor são a fonte de verdade. Não importa dados locais ou DummyJSON. */
export async function loadRemoteBoard(member: Member): Promise<Workspace[]> {
  const [spaces, projects] = await Promise.all([
    requestApi<ApiWorkspace[]>("/api/workspaces"), requestApi<ApiProject[]>("/api/projects")
  ]);
  const spaceMap = new Map<string, Workspace>();
  for (const space of spaces) {
    spaceMap.set(space.id, { id: space.id, name: space.name,
      description: space.description || "", projects: [], columns: [], tasks: [], members: [member] });
  }
  if (projects.some((project) => !project.workspaceId || !spaceMap.has(project.workspaceId))) {
    spaceMap.set(UNASSIGNED_WORKSPACE_ID, {
      id: UNASSIGNED_WORKSPACE_ID, name: "Projetos sem workspace",
      description: "Projetos criados antes da associação a um workspace.",
      projects: [], columns: [], tasks: [], members: [member]
    });
  }
  const boardData = await Promise.all(projects.map(async (project) => {
    const [columns, tasks] = await Promise.all([
      requestApi<ApiColumn[]>(`/api/projects/${project.id}/columns`),
      requestApi<ApiTask[]>(`/api/projects/${project.id}/tasks`)
    ]);
    return { project, columns, tasks };
  }));
  for (const { project, columns, tasks } of boardData) {
    const workspace = (project.workspaceId && spaceMap.get(project.workspaceId)) || spaceMap.get(UNASSIGNED_WORKSPACE_ID);
    if (!workspace) continue;
    workspace.projects.push({ id: project.id, workspaceId: workspace.id, name: project.name,
      description: project.description || "", visibility: "equipe", createdAt: project.createdAt } satisfies Project);
    workspace.columns.push(...columns.map(mapColumn));
    workspace.tasks.push(...tasks.map((task) => mapTask(task, member)));
  }
  for (const space of spaceMap.values()) {
    // Responsáveis existentes na API podem ser diferentes do usuário demonstrativo atual.
    const known = new Set(space.members.map((member) => member.id));
    for (const task of space.tasks) {
      if (!known.has(task.assigneeId)) {
        space.members.push({ id: task.assigneeId, name: `Responsável ${task.assigneeId.slice(0, 8)}`,
          email: "", role: "editor", avatar: "" });
        known.add(task.assigneeId);
      }
    }
  }
  return Array.from(spaceMap.values());
}
