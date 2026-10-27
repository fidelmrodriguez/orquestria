import type { Task } from "@/types/board";

/** Posição final após remover o próprio cartão da lista. */
export function orderInColumn(tasks: Task[], columnId: string): Task[] {
  return tasks.filter(task => task.columnId === columnId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function isNoopReorder(tasks: Task[], taskId: string, targetColumnId: string, targetIndex: number): boolean {
  const task = tasks.find(item => item.id === taskId);
  if (!task || task.columnId !== targetColumnId) return false;
  const ordered = orderInColumn(tasks, targetColumnId);
  const sourceIndex = ordered.findIndex(item => item.id === taskId);
  return sourceIndex === Math.max(0, Math.min(targetIndex, ordered.length - 1));
}

/** Atualiza posições locais somente depois que o servidor confirma a movimentação. */
export function applyTaskReorder(tasks: Task[], taskId: string, columnId: string, position: number): Task[] {
  const moving = tasks.find(task => task.id === taskId);
  if (!moving) return tasks;
  const sourceId = moving.columnId;
  const source = orderInColumn(tasks, sourceId).filter(task => task.id !== taskId);
  const target = sourceId === columnId ? source : orderInColumn(tasks, columnId);
  const index = Math.max(0, Math.min(position, target.length));
  target.splice(index, 0, { ...moving, columnId });
  const positions = new Map<string, {columnId: string; position: number}>();
  source.forEach((task, i) => positions.set(task.id, {columnId: sourceId, position: i}));
  target.forEach((task, i) => positions.set(task.id, {columnId, position: i}));
  return tasks.map(task => {
    const next = positions.get(task.id);
    return next ? { ...task, ...next } : task;
  });
}

/** Usa os cartões visíveis como âncoras, sem alterar a ordem dos ocultos por filtros. */
export function positionFromVisibleTasks(
  all: Task[], visible: Task[], movingId: string, destinationId: string, visibleIndex: number
): number {
  const available = orderInColumn(all, destinationId).filter(task => task.id !== movingId);
  const shown = visible.filter(task => task.columnId === destinationId && task.id !== movingId);
  const clamped = Math.max(0, Math.min(visibleIndex, shown.length));
  if (!shown.length) {
    // Sob filtro, o cartão arrastado pode ser o único visível. Soltá-lo onde
    // já estava não deve reposicionar tarefas ocultas nem fazer POST.
    const original = all.find(task => task.id === movingId);
    return original?.columnId === destinationId
      ? orderInColumn(all, destinationId).findIndex(task => task.id === movingId)
      : available.length;
  }
  if (clamped < shown.length) {
    const anchor = available.findIndex(task => task.id === shown[clamped].id);
    return anchor < 0 ? available.length : anchor;
  }
  const previous = available.findIndex(task => task.id === shown[shown.length - 1].id);
  return previous < 0 ? available.length : previous + 1;
}
