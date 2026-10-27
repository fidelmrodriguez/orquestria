"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineEditProps = {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
  onEditingChange?: (editing: boolean) => void;
  showEditLabel?: boolean;
};

export function InlineEdit({ value, onSave, className, inputClassName, ariaLabel, onEditingChange, showEditLabel = false }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const nextValue = draft.trim();
    if (nextValue && nextValue !== value) {
      onSave(nextValue);
    }
    setEditing(false);
    onEditingChange?.(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setEditing(true); onEditingChange?.(true); }}
        className={cn("group inline-flex max-w-full items-center gap-2 text-left", className)}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <span className="min-w-0 truncate">{value}</span>
        {showEditLabel ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Pencil className="size-3.5" /> Editar
          </span>
        ) : <Pencil className="size-3.5 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
            onEditingChange?.(false);
          }
        }}
        className={cn("w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none ring-0 transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900", inputClassName)}
        aria-label={ariaLabel}
      />
      <button type="button" onClick={save} className="shrink-0 rounded-lg bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950" aria-label="Salvar">
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(false);
          onEditingChange?.(false);
        }}
        className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-slate-800 dark:text-slate-300"
        aria-label="Cancelar"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
