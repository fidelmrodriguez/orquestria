import type { Task } from "@/types/board";
import { positionFromVisibleTasks } from "./task-order";

/** Calcula a posição real sem alterar a ordem das tarefas ocultas pelos filtros. */
export function mobileTaskDestination(
  tasks: Task[], visibleTasks: Task[], task: Task,
  targetColumnId: string, direction?: "up" | "down"
): number | null {
  if (targetColumnId !== task.columnId) {
    const visibleCount = visibleTasks.filter(item => item.columnId === targetColumnId).length;
    return positionFromVisibleTasks(tasks, visibleTasks, task.id, targetColumnId, visibleCount);
  }
  if (!direction) return null;
  const columnVisible = visibleTasks.filter(item => item.columnId === task.columnId);
  const current = columnVisible.findIndex(item => item.id === task.id);
  const next = current + (direction === "up" ? -1 : 1);
  if (current < 0 || next < 0 || next >= columnVisible.length) return null;
  return positionFromVisibleTasks(tasks, visibleTasks, task.id, targetColumnId, next);
}
