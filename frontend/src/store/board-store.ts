"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildWorkspaceFromSource, defaultColumns } from "@/lib/board";
import { uid } from "@/lib/utils";
import type { Activity, SourceTodo, SourceUser, Member, Priority, Project, Task, Workspace } from "@/types/board";

export type ThemeMode = "light" | "dark";

export type BoardSnapshot = Pick<
  BoardState,
  "workspaces" | "activeWorkspaceId" | "activeProjectId" | "currentUser" | "theme"
>;

type BoardState = {
  currentUser: Member | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  selectedTaskId: string | null;
  draggedTaskId: string | null;
  search: string;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  theme: ThemeMode;
  bootstrapped: boolean;
  activities: Activity[];
  login: (name: string, email: string) => void;
  logout: () => void;
  hydrateFromSource: (todos: SourceTodo[], users: SourceUser[]) => void;
  setActiveWorkspace: (workspaceId: string) => void;
  setActiveProject: (projectId: string) => void;
  setSelectedTask: (taskId: string | null) => void;
  setDraggedTask: (taskId: string | null) => void;
  setSearch: (value: string) => void;
  setPriorityFilter: (value: Priority | "todas") => void;
  setAssigneeFilter: (value: string | "todos") => void;
  setTheme: (theme: ThemeMode) => void;
  addWorkspace: (name: string) => void;
  addProject: (workspaceId: string, name: string) => void;
  updateProject: (projectId: string, name: string) => void;
  addColumn: (projectId: string, title: string) => void;
  updateColumn: (columnId: string, title: string) => void;
  addTask: (payload: AddTaskPayload) => void;
  updateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "comments">>) => void;
  moveTask: (taskId: string, columnId: string) => void;
  addComment: (taskId: string, message: string) => void;
  applyExternalSnapshot: (snapshot: BoardSnapshot) => void;
  pushActivity: (message: string, type?: Activity["type"]) => void;
};

export type AddTaskPayload = {
  title: string;
  description: string;
  columnId: string;
  projectId: string;
  assigneeId: string;
  priority: Priority;
  tags: string[];
  dueDate: string;
};

function getActiveWorkspace(state: BoardState) {
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId);
}

function appendActivity(message: string, type: Activity["type"] = "system", activities: Activity[] = []) {
  return [
    {
      id: uid("activity"),
      message,
      type,
      createdAt: new Date().toISOString()
    },
    ...activities
  ].slice(0, 12);
}

