"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SearchField } from "./SearchField";
import { TopbarFilters } from "./TopbarFilters";
import type { Priority, Workspace } from "@/types/board";

type CompactSearchProps = {
  value: string;
  onChange: (value: string) => void;
  workspace?: Workspace | null;
  projectId?: string | null;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  onPriorityChange: (value: Priority | "todas") => void;
  onAssigneeChange: (value: string | "todos") => void;
};

/**
 * Busca compacta acionada por botão até 1919px.
 * A partir de 768px a faixa expandida apresenta input e filtros lado a lado,
 * ocupando toda a largura do topbar e deslocando o Kanban para baixo.
 */
export function CompactSearch({
  value,
  onChange,
  workspace,
  projectId,
  priorityFilter,
  assigneeFilter,
  onPriorityChange,
  onAssigneeChange
}: CompactSearchProps) {
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
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1920) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
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
        className="icon-button min-[1920px]:hidden"
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
          className="order-last relative z-10 w-full basis-full rounded-2xl border border-slate-200 bg-white p-3 shadow-card min-[1920px]:hidden dark:border-slate-700 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start">
            <SearchField value={value} onChange={onChange} placeholder="Buscar" className="min-w-0 flex-1" />
            <div className="hidden md:flex md:items-start md:gap-2">
              <TopbarFilters
                workspace={workspace}
                projectId={projectId}
                priorityFilter={priorityFilter}
                assigneeFilter={assigneeFilter}
                onPriorityChange={onPriorityChange}
                onAssigneeChange={onAssigneeChange}
                priorityClassName="w-[136px] shrink-0"
                assigneeClassName="w-[144px] shrink-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
