"use client";

import { Copy, MessageCircle, Tag } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { useBoardStore } from "@/store/board-store";
import type { Column, Member, Task } from "@/types/board";
import { MobileTaskMove } from "./MobileTaskMove";

const priorityStyles = {
  baixa: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  media: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  critica: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
};

type TaskCardProps = {
  task: Task;
  member?: Member;
  onPrepareDrag?: (event: ReactPointerEvent<HTMLElement>, task: Task) => void;
  onDuplicateTask?: (taskId: string) => void;
  columns?: Column[];
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveTask?: (task: Task, targetColumnId: string, direction?: "up" | "down") => void;
  moveDisabled?: boolean;
};

export function TaskCard({ task, member, onPrepareDrag, onDuplicateTask, columns = [], canMoveUp = false, canMoveDown = false, onMoveTask, moveDisabled }: TaskCardProps) {
  const setSelectedTask = useBoardStore((state) => state.setSelectedTask);

  return (
    <article
      data-kanban-task-id={task.id}
      draggable={false}
      onDragStart={event => event.preventDefault()}
      onPointerDown={(event) => onPrepareDrag?.(event, task)}
      onClick={() => setSelectedTask(task.id)}
      onKeyDown={(event) => {
        // Botões internos (duplicar/mover) devem receber seu próprio teclado.
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setSelectedTask(task.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Abrir tarefa: ${task.title}`}
      className="kanban-task-draggable group cursor-pointer rounded-3xl border border-slate-200 bg-white p-3 shadow-card transition-colors hover:border-slate-300 lg:cursor-grab lg:select-none lg:p-4 lg:active:cursor-grabbing dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
    >
      <div className="mb-2 flex items-start justify-between gap-2 lg:mb-3 lg:gap-3">
        <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-950 dark:text-white">{task.title}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {onDuplicateTask && <button type="button" title={`Duplicar tarefa ${task.title}`}
            aria-label={`Duplicar tarefa ${task.title}`}
            onPointerDown={event => event.stopPropagation()}
            onClick={event => { event.stopPropagation(); onDuplicateTask(task.id); }}
            className="rounded-lg p-1.5 text-slate-400 opacity-70 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-white">
            <Copy className="size-3.5" />
          </button>}
          <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold capitalize", priorityStyles[task.priority])}>
            {task.priority}
          </span>
          {onMoveTask && <MobileTaskMove task={task} columns={columns}
            canMoveUp={canMoveUp} canMoveDown={canMoveDown} disabled={moveDisabled} onMove={onMoveTask} />}
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.description}</p>

      {task.tags.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5 lg:mt-4">
        {task.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <Tag className="size-3" /> {tag}
          </span>
        ))}
      </div>}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 lg:mt-4 lg:pt-3 dark:border-slate-900">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-full bg-slate-950 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-950">
            {getInitials(member?.name || "User")}
          </div>
          <div>
            <p className="max-w-24 truncate text-xs font-medium text-slate-700 dark:text-slate-200">{member?.name || "User"}</p>
            <p className="text-[11px] text-slate-400">{formatDate(task.dueDate, "Sem prazo")}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <MessageCircle className="size-4" /> {task.comments.length}
        </span>
      </div>
    </article>
  );
}
