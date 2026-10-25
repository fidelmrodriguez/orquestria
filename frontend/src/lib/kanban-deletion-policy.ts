import type { Entity } from "./kanban-deletion";

/** Regras de apresentação. A API Java é sempre a autoridade final. */
export function taskCountInColumn(tasks: Entity[], columnId: string): number {
  return tasks.filter(task => task.columnId === columnId).length;
}

export function projectCountInWorkspace(projects: Entity[], workspaceId: string): number {
  return projects.filter(project => project.workspaceId === workspaceId).length;
}

export function canDeleteColumn(tasks: Entity[], columnId: string, loaded: boolean): boolean {
  return loaded && taskCountInColumn(tasks, columnId) === 0;
}

export function canDeleteWorkspace(projects: Entity[], workspaceId: string, loaded: boolean): boolean {
  return loaded && projectCountInWorkspace(projects, workspaceId) === 0;
}

export function requiresTypedConfirmation(kind: "task" | "column" | "project" | "workspace", isGuest: boolean): boolean {
  return isGuest || kind === "project" || kind === "workspace";
}
