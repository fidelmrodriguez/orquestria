export type Priority = "baixa" | "media" | "alta" | "critica";

export type Member = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "membro-admin" | "editor" | "viewer";
};

export type Comment = {
  id: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  columnId: string;
  /** Ordem persistida na coluna (começa em zero). */
  position?: number;
  projectId: string;
  assigneeId: string;
  priority: Priority;
  tags: string[];
  dueDate: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
};

export type Column = {
  id: string;
  projectId: string;
  title: string;
  order: number;
  color: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  visibility: "privado" | "equipe";
  createdAt: string;
};

export type Workspace = {
  id: string;
  invited?: boolean;
  invitedOwner?: string;
  name: string;
  description: string;
  projects: Project[];
  columns: Column[];
  tasks: Task[];
  members: Member[];
};

export type Activity = {
  id: string;
  message: string;
  createdAt: string;
  type: "system" | "task" | "comment" | "sync";
};

export type SourceTodo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};

export type SourceUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
};
