import { mobileTaskDestination } from "./mobile-task-movement";
import type { Task } from "@/types/board";

const task = (id: string, columnId: string, position: number) => ({
  id, columnId, position
} as Task);

const tasks = [
  task("a", "backlog", 0), task("hidden", "backlog", 1),
  task("b", "backlog", 2), task("c", "backlog", 3),
  task("other", "planejado", 0)
];
const visible = tasks.filter(item => item.id !== "hidden");

describe("movimentação de tarefas no mobile sem drag", () => {
  it("move um cartão uma posição entre os visíveis sem reordenar os filtrados", () => {
    expect(mobileTaskDestination(tasks, visible, tasks[0], "backlog", "down")).toBe(2);
    expect(mobileTaskDestination(tasks, visible, tasks[3], "backlog", "up")).toBe(2);
  });

  it("não chama movimentação inválida nas extremidades", () => {
    expect(mobileTaskDestination(tasks, visible, tasks[0], "backlog", "up")).toBeNull();
    expect(mobileTaskDestination(tasks, visible, tasks[3], "backlog", "down")).toBeNull();
    expect(mobileTaskDestination(tasks, visible, tasks[0], "backlog")).toBeNull();
  });

  it("envia para o fim da coluna escolhida, preservando a posição real", () => {
    expect(mobileTaskDestination(tasks, visible, tasks[0], "planejado")).toBe(1);
  });
});
