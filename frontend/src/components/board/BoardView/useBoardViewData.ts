import { useMemo } from "react";
import type { Project, Workspace } from "@/types/board";

export function useBoardViewData(workspace: Workspace | null | undefined, project: Project | null | undefined, search: string, priorityFilter: string, assigneeFilter: string) {
  const columns = useMemo(() => {
    if (!workspace || !project) return [];
    return workspace.columns.filter((column) => column.projectId === project.id).sort((a, b) => a.order - b.order);
  }, [workspace, project]);

  const filteredTasks = useMemo(() => {
    if (!workspace || !project) return [];
    const term = search.trim().toLowerCase();

    return workspace.tasks.filter((task) => {
      if (task.projectId !== project.id) return false;
      if (priorityFilter !== "todas" && task.priority !== priorityFilter) return false;
      if (assigneeFilter !== "todos" && task.assigneeId !== assigneeFilter) return false;

      if (!term) return true;
      const member = workspace.members.find((item) => item.id === task.assigneeId);
      return [task.title, task.description, ...task.tags, member?.name || ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [assigneeFilter, priorityFilter, project, search, workspace]);

  return { columns, filteredTasks };
}
