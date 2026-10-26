import TagsInput from "@/components/tags/TagsInput";
import { getAuthToken } from "@/lib/auth-client";
import { apiUrl } from "@/lib/remote-board";
import { CalendarDays } from "lucide-react";
import type { Task } from "@/types/board";

type TaskPlanningCardsProps = {
  task: Task;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "comments">>) => Promise<boolean> | void;
};

export function TaskPlanningCards({ task, onUpdateTask }: TaskPlanningCardsProps) {
  return (
    <div className="grid gap-3">
      <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <CalendarDays className="size-4" /> Prazo
        </div>
        <input
          type="date"
          value={task.dueDate.slice(0, 10)}
          onChange={(event) => onUpdateTask(task.id, { dueDate: event.target.value ? new Date(`${event.target.value}T12:00:00Z`).toISOString() : "" })}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
        />
      </div>
      <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
        <TagsInput label="Tags" value={task.tags} onChange={tags => onUpdateTask(task.id, { tags })}
          maxTags={12} apiBase={apiUrl} token={getAuthToken() || undefined} />
      </div>
    </div>
  );
}
