import { readableApiError } from "@/lib/api-error";
import type { Column, Member, Priority, Project, Task, Workspace } from "@/types/board";
import { clearAuthToken, getAuthToken } from "@/lib/auth-client";

export const apiUrl = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");
export const isApiMode = Boolean(apiUrl);
export const UNASSIGNED_WORKSPACE_ID = "workspace-sem-vinculo";

/** Retém o status HTTP sem modificar as mensagens usadas pelos formulários. */
export class ApiRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** A API antiga interpreta /projects/invited como um UUID em /projects/{id}. */
export function isMissingCollaborationEndpoint(error: unknown): boolean {
  return error instanceof ApiRequestError &&
    (error.status === 404 || (error.status === 400 && error.message === "Parâmetro inválido."));
}

export type ApiWorkspace = { id: string; name: string; description: string | null };
export type ApiProject = { id: string; name: string; description: string | null; workspaceId: string | null; createdAt: string };
export type ApiInvitedProject = ApiProject & { workspaceName: string | null; ownerName: string; role: "membro-admin" };
export type ApiProjectMember = { id: string; name: string; username: string; role: "admin" | "membro-admin" };
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
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { cache: "no-store", ...options, headers });
  } catch {
    // Não descartar a sessão: o Blitz pode estar acordando ou a rede pode ter caído.
    throw new Error("Não foi possível conectar ao servidor. Sua sessão foi mantida; tente novamente.");
  }
  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event("orquestria:auth-expired"));
    throw new Error("A sessão expirou. Entre novamente.");
  }
  if (!response.ok) {
    const type = response.headers.get("content-type");
    // Não ler corpos arbitrariamente grandes de páginas HTML do provedor.
    const body = type?.toLowerCase().includes("json") ? (await response.text()).slice(0, 1024) : "";
    throw new ApiRequestError(response.status, readableApiError(response.status, type, body));
  }
  if (response.status === 204) return undefined as T;
  const type = response.headers.get("content-type")?.toLowerCase() || "";
  if (!type.includes("json")) {
    // HTML 200 do Blitz durante um cold start não é uma resposta válida da API.
    throw new Error("A API ainda está inicializando. Aguarde e tente novamente.");
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
export function mapTask(task: ApiTask, member: Member): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    columnId: task.columnId,
    position: task.position,
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

/** O frontend pode ser publicado antes do backend sem bloquear toda a aplicação.
 *  O fallback é restrito a endpoints de colaboração inexistentes na API antiga.
 *  Erros de autenticação, permissão e indisponibilidade continuam sendo propagados.
 */
async function fetchInvitedProjects(): Promise<{ invited: ApiInvitedProject[]; supported: boolean }> {
  try {
    return { invited: await requestApi<ApiInvitedProject[]>("/api/projects/invited"), supported: true };
  } catch (error) {
    if (!isMissingCollaborationEndpoint(error)) throw error;
    console.warn("[Orquestria][collaboration] Backend sem endpoints de projetos convidados. Aguarde a publicação da API com Flyway V10.");
    return { invited: [], supported: false };
  }
}

/** Dados do servidor são a fonte de verdade. Não importa dados locais ou DummyJSON. */
export async function loadRemoteBoard(member: Member): Promise<Workspace[]> {
  const [spaces, projects, teammates, collaboration] = await Promise.all([
    requestApi<ApiWorkspace[]>("/api/workspaces"),
    requestApi<ApiProject[]>("/api/projects"),
    requestApi<{id:string;name:string;username:string}[]>("/api/team/members"),
    fetchInvitedProjects()
  ]);
  const { invited, supported: collaborationSupported } = collaboration;
  const actualMembers: Member[] = [member, ...teammates.filter(user => user.id !== member.id).map(user => ({
    id: user.id, name: user.name, email: "", avatar: "", role: "editor" as const
  }))];
  const spaceMap = new Map<string, Workspace>();
  for (const space of spaces) {
    spaceMap.set(space.id, { id: space.id, name: space.name,
      description: space.description || "", projects: [], columns: [], tasks: [], members: [...actualMembers] });
  }
  if (projects.some((project) => !project.workspaceId || !spaceMap.has(project.workspaceId))) {
    spaceMap.set(UNASSIGNED_WORKSPACE_ID, {
      id: UNASSIGNED_WORKSPACE_ID, name: "Projetos sem workspace",
      description: "Projetos criados antes da associação a um workspace.",
      projects: [], columns: [], tasks: [], members: [...actualMembers]
    });
  }
  // Shared workspaces are navigation containers only: never load the owner's other projects.
  for (const project of invited) {
    const groupId = `invited-${project.workspaceId || `unassigned-${project.id}`}`;
    if (!spaceMap.has(groupId)) spaceMap.set(groupId, {
      id: groupId, name: project.workspaceName || "Projetos compartilhados",
      description: `Compartilhado por ${project.ownerName}`,
      invited: true, invitedOwner: project.ownerName,
      projects: [], columns: [], tasks: [], members: []
    });
  }
  const boardData = await Promise.all([...projects, ...invited].map(async (project) => {
    const [columns, tasks, projectMembers] = await Promise.all([
      requestApi<ApiColumn[]>(`/api/projects/${project.id}/columns`),
      requestApi<ApiTask[]>(`/api/projects/${project.id}/tasks`),
      collaborationSupported
        ? requestApi<ApiProjectMember[]>(`/api/projects/${project.id}/members`)
        : Promise.resolve(null)
    ]);
    return { project, columns, tasks, projectMembers };
  }));
  for (const { project, columns, tasks, projectMembers } of boardData) {
    const isInvited = "role" in project && project.role === "membro-admin";
    const workspace = isInvited
      ? spaceMap.get(`invited-${project.workspaceId || `unassigned-${project.id}`}`)
      : (project.workspaceId && spaceMap.get(project.workspaceId)) || spaceMap.get(UNASSIGNED_WORKSPACE_ID);
    if (!workspace) continue;
    if (projectMembers) {
      workspace.members = projectMembers.reduce<Member[]>((list, person) => {
        if (!list.some(item => item.id === person.id)) list.push({
          id: person.id, name: person.name, email: "", avatar: "", role: person.role
        });
        return list;
      }, workspace.invited ? [] : [...workspace.members]);
    }
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
