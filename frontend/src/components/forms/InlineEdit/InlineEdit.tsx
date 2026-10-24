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
};

export function InlineEdit({ value, onSave, className, inputClassName, ariaLabel }: InlineEditProps) {
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
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn("group inline-flex max-w-full items-center gap-2 text-left", className)}
        aria-label={ariaLabel}
      >
        <span className="truncate">{value}</span>
        <Pencil className="size-3.5 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn("min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900", inputClassName)}
        aria-label={ariaLabel}
      />
      <button type="button" onClick={save} className="rounded-lg bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950" aria-label="Salvar">
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-slate-800 dark:text-slate-300"
        aria-label="Cancelar"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
