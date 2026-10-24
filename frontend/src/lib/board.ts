import type { Column, SourceTodo, SourceUser, Member, Priority, Task, Workspace } from "@/types/board";

const priorities: Priority[] = ["baixa", "media", "alta", "critica"];
const tags = ["Produto", "Design", "API", "Mobile", "Cliente", "Operação"];

export const defaultColumns: Array<Omit<Column, "projectId">> = [
  { id: "col-backlog", title: "Backlog", order: 1, color: "bg-slate-400" },
  { id: "col-planejado", title: "Planejado", order: 2, color: "bg-sky-500" },
  { id: "col-execucao", title: "Em execução", order: 3, color: "bg-amber-500" },
  { id: "col-revisao", title: "Revisão", order: 4, color: "bg-violet-500" },
  { id: "col-concluido", title: "Concluído", order: 5, color: "bg-emerald-500" }
];

function createFallbackUsers(): SourceUser[] {
  return [
    { id: 1, firstName: "Ana", lastName: "Silva", email: "ana.silva@empresa.com" },
    { id: 2, firstName: "Bruno", lastName: "Lima", email: "bruno.lima@empresa.com" },
    { id: 3, firstName: "Carla", lastName: "Moura", email: "carla.moura@empresa.com" },
    { id: 4, firstName: "Diego", lastName: "Ramos", email: "diego.ramos@empresa.com" }
  ];
}

function createFallbackTodos(): SourceTodo[] {
  return [
    { id: 1, todo: "Mapear fluxo de aprovação de tarefas", completed: false, userId: 1 },
    { id: 2, todo: "Revisar contrato de compartilhamento do projeto", completed: false, userId: 2 },
    { id: 3, todo: "Atualizar painel executivo da operação", completed: false, userId: 3 },
    { id: 4, todo: "Publicar versão inicial do calendário", completed: true, userId: 4 },
    { id: 5, todo: "Validar prioridades com área de Produto", completed: false, userId: 1 },
    { id: 6, todo: "Ajustar experiência mobile do quadro", completed: true, userId: 2 }
  ];
}

export function buildMembers(users: SourceUser[] = []) {
  const source = users.length ? users : createFallbackUsers();

  return source.slice(0, 8).map<Member>((user, index) => ({
    id: `member-${user.id}`,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    avatar: user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%20${user.lastName}`,
    role: index === 0 ? "admin" : index < 4 ? "editor" : "viewer"
  }));
}

export function resolveColumnId(todo: SourceTodo, index: number) {
  if (todo.completed) return "col-concluido";
  return defaultColumns[index % (defaultColumns.length - 1)].id;
}

export function buildWorkspaceFromSource(todos: SourceTodo[] = [], users: SourceUser[] = []): Workspace {
  const now = new Date().toISOString();
  const projectId = "project-operacao-digital";
  const members = buildMembers(users);
  const sourceTodos = todos.length ? todos : createFallbackTodos();

  return {
    id: "workspace-operacao",
    name: "Operação Digital",
    description: "Gestão de prioridades, entregas e colaboração da equipe.",
    members,
    projects: [
      {
        id: projectId,
        workspaceId: "workspace-operacao",
        name: "Lançamento do Produto",
        description: "Organização das frentes de produto, atendimento, tecnologia e operação.",
        visibility: "equipe",
        createdAt: now
      },
      {
        id: "project-experiencia-cliente",
        workspaceId: "workspace-operacao",
        name: "Experiência do Cliente",
        description: "Melhorias contínuas no relacionamento com clientes e parceiros.",
        visibility: "equipe",
        createdAt: now
      }
    ],
    columns: defaultColumns.map((column) => ({ ...column, projectId })),
    tasks: sourceTodos.slice(0, 18).map<Task>((todo, index) => {
      const member = members.find((item) => item.id === `member-${todo.userId}`) || members[index % members.length];
      const columnId = resolveColumnId(todo, index);
      const dueDate = new Date(Date.now() + (index + 2) * 86400000).toISOString();

      return {
        id: `task-${todo.id}`,
        title: todo.todo,
        description: `Tarefa importada da fonte operacional e adaptada para o fluxo interno da equipe. Responsável atual: ${member?.name || "User"}.`,
        columnId,
        projectId,
        assigneeId: member?.id || "member-1",
        priority: priorities[index % priorities.length],
        tags: [tags[index % tags.length], tags[(index + 2) % tags.length]],
        dueDate,
        comments: index % 3 === 0
          ? [
              {
                id: `comment-${todo.id}`,
                authorId: member?.id || "member-1",
                message: "Alinhamento realizado. Próximo passo já está documentado na tarefa.",
                createdAt: now
              }
            ]
          : [],
        createdAt: now,
        updatedAt: now
      };
    })
  };
}

export function getTasksByColumn(workspace: Workspace, projectId: string, columnId: string) {
  return workspace.tasks.filter((task) => task.projectId === projectId && task.columnId === columnId);
}

export function countOpenTasks(workspace: Workspace) {
  return workspace.tasks.filter((task) => task.columnId !== "col-concluido").length;
}
