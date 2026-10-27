/** Funções independentes do estado do Kanban para gerenciar exclusões explícitas. */
export type Entity = {
  id: string;
  name?: string;
  title?: string;
  workspaceId?: string | null;
  workspaceName?: string;
  ownerName?: string;
  invited?: boolean;
  projectId?: string;
  columnId?: string | null;
  position?: number;
};

export type DeleteTarget =
  | { kind: "task"; projectId: string; id: string }
  | { kind: "column"; projectId: string; id: string }
  | { kind: "project"; id: string }
  | { kind: "workspace"; id: string };

/**
 * Operações POST alternativas para operações destrutivas. Os endpoints DELETE
 * originais continuam disponíveis para clientes HTTP e integrações.
 */
export function deleteActionPath(target: DeleteTarget): string {
  return `${targetPath(target)}/delete`;
}

export type KanbanOperation =
  | "listar-workspaces" | "listar-projetos" | "listar-colunas" | "listar-tarefas"
  | "excluir-tarefa" | "excluir-coluna" | "excluir-projeto" | "excluir-workspace";

export function deleteOperation(target: DeleteTarget): KanbanOperation {
  switch (target.kind) {
    case "task": return "excluir-tarefa";
    case "column": return "excluir-coluna";
    case "project": return "excluir-projeto";
    case "workspace": return "excluir-workspace";
  }
}

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
  method: "GET" | "DELETE" | "POST" = "GET",
  operation: KanbanOperation = "listar-projetos"
): Promise<unknown> {
  if (!token) throw new KanbanApiError(401, "Sua sessão expirou. Entre novamente.");
  let response: Response;
  // Logs de diagnóstico sem valores privados: nunca registrar token, senha,
  // corpo da requisição ou identificadores das entidades.
  console.info("[Orquestria][gerenciar] requisicao", { operacao: operation, metodo: method });
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  } catch (cause) {
    console.error("[Orquestria][gerenciar] falha_de_rede_ou_cors", {
      operacao: operation, metodo: method,
      tipo: cause instanceof Error ? cause.name : "desconhecido"
    });
    throw new KanbanApiError(0, "A requisição não chegou à API: possível CORS ou falha de rede. Confira OPTIONS na aba Network e se o Blitz está online.");
  }
  console.info("[Orquestria][gerenciar] resposta", { operacao: operation, metodo: method, status: response.status, sucesso: response.ok });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Sua sessão expirou. Entre novamente.",
      403: "Você não tem permissão para realizar esta operação.",
      404: "Este recurso não existe mais ou não pertence à sua conta.",
      409: "Este item possui dependências. Esvazie a coluna ou remova os projetos do workspace antes de excluir.",
      405: "O servidor ainda não aceita esta operação. Confirme se o novo commit já foi publicado no Blitz."
    };
    const message = messages[response.status] ||
      (response.status >= 500 ? "O servidor não concluiu a operação. Tente novamente." : `Operação recusada (HTTP ${response.status}).`);
    throw new KanbanApiError(response.status, message);
  }
  if (method === "DELETE" || method === "POST" || response.status === 204) return null;
  return response.json();
}
