import { useEffect } from "react";
import { LogOut, X } from "lucide-react";
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
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div
      id="orquestria-mobile-navigation"
      aria-hidden={!open}
      className={cn("fixed inset-0 z-[70] lg:hidden", open ? "block" : "hidden")}
    >
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onNavigate} aria-hidden="true" />

      <div
        role="navigation"
        aria-label="Navegação mobile"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onNavigate();
            document.querySelector<HTMLButtonElement>('[aria-controls="orquestria-mobile-navigation"]')?.focus();
          }
        }}
        className="relative flex h-full flex-col overflow-hidden bg-white px-4 pb-6 pt-4 dark:bg-slate-950"
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Menu</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Workspaces, projetos e preferências</p>
          </div>
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Fechar menu"
            className="icon-button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
