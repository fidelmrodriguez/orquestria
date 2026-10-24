import { humanName, targetPath, unpackList } from "./kanban-deletion";

describe("Gerenciamento de exclusões do Kanban", () => {
  it("monta corretamente cada rota DELETE", () => {
    expect(targetPath({ kind: "task", projectId: "p1", id: "t1" })).toBe("/api/projects/p1/tasks/t1");
    expect(targetPath({ kind: "column", projectId: "p1", id: "c1" })).toBe("/api/projects/p1/columns/c1");
    expect(targetPath({ kind: "project", id: "p1" })).toBe("/api/projects/p1");
    expect(targetPath({ kind: "workspace", id: "w1" })).toBe("/api/workspaces/w1");
  });

  it("aceita lista simples e envelope paginado sem perder ids", () => {
    expect(unpackList([{ id: "1", name: "Projeto" }])).toHaveLength(1);
    expect(unpackList({ content: [{ id: "2", title: "Tarefa" }] })).toHaveLength(1);
  });

  it("rejeita resposta inesperada", () => {
    expect(() => unpackList({ unexpected: [] })).toThrow(/formato inesperado/);
  });

  it("prioriza nome, depois título e por fim id", () => {
    expect(humanName({ id: "x", name: "  Alpha  " })).toBe("Alpha");
    expect(humanName({ id: "y", title: "Beta" })).toBe("Beta");
    expect(humanName({ id: "z" })).toBe("z");
  });
});
