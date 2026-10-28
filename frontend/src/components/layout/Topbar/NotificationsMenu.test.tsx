import { fireEvent, render, screen } from "@testing-library/react";
import { NotificationsMenu } from "./NotificationsMenu";
import { useBoardStore } from "@/store/board-store";
import type { Activity, Workspace, Member } from "@/types/board";

const currentUser = { id: "u1", name: "Pessoa", email: "pessoa@teste.com" } as Member;
const workspace = {
  id: "ws1", name: "Workspace", projects: [{ id: "p1", workspaceId: "ws1", name: "Projeto" }],
  tasks: [{ id: "t1", projectId: "p1", columnId: "c1", assigneeId: "u1", title: "Entrega", dueDate: "" }]
} as Workspace;
const activities = [{ id: "a1", type: "comment", notifiable: true, message: "Comentário em Entrega", createdAt: "2026-10-28T09:00:00Z", projectId: "p1", taskId: "t1" }] as Activity[];

beforeEach(() => {
  useBoardStore.setState({ currentUser, workspaces: [workspace], notificationReadIds: [], selectedTaskId: null, activeProjectId: "p1", activeWorkspaceId: "ws1" });
});

afterEach(() => { useBoardStore.setState({ currentUser: null, workspaces: [], activities: [], notificationReadIds: [] }); });

it("sinaliza somente itens não lidos e remove a bolinha ao abrir", () => {
  render(<NotificationsMenu activities={activities} />);
  expect(screen.getByTestId("notification-unread-dot")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Notificações, 1 não lidas/i }));
  expect(screen.getByRole("dialog", { name: "Central de notificações" })).toBeInTheDocument();
  expect(screen.queryByTestId("notification-unread-dot")).not.toBeInTheDocument();
  expect(useBoardStore.getState().notificationReadIds).toContain("a1");
});

it("abre a tarefa vinculada, preservando o contexto de projeto", () => {
  render(<NotificationsMenu activities={activities} />);
  fireEvent.click(screen.getByRole("button", { name: /Notificações/i }));
  fireEvent.click(screen.getByRole("button", { name: "Abrir tarefa" }));
  expect(useBoardStore.getState().selectedTaskId).toBe("t1");
  expect(useBoardStore.getState().activeProjectId).toBe("p1");
  expect(screen.queryByRole("dialog", { name: "Central de notificações" })).not.toBeInTheDocument();
});
