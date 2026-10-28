"use client";

import { useEffect, useRef } from "react";
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
  onLogout: () => void;
  onNewTask: () => void;
  onHeightChange: (height: number) => void;
};

export function Topbar({ mobileMenuOpen, onToggleMobileMenu, onLogout, onNewTask, onHeightChange }: TopbarProps) {
  const headerRef = useRef<HTMLElement>(null);

  // No mobile/tablet o cabeçalho permanece fixo. O espaço reservado no AppShell
  // deve acompanhar a altura real, inclusive quando a busca expandida é aberta.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => onHeightChange(Math.ceil(header.getBoundingClientRect().height));
    updateHeight();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(header);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [onHeightChange]);
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const currentUser = useBoardStore((state) => state.currentUser);
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
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:relative lg:z-30 lg:px-6">
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
          placeholder="Buscar"
          className="hidden min-w-[220px] max-w-md flex-1 min-[1920px]:flex"
        />

        <TopbarFilters
          workspace={workspace}
          projectId={project?.id}
          priorityFilter={priorityFilter}
          assigneeFilter={assigneeFilter}
          onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
          onAssigneeChange={setAssigneeFilter}
          priorityClassName="hidden w-[106px] shrink-0 min-[1920px]:block"
          assigneeClassName="hidden w-[112px] shrink-0 min-[1920px]:block"
        />

        {project && <div className="hidden lg:block"><AddColumnForm key={project.id} projectId={project.id} onAddColumn={addColumn} /></div>}

        <button type="button" aria-label="Nova tarefa" onClick={onNewTask} className="hidden lg:inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-card dark:bg-white dark:text-slate-950">
          <Plus className="size-4" /> <span className="hidden min-[1920px]:inline">Nova tarefa</span>
        </button>

        <CompactSearch
          value={search}
          onChange={setSearch}
          workspace={workspace}
          projectId={project?.id}
          priorityFilter={priorityFilter}
          assigneeFilter={assigneeFilter}
          onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
          onAssigneeChange={setAssigneeFilter}
        />

        <ThemeToggle theme={theme} onChangeTheme={setTheme} className="icon-button grid" />

        <NotificationsMenu activities={activities} />
        <UserMenu currentUser={currentUser} onLogout={onLogout} />
      </div>

      <MobileWorkspaceMenu
        open={mobileMenuOpen}
        currentUser={currentUser}
        workspace={workspace}
        projectId={project?.id}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        onNavigate={onToggleMobileMenu}
        onLogout={onLogout}
        theme={theme}
        onChangeTheme={setTheme}
        onPriorityChange={(value) => setPriorityFilter(value as Priority | "todas")}
        onAssigneeChange={setAssigneeFilter}
      />
    </header>
  );
}
