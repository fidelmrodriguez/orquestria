"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type Position = { top: number; left: number; width: number; maxHeight: number };

/** O painel é um portal: outros cards não podem cobrir suas opções. */
export function MobileTaskMove({ task, columns, canMoveUp, canMoveDown, disabled = false, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);
  const locate = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const box = trigger.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const width = Math.min(274, window.innerWidth - 32);
    const panelHeight = Math.min(300, Math.max(180, viewportHeight - 32));
    const below = viewportHeight - box.bottom - 12;
    const above = box.top - 12;
    const top = below >= Math.min(200, panelHeight) || below >= above
      ? Math.min(box.bottom + 6, Math.max(16, viewportHeight - panelHeight - 16))
      : Math.max(16, box.top - panelHeight - 6);
    setPosition({ top, left: Math.max(16, Math.min(box.right - width, window.innerWidth - width - 16)), width, maxHeight: Math.max(120, Math.min(panelHeight, viewportHeight - top - 16)) });
  };

  useEffect(() => { if (disabled) close(); }, [disabled]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); triggerRef.current?.focus(); }
    };
    const viewportChanged = (event?: Event) => {
      if (event?.target instanceof Node && panelRef.current?.contains(event.target)) return;
      close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", viewportChanged);
    window.addEventListener("scroll", viewportChanged, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", viewportChanged);
      window.removeEventListener("scroll", viewportChanged, true);
    };
  }, [open]);

  const move = (columnId: string, direction?: "up" | "down") => {
    onMove(task, columnId, direction);
    close();
  };

  return <div className="relative lg:hidden" onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
    <button ref={triggerRef} type="button" disabled={disabled} aria-label={`Mover tarefa ${task.title}`} aria-expanded={open}
      onClick={() => { if (open) close(); else { locate(); setOpen(true); } }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-1.5 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
      <ArrowLeftRight className="size-3.5" /> Mover <ChevronDown className="size-3" />
    </button>
    {open && position && typeof document !== "undefined" && createPortal(
      <div ref={panelRef} role="group" aria-label={`Movimentar ${task.title}`}
        style={{ position: "fixed", top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
        onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
        className="z-[130] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <button type="button" disabled={!canMoveUp} onClick={() => move(task.columnId, "up")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowUp className="size-4" /> Subir uma posição</button>
        <button type="button" disabled={!canMoveDown} onClick={() => move(task.columnId, "down")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowDown className="size-4" /> Descer uma posição</button>
        {columns.some(column => column.id !== task.columnId) && <div className="my-1 border-t border-slate-200 pt-1 text-xs text-slate-500 dark:border-slate-700">Mover para coluna</div>}
        {columns.filter(column => column.id !== task.columnId).map(column => (
          <button key={column.id} type="button" onClick={() => move(column.id)}
            className="w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{column.title}</button>
        ))}
      </div>, document.body)}
  </div>;
}
