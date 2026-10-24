import { buildWorkspaceFromSource, countOpenTasks, getTasksByColumn, resolveColumnId } from "@/lib/board";
import type { SourceTodo, SourceUser } from "@/types/board";

const todos: SourceTodo[] = [
  { id: 1, todo: "Criar fluxo de entrada", completed: false, userId: 1 },
  { id: 2, todo: "Validar release mobile", completed: true, userId: 2 }
];

const users: SourceUser[] = [
  { id: 1, firstName: "Ana", lastName: "Silva", email: "ana@empresa.com" },
  { id: 2, firstName: "Bruno", lastName: "Lima", email: "bruno@empresa.com" }
];

describe("board helpers", () => {
  it("monta workspace com tarefas vindas da fonte operacional", () => {
    const workspace = buildWorkspaceFromSource(todos, users);

    expect(workspace.name).toBe("Operação Digital");
    expect(workspace.tasks).toHaveLength(2);
    expect(workspace.members[0].name).toBe("Ana Silva");
  });

  it("move tarefas concluídas para a coluna Concluído", () => {
    expect(resolveColumnId(todos[1], 1)).toBe("col-concluido");
  });

  it("filtra tarefas por coluna", () => {
    const workspace = buildWorkspaceFromSource(todos, users);
    const project = workspace.projects[0];
    const doneTasks = getTasksByColumn(workspace, project.id, "col-concluido");

    expect(doneTasks[0].title).toBe("Validar release mobile");
    expect(countOpenTasks(workspace)).toBe(1);
  });
});
