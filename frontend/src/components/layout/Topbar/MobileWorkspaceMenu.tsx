import { LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import type { Priority, Workspace } from "@/types/board";
import { TopbarFilters } from "./TopbarFilters";

type MobileWorkspaceMenuProps = {
  open: boolean;
  workspace?: Workspace | null;
  projectId?: string | null;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  onNavigate: () => void;
  onLogout: () => void;
  theme: "light" | "dark";
  onChangeTheme: (theme: "light" | "dark") => void;
  onPriorityChange: (value: Priority | "todas") => void;
  onAssigneeChange: (value: string | "todos") => void;
};

export function MobileWorkspaceMenu({ open, workspace, projectId, priorityFilter, assigneeFilter, onNavigate, onLogout, theme, onChangeTheme, onPriorityChange, onAssigneeChange }: MobileWorkspaceMenuProps) {
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
            projectId={projectId}
            priorityFilter={priorityFilter}
            assigneeFilter={assigneeFilter}
            onPriorityChange={onPriorityChange}
            onAssigneeChange={onAssigneeChange}
            priorityClassName="min-w-0 w-full"
            assigneeClassName="min-w-0 w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-2 dark:border-slate-800">
          <span className="px-2 text-sm font-medium text-slate-600 dark:text-slate-300">Tema</span>
          <ThemeToggle theme={theme} onChangeTheme={onChangeTheme} className="icon-button" />
        </div>
        <button type="button" onClick={onLogout} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-slate-800">
          <LogOut className="size-4" /> Sair
        </button>
      </div>
    </div>
  );
}
