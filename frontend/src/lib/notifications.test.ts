import { getNotifications } from "./notifications";
import type { Activity, Member, Workspace } from "@/types/board";

const user = { id: "user-1", name: "Ana" } as Member;
const baseDate = new Date(2026, 9, 28, 12, 0, 0);
const workspace = {
  projects: [{ id: "p1" }],
  tasks: [
    { id: "today", title: "Publicar versão", assigneeId: "user-1", projectId: "p1", dueDate: "2026-10-28T12:00:00Z" },
    { id: "later", title: "Próxima entrega", assigneeId: "user-1", projectId: "p1", dueDate: "2026-11-30T12:00:00Z" },
    { id: "other", title: "Tarefa de outra pessoa", assigneeId: "user-2", projectId: "p1", dueDate: "2026-10-28T12:00:00Z" }
  ]
} as Workspace;

it("exibe apenas prazos relevantes do usuário e eventos operacionais confirmados", () => {
  const activities = [
    { id: "event", message: "Comentário adicionado.", type: "comment", notifiable: true, createdAt: "2026-10-28T09:00:00Z", taskId: "today", projectId: "p1" },
    { id: "sync", message: "Dados sincronizados.", type: "sync", notifiable: false, createdAt: "2026-10-28T08:00:00Z" }
  ] as Activity[];
  const notifications = getNotifications(activities, [workspace], user, baseDate);
  expect(notifications.map(item => item.id)).toContain("event");
  expect(notifications.map(item => item.id)).toContain("due:today:2026-10-28T12:00:00Z");
  expect(notifications.map(item => item.id)).not.toContain("sync");
  expect(notifications.some(item => item.taskId === "other" || item.taskId === "later")).toBe(false);
});

it("não revela informações sem conta autenticada", () => {
  expect(getNotifications([], [workspace], null, baseDate)).toEqual([]);
});
