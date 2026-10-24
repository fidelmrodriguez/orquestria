"use client";

import { MessageCircle, Tag } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { useBoardStore } from "@/store/board-store";
import type { Member, Task } from "@/types/board";

const priorityStyles = {
  baixa: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  media: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  critica: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
};

type TaskCardProps = {
  task: Task;
  member?: Member;
};

export function TaskCard({ task, member }: TaskCardProps) {
  const setSelectedTask = useBoardStore((state) => state.setSelectedTask);
  const setDraggedTask = useBoardStore((state) => state.setDraggedTask);

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        setDraggedTask(task.id);
      }}
      onDragEnd={() => setDraggedTask(null)}
      onClick={() => setSelectedTask(task.id)}
      className="group cursor-grab rounded-3xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-1 hover:border-slate-300 active:cursor-grabbing dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-white">{task.title}</h3>
        <span className={cn("shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold capitalize", priorityStyles[task.priority])}>
          {task.priority}
        </span>
      </div>

      <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {task.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <Tag className="size-3" /> {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-900">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-full bg-slate-950 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-950">
            {getInitials(member?.name || "User")}
          </div>
          <div>
            <p className="max-w-24 truncate text-xs font-medium text-slate-700 dark:text-slate-200">{member?.name || "User"}</p>
            <p className="text-[11px] text-slate-400">{formatDate(task.dueDate)}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <MessageCircle className="size-4" /> {task.comments.length}
        </span>
      </div>
    </article>
  );
}
