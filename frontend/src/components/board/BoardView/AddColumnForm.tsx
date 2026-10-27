"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type AddColumnFormProps = {
  projectId: string;
  onAddColumn: (projectId: string, title: string) => void;
};

/** Compact action above the board; no placeholder column consumes horizontal space. */
export function AddColumnForm({ projectId, onAddColumn }: AddColumnFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [columnName, setColumnName] = useState("");

  if (!expanded) return <button type="button" onClick={() => setExpanded(true)}
    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    aria-label="Adicionar coluna ao projeto"><Plus className="size-4" /> Nova coluna</button>;

  return <form className="flex min-w-0 items-center gap-2" onSubmit={(event) => {
    event.preventDefault();
    const title = columnName.trim();
    if (!title) return;
    onAddColumn(projectId, title);
    setColumnName("");
    setExpanded(false);
  }}>
    <input autoFocus value={columnName} onChange={(event) => setColumnName(event.target.value)}
      maxLength={120} className="mini-field w-36 sm:w-52" aria-label="Nome da nova coluna" placeholder="Nome da coluna" />
    <button className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" type="submit" disabled={!columnName.trim()}>Criar</button>
    <button className="icon-button" type="button" aria-label="Cancelar nova coluna" onClick={() => {setExpanded(false);setColumnName("");}}><X className="size-4" /></button>
  </form>;
}
