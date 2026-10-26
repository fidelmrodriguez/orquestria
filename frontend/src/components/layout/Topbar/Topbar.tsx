"use client";

import { Menu, Plus, Share2, X } from "lucide-react";
import { MobileWorkspaceMenu } from "./MobileWorkspaceMenu";
import { NotificationsMenu } from "./NotificationsMenu";
import { SearchField } from "./SearchField";
import { ThemeToggle } from "./ThemeToggle";
import { TopbarFilters } from "./TopbarFilters";
import { UserMenu } from "./UserMenu";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import type { Priority } from "@/types/board";

type TopbarProps = {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNewTask: () => void;
  onShare: () => void;
};

export function Topbar({ mobileMenuOpen, onToggleMobileMenu, onNewTask, onShare }: TopbarProps) {
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

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:left-72 lg:px-6">
      <div className="flex items-center gap-3">
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
          className="hidden min-w-[280px] max-w-md flex-1 xl:flex"
        />

        <TopbarFilters
          workspace={workspace}
          priorityFilter={priorityFilter}
          assigneeFilter={assigneeFilter}
          onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
          onAssigneeChange={setAssigneeFilter}
          priorityClassName="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 md:block"
          assigneeClassName="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:block"
        />

        <button type="button" onClick={onShare} className="hidden rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-flex sm:items-center sm:gap-2">
          <Share2 className="size-4" /> Compartilhar
        </button>

        <button type="button" onClick={onNewTask} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-card dark:bg-white dark:text-slate-950">
          <Plus className="size-4" /> <span className="hidden sm:inline">Nova tarefa</span>
        </button>

        <ThemeToggle theme={theme} onChangeTheme={setTheme} className="icon-button hidden sm:grid" />
        <NotificationsMenu activities={activities} />
        <UserMenu currentUser={currentUser} onLogout={logout} />
      </div>

      <div className="mt-3 flex gap-2 xl:hidden">
        <SearchField value={search} onChange={setSearch} placeholder="Pesquisar" className="flex-1" />
        <ThemeToggle theme={theme} onChangeTheme={setTheme} className="icon-button sm:hidden" />
      </div>

      <MobileWorkspaceMenu
        open={mobileMenuOpen}
        workspace={workspace}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        onNavigate={onToggleMobileMenu}
        onShare={onShare}
        onLogout={logout}
        onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
        onAssigneeChange={setAssigneeFilter}
      />
    </header>
  );
}
