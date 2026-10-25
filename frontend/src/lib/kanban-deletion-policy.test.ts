import {
  canDeleteColumn, canDeleteWorkspace, projectCountInWorkspace,
  requiresTypedConfirmation, taskCountInColumn
} from "./kanban-deletion-policy";

describe("Etapa 6: proteções de exclusão no Kanban", () => {
  const tasks = [
    { id: "t1", columnId: "c1" },
    { id: "t2", columnId: "c1" },
    { id: "t3", columnId: "c2" }
  ];
  const projects = [
    { id: "p1", workspaceId: "w1" },
    { id: "p2", workspaceId: "w2" }
  ];

  it("só libera exclusão de coluna quando a lista carregou e não há tarefas", () => {
    expect(taskCountInColumn(tasks, "c1")).toBe(2);
    expect(canDeleteColumn(tasks, "c1", true)).toBe(false);
    expect(canDeleteColumn(tasks, "vazia", false)).toBe(false);
    expect(canDeleteColumn(tasks, "vazia", true)).toBe(true);
  });

  it("só libera exclusão de workspace vazio após consulta concluída", () => {
    expect(projectCountInWorkspace(projects, "w1")).toBe(1);
    expect(canDeleteWorkspace(projects, "w1", true)).toBe(false);
    expect(canDeleteWorkspace(projects, "vazio", false)).toBe(false);
    expect(canDeleteWorkspace(projects, "vazio", true)).toBe(true);
  });

  it("exige confirmação digitada para remoções de alto impacto ou conta guest", () => {
    expect(requiresTypedConfirmation("project", false)).toBe(true);
    expect(requiresTypedConfirmation("workspace", false)).toBe(true);
    expect(requiresTypedConfirmation("task", false)).toBe(false);
    expect(requiresTypedConfirmation("column", false)).toBe(false);
    expect(requiresTypedConfirmation("task", true)).toBe(true);
    expect(requiresTypedConfirmation("column", true)).toBe(true);
  });
});
