/** Funções independentes do estado do Kanban para gerenciar exclusões explícitas. */
export type Entity = {
  id: string;
  name?: string;
  title?: string;
  workspaceId?: string | null;
  projectId?: string;
  columnId?: string | null;
  position?: number;
};

export type DeleteTarget =
  | { kind: "task"; projectId: string; id: string }
  | { kind: "column"; projectId: string; id: string }
  | { kind: "project"; id: string }
  | { kind: "workspace"; id: string };

export class KanbanApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "KanbanApiError";
  }
}

export function targetPath(target: DeleteTarget): string {
  const safe = (value: string) => encodeURIComponent(value);
  switch (target.kind) {
    case "task": return `/api/projects/${safe(target.projectId)}/tasks/${safe(target.id)}`;
    case "column": return `/api/projects/${safe(target.projectId)}/columns/${safe(target.id)}`;
    case "project": return `/api/projects/${safe(target.id)}`;
    case "workspace": return `/api/workspaces/${safe(target.id)}`;
  }
}

/** Suporta listas simples (API atual) e envelopes comuns, sem mascarar erros de contrato. */
export function unpackList(value: unknown): Entity[] {
  const obj = value && typeof value === "object" ? value as Record<string, unknown> : null;
  const list = Array.isArray(value) ? value :
    obj && [obj.items, obj.content, obj.data, obj.workspaces, obj.projects, obj.columns, obj.tasks]
      .find(Array.isArray);
  if (!Array.isArray(list)) throw new Error("A API retornou um formato inesperado para a listagem.");
  return list.filter((item): item is Entity =>
    Boolean(item && typeof item === "object" && typeof (item as Entity).id === "string"));
}

export function humanName(entity: Entity): string {
  return entity.name?.trim() || entity.title?.trim() || entity.id;
}

export async function apiRequest(
  apiBase: string,
  path: string,
  token: string,
  method: "GET" | "DELETE" = "GET"
): Promise<unknown> {
  if (!token) throw new KanbanApiError(401, "Sua sessão expirou. Entre novamente.");
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  } catch {
    throw new KanbanApiError(0, "Não foi possível conectar à API. Verifique se o Blitz já acordou.");
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Sua sessão expirou. Entre novamente.",
      403: "Você não tem permissão para realizar esta operação.",
      404: "Este recurso não existe mais ou não pertence à sua conta.",
      409: "Este item possui dependências. Esvazie a coluna ou remova os projetos do workspace antes de excluir."
    };
    const message = messages[response.status] ||
      (response.status >= 500 ? "O servidor não concluiu a operação. Tente novamente." : `Operação recusada (HTTP ${response.status}).`);
    throw new KanbanApiError(response.status, message);
  }
  if (method === "DELETE" || response.status === 204) return null;
  return response.json();
}
