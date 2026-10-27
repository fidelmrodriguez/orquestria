import { shouldMoveTask } from "./kanban-drag";

describe("movimentação de tarefas no Kanban", () => {
  it("não grava quando a tarefa é solta na coluna de origem", () => {
    expect(shouldMoveTask("planejado", "planejado")).toBe(false);
  });

  it("não grava quando a tarefa é solta fora do quadro", () => {
    expect(shouldMoveTask("planejado", null)).toBe(false);
    expect(shouldMoveTask("planejado", undefined)).toBe(false);
  });

  it("grava apenas quando o destino é outra coluna", () => {
    expect(shouldMoveTask("planejado", "executando")).toBe(true);
  });
});
