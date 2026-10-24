"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import { ProjectNavigation } from "./ProjectNavigation";
import { SidebarBrand } from "./SidebarBrand";
import { TeamPreview } from "./TeamPreview";
import { WorkspaceNavigation } from "./WorkspaceNavigation";

type SidebarProps = {
  onNavigate?: () => void;
  dropdown?: boolean;
};

export function Sidebar({ onNavigate, dropdown = false }: SidebarProps) {
  const workspaces = useBoardStore((state) => state.workspaces);
  const activeWorkspaceId = useBoardStore((state) => state.activeWorkspaceId);
  const activeProjectId = useBoardStore((state) => state.activeProjectId);
  const workspace = useBoardStore(selectActiveWorkspace);
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
    if (!workspace || !name) return;
    addProject(workspace.id, name);
    setProjectName("");
    onNavigate?.();
  };

  return (
    <aside className={cn("flex flex-col gap-5 overflow-y-auto backdrop-blur", dropdown ? "border-0 bg-transparent p-0 dark:bg-transparent" : "h-full border-r border-slate-200 bg-white/75 p-4 dark:border-slate-800 dark:bg-slate-950/75 lg:p-5")}>
      <SidebarBrand />

      <WorkspaceNavigation
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        workspaceName={workspaceName}
        onWorkspaceNameChange={setWorkspaceName}
        onSelectWorkspace={(workspaceId) => {
          setActiveWorkspace(workspaceId);
          onNavigate?.();
        }}
        onCreateWorkspace={createWorkspace}
      />

      <ProjectNavigation
        workspace={workspace}
        activeProjectId={activeProjectId}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSelectProject={(projectId) => {
          setActiveProject(projectId);
          onNavigate?.();
        }}
        onCreateProject={createProject}
      />

      <TeamPreview workspace={workspace} />
    </aside>
  );
}
