"use client";

import { Tag } from "lucide-react";
import type { RefObject } from "react";
import type { Task } from "@/types/board";

type TaskDragPreviewProps = {
  previewRef: RefObject<HTMLDivElement>;
  drag: {
    task: Task;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    width: number;
  };
};

/** Cartão realçado que acompanha exatamente o ponteiro; não captura os eventos de drop. */
export function TaskDragPreview({ drag, previewRef }: TaskDragPreviewProps) {
  const { task, x, y, offsetX, offsetY, width } = drag;
  return (
    <div ref={previewRef} aria-hidden="true" className="pointer-events-none fixed z-[180] will-change-transform rounded-3xl border-2 border-blue-400 bg-white p-4 shadow-2xl ring-4 ring-blue-200/50 dark:border-blue-400 dark:bg-slate-900 dark:ring-blue-950/70"
      style={{ left: 0, top: 0, width,
        transform: `translate3d(${x - offsetX}px, ${y - offsetY}px, 0) rotate(-1deg) scale(1.01)`,
        transformOrigin: `${offsetX}px ${offsetY}px` }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-950 dark:text-white">{task.title}</h3>
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-200">{task.priority}</span>
      </div>
      {task.description && <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{task.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">{task.tags.slice(0, 3).map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-200"><Tag className="size-3" /> {tag}</span>)}</div>
    </div>
  );
}
