import { applyTaskReorder, isNoopReorder, orderInColumn, positionFromVisibleTasks } from "./task-order";
import type { Task } from "@/types/board";

function task(id: string, columnId: string, position: number): Task {
  return { id, columnId, position, projectId: "p", title: id, description: "", priority: "media",
    assigneeId: "u", tags: [], dueDate: "", comments: [], createdAt: "", updatedAt: "" };
}

const tasks = [task("a", "one", 0), task("b", "one", 1), task("c", "one", 2), task("d", "two", 0)];

describe("ordenação persistente de tarefas", () => {
  it("não envia movimento ao soltar na posição original", () => {
    expect(isNoopReorder(tasks, "b", "one", 1)).toBe(true);
    expect(isNoopReorder(tasks, "a", "one", 0)).toBe(true);
    expect(isNoopReorder(tasks, "a", "one", 2)).toBe(false);
  });
  it("permite colocar uma tarefa antes ou depois de outra na mesma coluna", () => {
    const changed = applyTaskReorder(tasks, "c", "one", 0);
    expect(orderInColumn(changed, "one").map(item => item.id)).toEqual(["c", "a", "b"]);
    expect(orderInColumn(changed, "one").map(item => item.position)).toEqual([0, 1, 2]);
    expect(orderInColumn(applyTaskReorder(changed, "c", "one", 2), "one").map(item => item.id))
      .toEqual(["a", "b", "c"]);
  });
  it("renumera origem e destino ao mover entre colunas", () => {
    const changed = applyTaskReorder(tasks, "b", "two", 0);
    expect(orderInColumn(changed, "one").map(item => item.id)).toEqual(["a", "c"]);
    expect(orderInColumn(changed, "two").map(item => item.id)).toEqual(["b", "d"]);
    expect(orderInColumn(changed, "two").map(item => item.position)).toEqual([0, 1]);
  });
  it("respeita a posição dos cartões ocultos por filtros", () => {
    const visible = [tasks[0], tasks[2]];
    expect(positionFromVisibleTasks(tasks, visible, "c", "one", 0)).toBe(0);
    expect(positionFromVisibleTasks(tasks, visible, "a", "one", 1)).toBe(2);
    expect(positionFromVisibleTasks(tasks, [tasks[1]], "b", "one", 0)).toBe(1);
  });
});
