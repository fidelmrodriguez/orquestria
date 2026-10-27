"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SearchField } from "./SearchField";

type CompactSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Em tablets, mantém a pesquisa disponível sem ocupar uma segunda linha fixa. */
export function CompactSearch({ value, onChange }: CompactSearchProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    containerRef.current?.querySelector("input")?.focus();

    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
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
    <div ref={containerRef} className="relative hidden shrink-0 md:block 2xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Fechar busca" : "Abrir busca"}
        aria-expanded={open}
        aria-controls={panelId}
        className="icon-button"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="size-4" /> : <Search className="size-4" />}
      </button>
      {open && (
        <div
          id={panelId}
          role="search"
          aria-label="Pesquisar tarefas"
          className="absolute right-0 top-full z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-950"
        >
          <SearchField value={value} onChange={onChange} placeholder="Pesquisar tarefas, tags ou responsáveis" />
        </div>
      )}
    </div>
  );
}
