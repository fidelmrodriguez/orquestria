"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildWorkspaceFromSource, defaultColumns } from "@/lib/board";
import { uid } from "@/lib/utils";
import { shouldMoveTask } from "@/lib/kanban-drag";
import { applyTaskReorder, isNoopReorder } from "@/lib/task-order";
import { isApiMode, UNASSIGNED_WORKSPACE_ID, loadRemoteBoard, mapTask, postApi, toApiDate, toApiPriority, type ApiTask } from "@/lib/remote-board";
import type { DeleteTarget } from "@/lib/kanban-deletion";
import { revokeSession } from "@/lib/auth-client";
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
  search: string;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  theme: ThemeMode;
  bootstrapped: boolean;
  activities: Activity[];
  remoteReady: boolean;
  remoteLoading: boolean;
  remoteActionLabel: string;
  remoteError: string | null;
  setRemoteBoard: (workspaces: Workspace[]) => void;
  setRemoteError: (message: string) => void;
  reloadRemote: () => Promise<void>;
  login: (name: string, email: string, id?: string) => void;
  logout: () => void;
  hydrateFromSource: (todos: SourceTodo[], users: SourceUser[]) => void;
  setActiveWorkspace: (workspaceId: string) => void;
  setActiveProject: (projectId: string) => void;
  setSelectedTask: (taskId: string | null) => void;
  setSearch: (value: string) => void;
  setPriorityFilter: (value: Priority | "todas") => void;
  setAssigneeFilter: (value: string | "todos") => void;
  setTheme: (theme: ThemeMode) => void;
  addWorkspace: (name: string) => void;
  addProject: (workspaceId: string, name: string) => void;
  updateProject: (projectId: string, name: string) => void;
  addColumn: (projectId: string, title: string) => void;
  updateColumn: (columnId: string, title: string) => void;
  addTask: (payload: AddTaskPayload) => Promise<boolean> | void;
  duplicateTask: (taskId: string) => Promise<boolean> | void;
  updateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "comments">>) => Promise<boolean> | void;
  moveTask: (taskId: string, columnId: string, position?: number) => void;
  addComment: (taskId: string, message: string) => Promise<boolean> | void;
  removeComment: (taskId: string, commentId: string) => Promise<boolean> | void;
  applyRemoteDeletion: (target: DeleteTarget) => void;
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

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function createDefaultColumns(projectId: string) {
  for (const [index, column] of defaultColumns.entries()) {
    await postApi(`/api/projects/${projectId}/columns`, {
      title: column.title, position: index, color: column.color
    });
  }
}

type RemoteSelection = { workspaceId?: string; projectId?: string; taskId?: string };

async function runRemoteMutation(
  set: (value: Partial<BoardState>) => void,
  get: () => BoardState,
  actionLabel: string,
  action: () => Promise<RemoteSelection>
): Promise<boolean> {
  if (get().remoteLoading) {
    set({ remoteError: "Aguarde a operação anterior terminar antes de continuar." });
    return false;
  }
  set({ remoteLoading: true, remoteActionLabel: actionLabel, remoteError: null });
  try {
    const preferred = await action();
    const user = get().currentUser;
    if (!user) throw new Error("Faça login novamente para atualizar os dados.");
    const workspaces = await loadRemoteBoard(user);
    get().setRemoteBoard(workspaces);
    const selectedWorkspace = preferred.workspaceId
      || workspaces.find((space) => space.projects.some((p) => p.id === preferred.projectId))?.id;
    set({
      ...(selectedWorkspace ? { activeWorkspaceId: selectedWorkspace } : {}),
      ...(preferred.projectId ? { activeProjectId: preferred.projectId } : {}),
      ...(preferred.taskId ? { selectedTaskId: preferred.taskId } : {}),
      remoteError: null
    });
    return true;
  } catch (error) {
    console.error("[Orquestria] Operação da API não foi concluída", error);
    set({ remoteError: describeError(error) });
    return false;
  } finally {
    set({ remoteLoading: false, remoteActionLabel: "Salvando alterações..." });
  }
}

