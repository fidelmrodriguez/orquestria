import type { Activity, Member, Workspace } from "@/types/board";

export type NotificationEntry = {
  id: string;
  message: string;
  createdAt: string;
  kind: "due" | Activity["type"];
  taskId?: string;
  projectId?: string;
};

/** Eventos operacionais locais + prazos atribuídos ao usuário; não simula push do servidor. */
export function getNotifications(activities: Activity[], workspaces: Workspace[], user: Member | null, now = new Date()): NotificationEntry[] {
  if (!user) return [];
  const events = activities.filter(item => item.notifiable === true).map(item => ({
    id: item.id, message: item.message, createdAt: item.createdAt,
    kind: item.type, taskId: item.taskId, projectId: item.projectId
  }));

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const deadlines = workspaces.flatMap(space => space.tasks)
    .filter(task => task.assigneeId === user.id && Boolean(task.dueDate))
    .flatMap((task) => {
      const due = new Date(task.dueDate);
      if (Number.isNaN(due.getTime())) return [];
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
      const days = Math.round((dueDay - today) / 86400000);
      if (days > 3) return [];
      const message = days < 0 ? `Prazo vencido: ${task.title}.` : days === 0
        ? `Vence hoje: ${task.title}.` : `Prazo em ${days} dia${days === 1 ? "" : "s"}: ${task.title}.`;
      return [{
        id: `due:${task.id}:${task.dueDate}`, message, createdAt: task.dueDate,
        kind: "due" as const, projectId: task.projectId, taskId: task.id
      }];
    });
  return [...deadlines, ...events].slice(0, 30);
}
