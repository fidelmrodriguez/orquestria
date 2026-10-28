"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Column } from "@/types/board";
import { AddColumnForm } from "./AddColumnForm";

interface MobileColumnSwitcherProps {
  columns: Column[];
  activeColumnId: string | null;
  taskCounts: Record<string, number>;
  onChange: (columnId: string) => void;
  onNewTask: (columnId: string) => void;
  onAddColumn?: (projectId: string, title: string) => void;
  projectId?: string;
}

/** Navegação vertical por uma coluna de cada vez em telas menores que desktop. */
export function MobileColumnSwitcher({ columns, activeColumnId, taskCounts, onChange, onNewTask, onAddColumn, projectId }: MobileColumnSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(0, columns.findIndex(column => column.id === activeColumnId));
  const activeColumn = columns[activeIndex];

  useEffect(() => { setOpen(false); }, [activeColumnId]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        containerRef.current?.querySelector<HTMLButtonElement>("[data-column-switcher-trigger]")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);

  if (!activeColumn) return onAddColumn && projectId ? (
    <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
      <AddColumnForm mobile projectId={projectId} onAddColumn={onAddColumn} />
    </div>
  ) : null;

  return (
    <nav ref={containerRef} className="relative min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:hidden" aria-label="Navegar entre colunas do Kanban">
      <div className="mb-2 flex items-center justify-between gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
        <span>Colunas do projeto</span>
        <span aria-live="polite">{activeIndex + 1} de {columns.length}</span>
      </div>
      <div className="flex min-w-0 items-stretch gap-2">
        <button type="button" aria-label="Coluna anterior" title="Coluna anterior"
          disabled={activeIndex === 0} onClick={() => onChange(columns[activeIndex - 1].id)}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:text-slate-200">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" data-column-switcher-trigger aria-expanded={open} aria-controls="orquestria-mobile-columns"
          aria-label={`Escolher coluna. Atual: ${activeColumn.title}`}
          onClick={() => setOpen(value => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <span className={`size-2.5 shrink-0 rounded-full ${activeColumn.color}`} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{activeColumn.title}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{taskCounts[activeColumn.id] ?? 0}</span>
          <ChevronDown className="size-4 shrink-0 text-slate-500" />
        </button>
        <button type="button" aria-label="Próxima coluna" title="Próxima coluna"
          disabled={activeIndex === columns.length - 1} onClick={() => onChange(columns[activeIndex + 1].id)}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:text-slate-200">
          <ChevronRight className="size-5" />
        </button>
      </div>
      {open && (
        <div id="orquestria-mobile-columns" role="group" aria-label="Colunas disponíveis"
          className="absolute inset-x-3 top-[calc(100%-2px)] z-30 max-h-[min(56vh,360px)] overflow-y-auto rounded-b-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {columns.map(column => (
            <button type="button" key={column.id} aria-current={column.id === activeColumn.id ? "true" : undefined}
              onClick={() => { onChange(column.id); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 ${column.id === activeColumn.id ? "bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" : "text-slate-700 dark:text-slate-200"}`}>
              <span className={`size-2.5 shrink-0 rounded-full ${column.color}`} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{column.title}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{taskCounts[column.id] ?? 0}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 grid min-w-0 grid-cols-2 items-stretch gap-2" aria-label="Ações do projeto">
        {onAddColumn && <AddColumnForm mobile projectId={activeColumn.projectId} onAddColumn={onAddColumn} />}
        <button type="button" onClick={() => onNewTask(activeColumn.id)} aria-label={`Nova tarefa em ${activeColumn.title}`}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-2 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          <Plus className="size-4 shrink-0" /> <span className="min-w-0 truncate">Nova tarefa</span>
        </button>
      </div>
    </nav>
  );
}