/** Apply a confirmed server response to a single resource without refetching the board. */
async function runRemoteEntityMutation<T>(
  set: (value: Partial<BoardState> | ((state: BoardState) => Partial<BoardState>)) => void,
  get: () => BoardState,
  label: string,
  request: () => Promise<T>,
  apply: (state: BoardState, result: T) => Partial<BoardState>
): Promise<boolean> {
  if (get().remoteLoading) {
    set({ remoteError: "Aguarde a operação anterior terminar antes de continuar." });
    return false;
  }
  set({ remoteLoading: true, remoteActionLabel: label, remoteError: null });
  try {
    const result = await request();
    set((state) => ({ ...apply(state, result), remoteError: null }));
    return true;
  } catch (error) {
    console.error("[Orquestria] Falha ao atualizar dados", error);
    set({ remoteError: describeError(error) });
    return false;
  } finally {
    set({ remoteLoading: false, remoteActionLabel: "Salvando alterações..." });
  }
}

/** The mutation response already contains the updated task and its comments.
 * Avoid reloading every project (2 GET requests per project) after every task edit. */
async function runRemoteTaskMutation(
  set: (value: Partial<BoardState> | ((state: BoardState) => Partial<BoardState>)) => void,
  get: () => BoardState,
  label: string,
  action: () => Promise<ApiTask>,
  selectCreated = false
): Promise<boolean> {
  if (get().remoteLoading) {
    set({ remoteError: "Aguarde a operação anterior terminar antes de continuar." });
    return false;
  }
  set({ remoteLoading: true, remoteActionLabel: label, remoteError: null });
  try {
    const result = await action();
    const member = get().currentUser;
    if (!member) throw new Error("Faça login novamente para continuar.");
    const mapped = mapTask(result, member);
    set((state) => ({
      workspaces: state.workspaces.map((space) => ({
        ...space,
        tasks: space.projects.some((project) => project.id === result.projectId)
          ? (space.tasks.some((task) => task.id === mapped.id)
              ? space.tasks.map((task) => task.id === mapped.id ? mapped : task)
              : [...space.tasks, mapped])
          : space.tasks
      })),
      ...(selectCreated ? { selectedTaskId: mapped.id } : {}),
      remoteError: null
    }));
    return true;
  } catch (error) {
    console.error("[Orquestria] Falha ao salvar tarefa", error);
    set({ remoteError: describeError(error) });
    return false;
  } finally {
    set({ remoteLoading: false, remoteActionLabel: "Salvando alterações..." });
  }
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      workspaces: [],
      activeWorkspaceId: null,
      activeProjectId: null,
      selectedTaskId: null,
      search: "",
      priorityFilter: "todas",
      assigneeFilter: "todos",
      theme: "light",
      bootstrapped: false,
      activities: [],
      remoteReady: false,
      remoteLoading: false,
      remoteActionLabel: "Salvando alterações...",
      remoteError: null,
      setRemoteBoard: (workspaces) => set((state) => ({
        workspaces,
        remoteReady: true,
        remoteError: null,
        activeWorkspaceId: workspaces.some((space) => space.id === state.activeWorkspaceId)
          ? state.activeWorkspaceId : (workspaces[0]?.id || null),
        activeProjectId: workspaces.some((space) => space.projects.some((project) => project.id === state.activeProjectId))
          ? state.activeProjectId : (workspaces.find((space) => space.id === state.activeWorkspaceId)?.projects[0]?.id
            || workspaces.find((space) => space.projects.length)?.projects[0]?.id || null)
      })),
      setRemoteError: (message) => set({ remoteError: message, remoteReady: false }),
      reloadRemote: async () => {
        const member = get().currentUser;
        if (!member || get().remoteLoading) return;
        set({ remoteLoading: true, remoteActionLabel: "Atualizando dados...", remoteError: null });
        try { get().setRemoteBoard(await loadRemoteBoard(member)); }
        catch (error) {
          console.error("[Orquestria] Falha ao atualizar dados da API", error);
          set({ remoteError: describeError(error) });
        }
        finally { set({ remoteLoading: false, remoteActionLabel: "Salvando alterações..." }); }
      },
      login: (name, email, id) => {
        const user: Member = {
          id: id || "member-current-user",
          name: name.trim() || "User",
          email: email.trim() || "user@empresa.com",
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User",
          role: "admin"
        };

        set((state) => ({
          currentUser: user,
          workspaces: [], activeWorkspaceId: null, activeProjectId: null,
          remoteReady: false,
          remoteError: null,
          activities: appendActivity("User entrou no ambiente de trabalho.", "system", state.activities)
        }));
      },
      logout: () => {
        if (isApiMode) void revokeSession();
        set({ currentUser: null, workspaces: [], activeWorkspaceId: null, activeProjectId: null,
          selectedTaskId: null, remoteReady: false, remoteError: null, bootstrapped: false, activities: [] });
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
      setSearch: (value) => set({ search: value }),
      setPriorityFilter: (value) => set({ priorityFilter: value }),
      setAssigneeFilter: (value) => set({ assigneeFilter: value }),
      setTheme: (theme) => set({ theme }),
      addWorkspace: (name) => {
        if (isApiMode) {
          return runRemoteMutation(set, get, "Criando workspace...", async () => {
            const created = await postApi<{id: string}>("/api/workspaces", { name, description: "" });
            const project = await postApi<{id: string}>("/api/projects", {
              name: "Projeto inicial", description: "Primeira frente de trabalho do espaço.", workspaceId: created.id
            });
            await createDefaultColumns(project.id);
            return { workspaceId: created.id, projectId: project.id };
          });
        }
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
        if (isApiMode) {
          return runRemoteMutation(set, get, "Criando projeto...", async () => {
            const created = await postApi<{id: string}>("/api/projects", {
              name, description: "Projeto criado para centralizar atividades e entregas.",
              workspaceId: workspaceId === UNASSIGNED_WORKSPACE_ID ? null : workspaceId
            });
            await createDefaultColumns(created.id);
            return { workspaceId, projectId: created.id };
          });
        }
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
        if (isApiMode) return runRemoteEntityMutation(set, get, "Salvando projeto...",
          () => postApi<{id:string; name:string}>(`/api/projects/${projectId}/rename`, { name }),
          (state, saved) => ({ workspaces: state.workspaces.map((space) => ({ ...space,
            projects: space.projects.map((project) => project.id === saved.id ? { ...project, name: saved.name } : project)
          })) }));
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            projects: workspace.projects.map((project) => (project.id === projectId ? { ...project, name } : project))
          }))
        }));
      },
      addColumn: (projectId, title) => {
        if (isApiMode) return runRemoteEntityMutation(set, get, "Criando coluna...", async () => {
          const space = get().workspaces.find((item) => item.projects.some((project) => project.id === projectId));
          const count = space?.columns.filter((column) => column.projectId === projectId).length || 0;
          return postApi<{id:string; projectId:string; title:string; position:number; color:string}>(
            `/api/projects/${projectId}/columns`, { title, position: count, color: "slate" });
        }, (state, saved) => ({ workspaces: state.workspaces.map((space) => ({ ...space,
          columns: space.projects.some((project) => project.id === projectId)
            ? [...space.columns, { id: saved.id, projectId: saved.projectId, title: saved.title,
              order: saved.position, color: saved.color.startsWith("bg-") ? saved.color : "bg-slate-400" }]
            : space.columns
        })) }));
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
        if (isApiMode) return runRemoteEntityMutation(set, get, "Salvando coluna...", async () => {
          const column = get().workspaces.flatMap((space) => space.columns).find((item) => item.id === columnId);
          if (!column) throw new Error("Coluna não encontrada.");
          return postApi<{id:string;title:string}>(`/api/projects/${column.projectId}/columns/${column.id}/rename`, { title });
        }, (state, saved) => ({ workspaces: state.workspaces.map((space) => ({ ...space,
          columns: space.columns.map((column) => column.id === saved.id ? { ...column, title: saved.title } : column)
        })) }));
        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            columns: workspace.columns.map((column) => (column.id === columnId ? { ...column, title } : column))
          }))
        }));
      },
      addTask: (payload) => {
        if (isApiMode) return runRemoteTaskMutation(set, get, "Criando tarefa...", async () => {
          const current = get().workspaces.flatMap((space) => space.tasks)
            .filter((task) => task.projectId === payload.projectId && task.columnId === payload.columnId);
          return postApi<ApiTask>(`/api/projects/${payload.projectId}/tasks`, {
            title: payload.title, description: payload.description, columnId: payload.columnId,
            priority: toApiPriority(payload.priority), dueDate: toApiDate(payload.dueDate),
            position: current.length, assigneeId: payload.assigneeId, tags: payload.tags
          });
        });
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
          selectedTaskId: null,
          activities: appendActivity(`Tarefa ${task.title} criada.`, "task", state.activities)
        }));
      },
      duplicateTask: (taskId) => {
        const source = get().workspaces.flatMap(space => space.tasks).find(task => task.id === taskId);
        if (!source) return;
        // Insere a cópia logo abaixo da tarefa original, atualizando a ordem visual.
        const placeCopy = (state: BoardState, copy: Task) => ({
          workspaces: state.workspaces.map(space => {
            if (!space.projects.some(project => project.id === source.projectId)) return space;
            const relevant = space.tasks.filter(task => task.projectId === source.projectId && task.columnId === source.columnId)
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            const others = space.tasks.filter(task => task.projectId !== source.projectId || task.columnId !== source.columnId);
            const index = relevant.findIndex(task => task.id === taskId);
            if (index < 0) return space;
            relevant.splice(index + 1, 0, copy);
            return { ...space, tasks: [...others, ...relevant.map((task, position) => ({ ...task, position }))] };
          }),
          selectedTaskId: null,
          remoteError: null
        });
        if (isApiMode) return runRemoteEntityMutation(set, get, "Duplicando tarefa...",
          () => postApi<ApiTask>(`/api/projects/${source.projectId}/tasks/${taskId}/duplicate`, {}),
          (state, saved) => {
            if (!state.currentUser) return {};
            return placeCopy(state, mapTask(saved, state.currentUser));
          });
        const now = new Date().toISOString();
        const copy: Task = { ...source, id: uid("task"),
          comments: source.comments.map(comment => ({ ...comment, id: uid("comment"), createdAt: now })),
          createdAt: now, updatedAt: now };
        set(state => ({ ...placeCopy(state, copy),
          activities: appendActivity(`Tarefa ${source.title} duplicada.`, "task", state.activities) }));
        // A duplicação local atualiza o estado imediatamente; somente a API retorna Promise<boolean>.
        return;
      },
      updateTask: (taskId, patch) => {
        if (isApiMode) return runRemoteTaskMutation(set, get, "Salvando tarefa...", async () => {
          const task = get().workspaces.flatMap((space) => space.tasks).find((item) => item.id === taskId);
          if (!task) throw new Error("Tarefa não encontrada.");
          const data = { ...task, ...patch };
          return postApi<ApiTask>(`/api/projects/${task.projectId}/tasks/${task.id}/edit`, {
            title: data.title, description: data.description, priority: toApiPriority(data.priority),
            dueDate: toApiDate(data.dueDate), assigneeId: data.assigneeId, tags: data.tags
          });
        });
        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            tasks: workspace.tasks.map((task) =>
              task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task
            )
          }))
        }));
      },
      moveTask: (taskId, columnId, position) => {
        const all = get().workspaces.flatMap((space) => space.tasks);
        const existing = all.find((task) => task.id === taskId);
        if (!existing) return;
        const targetPosition = position ?? 0;
        if (!shouldMoveTask(existing.columnId, columnId) &&
            (position === undefined || isNoopReorder(all, taskId, columnId, targetPosition))) return;
        if (isApiMode) return runRemoteEntityMutation(set, get, "Organizando tarefas...", async () => {
          return postApi<ApiTask>(`/api/projects/${existing.projectId}/tasks/${taskId}/move`, {
            columnId, position: targetPosition
          });
        }, (state, result) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            tasks: applyTaskReorder(workspace.tasks, taskId, result.columnId, result.position)
              .map(task => task.id === taskId && state.currentUser ? mapTask(result, state.currentUser) : task)
          }))
        }));
        set((state) => ({
          ...updateWorkspace(state, (workspace) => ({
            ...workspace,
            tasks: applyTaskReorder(workspace.tasks, taskId, columnId, targetPosition)
          })),
          activities: appendActivity("Ordem de tarefas atualizada.", "task", state.activities)
        }));
      },
      addComment: (taskId, message) => {
        if (isApiMode) return runRemoteTaskMutation(set, get, "Enviando comentário...", async () => {
          const task = get().workspaces.flatMap((space) => space.tasks).find((item) => item.id === taskId);
          const author = get().currentUser;
          if (!task || !author) throw new Error("Tarefa ou usuário não encontrado.");
          return postApi<ApiTask>(`/api/projects/${task.projectId}/tasks/${taskId}/comments`, {
            authorId: author.id, message
          });
        });
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
      removeComment: (taskId, commentId) => {
        if (isApiMode) return runRemoteTaskMutation(set, get, "Excluindo comentário...", async () => {
          const task = get().workspaces.flatMap((space) => space.tasks).find((item) => item.id === taskId);
          if (!task) throw new Error("Tarefa não encontrada.");
          return postApi<ApiTask>(`/api/projects/${task.projectId}/tasks/${task.id}/comments/${commentId}/delete`, {});
        });
        set((state) => ({ ...updateWorkspace(state, (space) => ({ ...space,
          tasks: space.tasks.map((task) => task.id === taskId
            ? { ...task, comments: task.comments.filter((comment) => comment.id !== commentId) }
            : task)
        })) }));
      },
      // The server confirmed deletion. Update only local entities instead of a full board reload.
      applyRemoteDeletion: (target) => set((state) => {
        const spaces = state.workspaces.map((space) => ({
          ...space,
          projects: space.projects.filter((project) => !(target.kind === "project" && project.id === target.id)),
          columns: space.columns.filter((column) => !(
            (target.kind === "column" && column.id === target.id) ||
            (target.kind === "project" && column.projectId === target.id))),
          tasks: space.tasks.filter((task) => !(
            (target.kind === "task" && task.id === target.id) ||
            (target.kind === "project" && task.projectId === target.id)))
        })).filter((space) => !(target.kind === "workspace" && space.id === target.id));
        const workspaceId = spaces.some((space) => space.id === state.activeWorkspaceId)
          ? state.activeWorkspaceId : (spaces[0]?.id || null);
        const projectId = spaces.some((space) => space.projects.some((project) => project.id === state.activeProjectId))
          ? state.activeProjectId : (spaces.find((space) => space.id === workspaceId)?.projects[0]?.id || null);
        return {
          workspaces: spaces,
          activeWorkspaceId: workspaceId,
          activeProjectId: projectId,
          selectedTaskId: target.kind === "task" && state.selectedTaskId === target.id ? null : state.selectedTaskId,
          remoteError: null
        };
      }),
      applyExternalSnapshot: (snapshot) => {
        if (isApiMode) return; // O banco remoto prevalece sobre dados de outras abas.
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
        workspaces: isApiMode ? [] : state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        activeProjectId: state.activeProjectId,
        search: state.search,
        priorityFilter: state.priorityFilter,
        assigneeFilter: state.assigneeFilter,
        theme: state.theme,
        bootstrapped: isApiMode ? false : state.bootstrapped,
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