function updateWorkspace(state: BoardState, updater: (workspace: Workspace) => Workspace): Partial<BoardState> {
  const workspace = getActiveWorkspace(state);
  if (!workspace) return {};

  return {
    workspaces: state.workspaces.map((item) => (item.id === workspace.id ? updater(item) : item))
  };
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      workspaces: [],
      activeWorkspaceId: null,
      activeProjectId: null,
      selectedTaskId: null,
      draggedTaskId: null,
      search: "",
      priorityFilter: "todas",
      assigneeFilter: "todos",
      theme: "light",
      bootstrapped: false,
      activities: [],
      login: (name, email) => {
        const user: Member = {
          id: "member-current-user",
          name: name.trim() || "User",
          email: email.trim() || "user@empresa.com",
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User",
          role: "admin"
        };

        set((state) => ({
          currentUser: user,
          activities: appendActivity("User entrou no ambiente de trabalho.", "system", state.activities)
        }));
      },
      logout: () => {
        set({ currentUser: null, selectedTaskId: null });
      },
      hydrateFromSource: (todos, users) => {
        const state = get();
        if (state.bootstrapped && state.workspaces.length) return;

        const workspace = buildWorkspaceFromSource(todos, users);
        const currentUser = get().currentUser;
        const members = currentUser
          ? [currentUser, ...workspace.members.filter((member) => member.email !== currentUser.email)]
          : workspace.members;
        const normalizedWorkspace = { ...workspace, members };
        const project = normalizedWorkspace.projects[0];

        set((current) => ({
          workspaces: [normalizedWorkspace],
          activeWorkspaceId: normalizedWorkspace.id,
          activeProjectId: project?.id || null,
          bootstrapped: true,
          activities: appendActivity("Dados iniciais carregados pela fonte operacional.", "sync", current.activities)
        }));
      },
      setActiveWorkspace: (workspaceId) => {
        const workspace = get().workspaces.find((item) => item.id === workspaceId);
        set({
          activeWorkspaceId: workspaceId,
          activeProjectId: workspace?.projects[0]?.id || null,
          selectedTaskId: null
        });
      },
      setActiveProject: (projectId) => set({ activeProjectId: projectId, selectedTaskId: null }),
      setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
      setDraggedTask: (taskId) => set({ draggedTaskId: taskId }),
      setSearch: (value) => set({ search: value }),
      setPriorityFilter: (value) => set({ priorityFilter: value }),
      setAssigneeFilter: (value) => set({ assigneeFilter: value }),
      setTheme: (theme) => set({ theme }),
      addWorkspace: (name) => {
        const id = uid("workspace");
        const projectId = uid("project");
        const now = new Date().toISOString();
        const currentUser = get().currentUser;
        const workspace: Workspace = {
          id,
          name,
          description: "Novo espaço criado para organizar entregas da equipe.",
          members: currentUser ? [currentUser] : [],
          projects: [
            {
              id: projectId,
              workspaceId: id,
              name: "Projeto inicial",
              description: "Primeira frente de trabalho do espaço.",
              visibility: "equipe",
              createdAt: now
            }
          ],
          columns: defaultColumns.map((column) => ({ ...column, id: `${column.id}-${id}`, projectId })),
          tasks: []
        };

        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          activeWorkspaceId: id,
          activeProjectId: projectId,
          activities: appendActivity(`Workspace ${name} criado.`, "system", state.activities)
        }));
      },
      addProject: (workspaceId, name) => {
        const id = uid("project");
        const now = new Date().toISOString();
        const project: Project = {
          id,
          workspaceId,
          name,
          description: "Projeto criado para centralizar atividades e entregas.",
          visibility: "equipe",
          createdAt: now
        };

        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  projects: [...workspace.projects, project],
                  columns: [
                    ...workspace.columns,
                    ...defaultColumns.map((column) => ({ ...column, id: `${column.id}-${id}`, projectId: id }))
                  ]
                }
              : workspace
          ),
          activeWorkspaceId: workspaceId,
          activeProjectId: id,
          activities: appendActivity(`Projeto ${name} criado.`, "system", state.activities)
        }));
      },
      updateProject: (projectId, name) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            projects: workspace.projects.map((project) => (project.id === projectId ? { ...project, name } : project))
          }))
        }));
      },
      addColumn: (projectId, title) => {
        set((state) => ({
          ...updateWorkspace(state, (workspace) => {
            const projectColumns = workspace.columns.filter((column) => column.projectId === projectId);
            return {
              ...workspace,
              columns: [
                ...workspace.columns,
                {
                  id: uid("column"),
                  projectId,
                  title,
                  order: projectColumns.length + 1,
                  color: "bg-slate-500"
                }
              ]
            };
          }),
          activities: appendActivity(`Coluna ${title} criada.`, "system", state.activities)
        }));
      },
      updateColumn: (columnId, title) => {
        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            columns: workspace.columns.map((column) => (column.id === columnId ? { ...column, title } : column))
          }))
        }));
      },
      addTask: (payload) => {
        const now = new Date().toISOString();
        const task: Task = {
          id: uid("task"),
          ...payload,
          comments: [],
          createdAt: now,
          updatedAt: now
        };

        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({ ...workspace, tasks: [task, ...workspace.tasks] })),
          selectedTaskId: task.id,
          activities: appendActivity(`Tarefa ${task.title} criada.`, "task", state.activities)
        }));
      },
      updateTask: (taskId, patch) => {
        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            tasks: workspace.tasks.map((task) =>
              task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task
            )
          }))
        }));
      },
      moveTask: (taskId, columnId) => {
        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            tasks: workspace.tasks.map((task) =>
              task.id === taskId ? { ...task, columnId, updatedAt: new Date().toISOString() } : task
            )
          })),
          draggedTaskId: null,
          activities: appendActivity("Tarefa movida entre colunas.", "task", state.activities)
        }));
      },
      addComment: (taskId, message) => {
        const state = get();
        const currentUser = state.currentUser;
        if (!currentUser) return;

        set((current) => ({
          ...updateWorkspace(current, (workspace) => ({
            ...workspace,
            tasks: workspace.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    comments: [
                      ...task.comments,
                      {
                        id: uid("comment"),
                        authorId: currentUser.id,
                        message,
                        createdAt: new Date().toISOString()
                      }
                    ],
                    updatedAt: new Date().toISOString()
                  }
                : task
            )
          })),
          activities: appendActivity("Novo comentário adicionado.", "comment", current.activities)
        }));
      },
      applyExternalSnapshot: (snapshot) => {
        set((state) => ({
          ...snapshot,
          activities: appendActivity("Alterações sincronizadas em outra aba.", "sync", state.activities)
        }));
      },
      pushActivity: (message, type = "system") => {
        set((state) => ({ activities: appendActivity(message, type, state.activities) }));
      }
    }),
    {
      name: "orquestria-storage-v1",
      partialize: (state) => ({
        currentUser: state.currentUser,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        activeProjectId: state.activeProjectId,
        search: state.search,
        priorityFilter: state.priorityFilter,
        assigneeFilter: state.assigneeFilter,
        theme: state.theme,
        bootstrapped: state.bootstrapped,
        activities: state.activities
      })
    }
  )
);

export function selectActiveWorkspace(state: BoardState) {
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || null;
}

export function selectActiveProject(state: BoardState) {
  const workspace = selectActiveWorkspace(state);
  return workspace?.projects.find((project) => project.id === state.activeProjectId) || null;
}

export function selectSelectedTask(state: BoardState) {
  const workspace = selectActiveWorkspace(state);
  return workspace?.tasks.find((task) => task.id === state.selectedTaskId) || null;
}
