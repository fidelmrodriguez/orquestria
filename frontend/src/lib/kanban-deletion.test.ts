import { apiRequest, deleteActionPath, deleteOperation, humanName, targetPath, unpackList } from "./kanban-deletion";

describe("Gerenciamento de exclusões do Kanban", () => {
  it("preserva as rotas REST DELETE existentes", () => {
    expect(targetPath({ kind: "task", projectId: "p1", id: "t1" })).toBe("/api/projects/p1/tasks/t1");
    expect(targetPath({ kind: "column", projectId: "p1", id: "c1" })).toBe("/api/projects/p1/columns/c1");
    expect(targetPath({ kind: "project", id: "p1" })).toBe("/api/projects/p1");
    expect(targetPath({ kind: "workspace", id: "w1" })).toBe("/api/workspaces/w1");
  });

  it("monta as rotas POST de exclusão usadas pelo navegador", () => {
    expect(deleteActionPath({ kind: "task", projectId: "p1", id: "t1" })).toBe("/api/projects/p1/tasks/t1/delete");
    expect(deleteActionPath({ kind: "column", projectId: "p1", id: "c1" })).toBe("/api/projects/p1/columns/c1/delete");
    expect(deleteActionPath({ kind: "project", id: "p1" })).toBe("/api/projects/p1/delete");
    expect(deleteActionPath({ kind: "workspace", id: "w1" })).toBe("/api/workspaces/w1/delete");
    expect(deleteOperation({ kind: "project", id: "p1" })).toBe("excluir-projeto");
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

  it("aceita HTTP 204 pelo POST e envia Authorization sem imprimir token", async () => {
    const previous = globalThis.fetch;
    const fetchMock = jest.fn().mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    globalThis.fetch = fetchMock;
    try {
      await expect(apiRequest("https://api.example", "/api/projects/p1/delete", "token_privado", "POST", "excluir-projeto")).resolves.toBeNull();
      expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/projects/p1/delete", {
        method: "POST", headers: { Authorization: "Bearer token_privado" }, cache: "no-store"
      });
    } finally { globalThis.fetch = previous; }
  });

  it("distingue falta de deploy (405) de bloqueio de rede/preflight (status zero)", async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 405 } as Response)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    try {
      await expect(apiRequest("https://api.example", "/delete", "token", "POST", "excluir-projeto"))
        .rejects.toMatchObject({ status: 405 });
      await expect(apiRequest("https://api.example", "/delete", "token", "POST", "excluir-projeto"))
        .rejects.toMatchObject({ status: 0 });
    } finally { globalThis.fetch = previous; }
  });
});
