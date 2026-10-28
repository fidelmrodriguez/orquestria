"use client";

import { Menu, Plus, X } from "lucide-react";
import { AddColumnForm } from "@/components/board/BoardView/AddColumnForm";
import { MobileWorkspaceMenu } from "./MobileWorkspaceMenu";
import { NotificationsMenu } from "./NotificationsMenu";
import { SearchField } from "./SearchField";
import { CompactSearch } from "./CompactSearch";
import { ThemeToggle } from "./ThemeToggle";
import { TopbarFilters } from "./TopbarFilters";
import { UserMenu } from "./UserMenu";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import type { Priority } from "@/types/board";

type TopbarProps = {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNewTask: () => void;
};

export function Topbar({ mobileMenuOpen, onToggleMobileMenu, onNewTask }: TopbarProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const currentUser = useBoardStore((state) => state.currentUser);
  const logout = useBoardStore((state) => state.logout);
  const search = useBoardStore((state) => state.search);
  const setSearch = useBoardStore((state) => state.setSearch);
  const priorityFilter = useBoardStore((state) => state.priorityFilter);
  const setPriorityFilter = useBoardStore((state) => state.setPriorityFilter);
  const assigneeFilter = useBoardStore((state) => state.assigneeFilter);
  const setAssigneeFilter = useBoardStore((state) => state.setAssigneeFilter);
  const theme = useBoardStore((state) => state.theme);
  const setTheme = useBoardStore((state) => state.setTheme);
  const activities = useBoardStore((state) => state.activities);
  const addColumn = useBoardStore((state) => state.addColumn);

  return (
    <header className="relative z-30 shrink-0 border-b border-slate-200 bg-white/95 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/95 lg:px-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="icon-button lg:hidden"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="orquestria-mobile-navigation"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{workspace?.name || "Workspace"}</p>
          <h1 className="truncate text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-2xl">
            {project?.name || "Projeto"}
          </h1>
        </div>

        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Pesquisar tarefas, tags ou responsáveis"
          className="hidden min-w-[200px] max-w-md flex-1 2xl:flex"
        />

        <CompactSearch value={search} onChange={setSearch} />

        <TopbarFilters
          workspace={workspace}
          priorityFilter={priorityFilter}
          assigneeFilter={assigneeFilter}
          onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
          onAssigneeChange={setAssigneeFilter}
          priorityClassName="hidden w-[106px] shrink-0 md:block"
          assigneeClassName="hidden w-[112px] shrink-0 lg:block"
        />

        {project && <AddColumnForm key={project.id} projectId={project.id} onAddColumn={addColumn} />}

        <button type="button" onClick={onNewTask} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-card dark:bg-white dark:text-slate-950">
          <Plus className="size-4" /> <span className="hidden sm:inline">Nova tarefa</span>
        </button>

        <ThemeToggle theme={theme} onChangeTheme={setTheme} className="icon-button hidden sm:grid" />
        <NotificationsMenu activities={activities} />
        <UserMenu currentUser={currentUser} onLogout={logout} />
      </div>

      <MobileWorkspaceMenu
        open={mobileMenuOpen}
        workspace={workspace}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        onNavigate={onToggleMobileMenu}
        onLogout={logout}
        theme={theme}
        onChangeTheme={setTheme}
        onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
        onAssigneeChange={setAssigneeFilter}
      />
    </header>
  );
}
