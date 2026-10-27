import { LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { cn } from "@/lib/utils";
import type { Priority, Workspace } from "@/types/board";
import { TopbarFilters } from "./TopbarFilters";

type MobileWorkspaceMenuProps = {
  open: boolean;
  workspace?: Workspace | null;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  onNavigate: () => void;
  onLogout: () => void;
  onPriorityChange: (value: Priority | "todas") => void;
  onAssigneeChange: (value: string | "todos") => void;
};

export function MobileWorkspaceMenu({ open, workspace, priorityFilter, assigneeFilter, onNavigate, onLogout, onPriorityChange, onAssigneeChange }: MobileWorkspaceMenuProps) {
  return (
    <div id="orquestria-mobile-navigation" role="navigation" aria-label="Navegação mobile" aria-hidden={!open} onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onNavigate();
        document.querySelector<HTMLButtonElement>('[aria-controls="orquestria-mobile-navigation"]')?.focus();
      }
    }} className={cn("absolute left-3 right-3 top-[calc(100%+8px)] z-50 max-h-[calc(100vh-120px)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950 lg:hidden", open ? "block" : "hidden")}>
      <Sidebar onNavigate={onNavigate} dropdown />
      <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <TopbarFilters
            workspace={workspace}
            priorityFilter={priorityFilter}
            assigneeFilter={assigneeFilter}
            onPriorityChange={onPriorityChange}
            onAssigneeChange={onAssigneeChange}
            priorityClassName="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            assigneeClassName="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
        <button type="button" onClick={onLogout} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-slate-800">
          <LogOut className="size-4" /> Sair
        </button>
      </div>
    </div>
  );
}
