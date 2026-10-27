import { SafeSelect } from "@/components/forms/SafeSelect";
import type { Priority, Task, Workspace } from "@/types/board";

const priorityOptions: {value: Priority; label: string}[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" }
];

type TaskPropertiesFormProps = {
  task: Task;
  workspace: Workspace;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "comments">>) => void;
  onMoveTask: (taskId: string, columnId: string) => void;
};

export function TaskPropertiesForm({ task, workspace, onUpdateTask, onMoveTask }: TaskPropertiesFormProps) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <div className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Responsável</span>
      <SafeSelect label="Responsável" value={task.assigneeId}
        options={workspace.members.map(member => ({value: member.id, label: member.name}))}
        onChange={assigneeId => onUpdateTask(task.id, {assigneeId})} />
    </div>
    <div className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Prioridade</span>
      <SafeSelect label="Prioridade" value={task.priority} options={priorityOptions}
        onChange={priority => onUpdateTask(task.id, {priority: priority as Priority})} />
    </div>
    <div className="space-y-2 sm:col-span-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Coluna</span>
      <SafeSelect label="Coluna" value={task.columnId}
        options={workspace.columns.filter(column => column.projectId === task.projectId).map(column => ({value: column.id, label: column.title}))}
        onChange={columnId => { if (columnId !== task.columnId) onMoveTask(task.id, columnId); }} />
    </div>
  </div>;
}
