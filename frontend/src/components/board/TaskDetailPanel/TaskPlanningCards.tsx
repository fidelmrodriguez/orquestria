import { CalendarDays } from "lucide-react";
import type { Task } from "@/types/board";

type TaskPlanningCardsProps = {
  task: Task;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "comments">>) => void;
};

export function TaskPlanningCards({ task, onUpdateTask }: TaskPlanningCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <CalendarDays className="size-4" /> Prazo
        </div>
        <input
          type="date"
          value={task.dueDate.slice(0, 10)}
          onChange={(event) => onUpdateTask(task.id, { dueDate: new Date(event.target.value).toISOString() })}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
        />
      </div>
      <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Tags</p>
        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
