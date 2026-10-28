"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FolderKanban, FolderOpen, Plus, Settings2, Tags, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import { ProjectNavigation } from "./ProjectNavigation";
import { SidebarBrand } from "./SidebarBrand";
import { TeamPreview } from "./TeamPreview";
import { WorkspaceNavigation } from "./WorkspaceNavigation";

type SidebarProps = {
  onNavigate?: () => void;
  dropdown?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function Sidebar({ onNavigate, dropdown = false, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const workspaces = useBoardStore((state) => state.workspaces);
  const activeWorkspaceId = useBoardStore((state) => state.activeWorkspaceId);
  const activeProjectId = useBoardStore((state) => state.activeProjectId);
  const workspace = useBoardStore(selectActiveWorkspace);
  const ownedWorkspaces = workspaces.filter(item => !item.invited);
  const invitedWorkspaces = workspaces.filter(item => item.invited);
  const invitedActive = Boolean(workspace?.invited);
  const setActiveWorkspace = useBoardStore((state) => state.setActiveWorkspace);
  const setActiveProject = useBoardStore((state) => state.setActiveProject);
  const addWorkspace = useBoardStore((state) => state.addWorkspace);
  const addProject = useBoardStore((state) => state.addProject);
  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");

  const createWorkspace = () => {
    const name = workspaceName.trim();
    if (!name) return;
    addWorkspace(name);
    setWorkspaceName("");
    onNavigate?.();
  };

  const createProject = () => {
    const name = projectName.trim();
    if (!workspace || workspace.invited || !name) return;
    addProject(workspace.id, name);
    setProjectName("");
    onNavigate?.();
  };

  // No modo compacto os ícones continuam acionáveis; a navegação fica na
  // mesma coluna de layout, sem popover/overlay sobre o Kanban.
  if (collapsed && !dropdown) {
    return (
      <aside aria-label="Navegação compacta" className="flex h-full min-h-0 flex-col items-center gap-3 overflow-hidden border-r border-slate-200 bg-white/75 px-2 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
        <button type="button" onClick={onToggleCollapsed} aria-label="Expandir sidebar" title="Expandir sidebar"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-sky-700 dark:bg-white dark:text-slate-950">
          <ChevronRight className="size-5" />
        </button>
        <nav aria-label="Workspaces e projetos" className="sidebar-menu-scroll flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden py-2">
          <span className="sr-only">Workspaces</span>
          {ownedWorkspaces.map(item => (
            <button key={item.id} type="button" title={`Workspace: ${item.name}`} aria-label={`Selecionar workspace ${item.name}`}
              aria-current={item.id === activeWorkspaceId ? "true" : undefined}
              onClick={() => { setActiveWorkspace(item.id); onNavigate?.(); }}
              className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition", item.id === activeWorkspaceId
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900")}>
              <span className="flex flex-col items-center justify-center leading-none"><FolderKanban className="size-4" /><span className="mt-0.5 text-[9px] font-semibold">{item.name.trim().slice(0, 2).toLocaleUpperCase("pt-BR")}</span></span>
            </button>
          ))}
          <button type="button" title="Criar workspace" aria-label="Criar workspace" onClick={onToggleCollapsed}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
            <Plus className="size-4" />
          </button>
          <span aria-hidden="true" className="my-1 h-px w-9 shrink-0 bg-slate-200 dark:bg-slate-700" />
          {invitedWorkspaces.map(item => (
            <button key={item.id} type="button" title={`Workspace convidado: ${item.name}`} aria-label={`Workspace convidado ${item.name}`}
              onClick={() => { setActiveWorkspace(item.id); onNavigate?.(); }}
              className={cn("grid size-11 shrink-0 place-items-center rounded-xl", item.id === activeWorkspaceId
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900")}>
              <span className="flex flex-col items-center justify-center leading-none"><UsersRound className="size-4" /><span className="mt-0.5 text-[9px] font-semibold">{item.name.slice(0, 2).toUpperCase()}</span></span>
            </button>
          ))}
          <span aria-hidden="true" className="my-1 h-px w-9 shrink-0 bg-slate-200 dark:bg-slate-700" />
          <span className="sr-only">Projetos</span>
          {workspace?.projects.map(project => (
            <button key={project.id} type="button" title={`Projeto: ${project.name}`} aria-label={`Selecionar projeto ${project.name}`}
              aria-current={project.id === activeProjectId ? "true" : undefined}
              onClick={() => { setActiveProject(project.id); onNavigate?.(); }}
              className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition", project.id === activeProjectId
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900")}>
              <span className="flex flex-col items-center justify-center leading-none"><FolderOpen className="size-4" /><span className="mt-0.5 text-[9px] font-semibold">{project.name.trim().slice(0, 2).toLocaleUpperCase("pt-BR")}</span></span>
            </button>
          ))}
          {!invitedActive && <button type="button" title="Criar projeto" aria-label="Criar projeto" onClick={onToggleCollapsed}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
            <Plus className="size-4" />
          </button>}
          <span aria-hidden="true" className="my-1 h-px w-9 shrink-0 bg-slate-200 dark:bg-slate-700" />
          <a href="/gerenciar" aria-label="Gerenciar itens" title="Gerenciar itens" className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"><Settings2 className="size-5" /></a>
          {!invitedActive && <a href={activeProjectId ? `/equipe?projectId=${encodeURIComponent(activeProjectId)}` : "/equipe"} aria-label="Membros da equipe" title="Membros da equipe" className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"><UsersRound className="size-5" /></a>}
          <a href="/tags" aria-label="Minhas tags" title="Minhas tags" className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"><Tags className="size-5" /></a>
        </nav>
        <button type="button" onClick={onToggleCollapsed} aria-label="Expandir navegação e opções" title="Expandir navegação e opções"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
          <ChevronRight className="size-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className={cn("flex min-h-0 flex-col gap-3 backdrop-blur", dropdown ? "border-0 bg-transparent p-0 dark:bg-transparent" : "h-full overflow-hidden border-r border-slate-200 bg-white/75 p-4 dark:border-slate-800 dark:bg-slate-950/75 lg:p-4")}>
      {dropdown ? <SidebarBrand /> : <div className="flex items-center justify-between gap-2">
        <SidebarBrand />
        <button type="button" onClick={onToggleCollapsed} aria-label="Recolher sidebar" title="Recolher sidebar"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
          <ChevronLeft className="size-4" />
        </button>
      </div>}

      <div className={cn("space-y-4", dropdown ? "" : "sidebar-menu-scroll min-h-0 flex-1 overflow-y-auto pr-1")}>
      <WorkspaceNavigation
        workspaces={ownedWorkspaces}
        activeWorkspaceId={activeWorkspaceId}
        workspaceName={workspaceName}
        onWorkspaceNameChange={setWorkspaceName}
        onSelectWorkspace={(workspaceId) => {
          setActiveWorkspace(workspaceId);
          onNavigate?.();
        }}
        onCreateWorkspace={createWorkspace}
      />

      {invitedWorkspaces.length > 0 && <section className="space-y-2" aria-label="Workspaces convidados">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspaces convidados</p>
        {invitedWorkspaces.map(item => <div key={item.id} className="space-y-1">
          <button type="button" onClick={() => { setActiveWorkspace(item.id); onNavigate?.(); }}
            aria-expanded={item.id === activeWorkspaceId}
            className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium", item.id === activeWorkspaceId
              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900")}>
            <UsersRound className="size-4 shrink-0" /><span className="truncate">{item.name}</span>
          </button>
          {item.id === activeWorkspaceId && item.projects.map(project => <button key={project.id} type="button"
            onClick={() => { setActiveProject(project.id); onNavigate?.(); }}
            className={cn("block w-full truncate rounded-lg py-2 pl-9 pr-2 text-left text-sm", activeProjectId === project.id
              ? "font-semibold text-indigo-700 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900")}
            title={`${project.name} · membro-admin`}>{project.name}</button>)}
        </div>)}
      </section>}

      {!invitedActive && <ProjectNavigation
        workspace={workspace}
        activeProjectId={activeProjectId}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSelectProject={(projectId) => {
          setActiveProject(projectId);
          onNavigate?.();
        }}
        onCreateProject={createProject}
      />}

      <nav aria-label="Gerenciamento" className="space-y-1 border-t border-slate-200 pt-3 dark:border-slate-800">
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Gerenciamento</p>
        <a href="/gerenciar" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><Settings2 className="size-4" /> Gerenciar itens</a>
        {!invitedActive && <a href={activeProjectId ? `/equipe?projectId=${encodeURIComponent(activeProjectId)}` : "/equipe"} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><UsersRound className="size-4" /> Membros da equipe</a>}
        <a href="/tags" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><Tags className="size-4" /> Minhas tags</a>
      </nav>
      </div>
      <TeamPreview workspace={workspace} projectId={activeProjectId} />
    </aside>
  );
}
