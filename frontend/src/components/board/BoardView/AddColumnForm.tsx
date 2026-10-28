"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

type AddColumnFormProps = {
  projectId: string;
  onAddColumn: (projectId: string, title: string) => void;
  mobile?: boolean;
};

/** Ação compacta na barra superior. O formulário flutua sem ampliar a barra. */
export function AddColumnForm({ projectId, onAddColumn, mobile = false }: AddColumnFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [columnName, setColumnName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!expanded) return;
    inputRef.current?.focus();
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setExpanded(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); setExpanded(false); }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  const formId = mobile ? "orquestria-mobile-new-column-form" : "orquestria-new-column-form";

  return <div ref={containerRef} className={mobile ? "contents" : "relative shrink-0"}>
    <button type="button" onClick={() => setExpanded(value => !value)}
      aria-label="Adicionar coluna ao projeto" aria-expanded={expanded}
      aria-controls={formId}
      className={mobile ? "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" : "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"}>
      <Plus className="size-4 shrink-0" /> <span className={mobile ? "min-w-0 truncate" : "hidden min-[1920px]:inline"}>Nova coluna</span>
    </button>
    {expanded && <form id={formId} className={mobile ? "order-last col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 max-[380px]:grid-cols-[1fr_auto]" : "absolute right-0 top-full z-[60] mt-2 flex w-[min(90vw,320px)] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"}
      onSubmit={(event) => {
        event.preventDefault();
        const title = columnName.trim();
        if (!title) return;
        onAddColumn(projectId, title);
        setColumnName("");
        setExpanded(false);
      }}>
      <input ref={inputRef} value={columnName} onChange={event => setColumnName(event.target.value)}
        maxLength={120} className={mobile ? "mini-field min-w-0 w-full max-[380px]:col-span-2" : "mini-field min-w-0 flex-1"} aria-label="Nome da nova coluna" placeholder="Nome da coluna" />
      <button className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950" type="submit" disabled={!columnName.trim()}>Criar</button>
      <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" type="button" aria-label="Cancelar nova coluna" onClick={() => { setExpanded(false); setColumnName(""); }}><X className="size-4" /></button>
    </form>}
  </div>;
}
