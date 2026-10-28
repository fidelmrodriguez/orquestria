"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, ChevronDown } from "lucide-react";
import type { Column, Task } from "@/types/board";

type Props = {
  task: Task;
  columns: Column[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  onMove: (task: Task, targetColumnId: string, direction?: "up" | "down") => void;
};

/** Alternativa ao drag-and-drop para touch e telas menores que 1024px. */
export function MobileTaskMove({ task, columns, canMoveUp, canMoveDown, disabled = false, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const move = (columnId: string, direction?: "up" | "down") => {
    onMove(task, columnId, direction);
    setOpen(false);
  };
  return <div ref={ref} className="relative z-10 lg:hidden" onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
    <button ref={triggerRef} type="button" disabled={disabled} aria-label={`Mover tarefa ${task.title}`} aria-expanded={open}
      onClick={() => setOpen(value => !value)}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-1.5 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
      <ArrowLeftRight className="size-3.5" /> Mover <ChevronDown className="size-3" />
    </button>
    {open && <div role="group" aria-label={`Movimentar ${task.title}`}
      className="absolute right-0 top-full z-50 mt-1 max-h-64 w-[min(260px,calc(100vw-64px))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <button type="button" disabled={!canMoveUp} onClick={() => move(task.columnId, "up")}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowUp className="size-4" /> Subir uma posição</button>
      <button type="button" disabled={!canMoveDown} onClick={() => move(task.columnId, "down")}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowDown className="size-4" /> Descer uma posição</button>
      {columns.some(column => column.id !== task.columnId) && <div className="my-1 border-t border-slate-200 pt-1 text-xs text-slate-500 dark:border-slate-700">Mover para coluna</div>}
      {columns.filter(column => column.id !== task.columnId).map(column => (
        <button key={column.id} type="button" onClick={() => move(column.id)}
          className="w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{column.title}</button>
      ))}
    </div>}
  </div>;
}
