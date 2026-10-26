import type { Priority, Task, Workspace } from "@/types/board";

const priorityOptions: Priority[] = ["baixa", "media", "alta", "critica"];

type TaskPropertiesFormProps = {
  task: Task;
  workspace: Workspace;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "comments">>) => void;
  onMoveTask: (taskId: string, columnId: string) => void;
};

export function TaskPropertiesForm({ task, workspace, onUpdateTask, onMoveTask }: TaskPropertiesFormProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Responsável</span>
        <select
          value={task.assigneeId}
          onChange={(event) => onUpdateTask(task.id, { assigneeId: event.target.value })}
          className="field"
        >
          {workspace.members.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Prioridade</span>
        <select
          value={task.priority}
          onChange={(event) => onUpdateTask(task.id, { priority: event.target.value as Priority })}
          className="field capitalize"
        >
          {priorityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 sm:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Coluna</span>
        <select value={task.columnId}
          onChange={(event) => { if (event.target.value !== task.columnId) onMoveTask(task.id, event.target.value); }}
          className="field">
          {workspace.columns.filter((column) => column.projectId === task.projectId).map((column) => (
            <option key={column.id} value={column.id}>{column.title}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
