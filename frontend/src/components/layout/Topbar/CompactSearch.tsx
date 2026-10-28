"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SearchField } from "./SearchField";

type CompactSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Campo sob demanda que se expande no fluxo do cabeçalho, sem sobrepor o Kanban. */
export function CompactSearch({ value, onChange }: CompactSearchProps) {
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    searchRef.current?.querySelector("input")?.focus();

    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Fechar busca" : "Abrir busca"}
        aria-expanded={open}
        aria-controls={panelId}
        className="icon-button 2xl:hidden"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="size-4" /> : <Search className="size-4" />}
      </button>
      {open && (
        <div
          id={panelId}
          role="search"
          aria-label="Pesquisar tarefas"
          ref={searchRef}
          className="order-last w-full basis-full rounded-2xl 2xl:hidden border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <SearchField value={value} onChange={onChange} placeholder="Buscar" />
        </div>
      )}
    </>
  );
}
