import type { SourceTodo, SourceUser } from "@/types/board";

const API_URL = "https://dummyjson.com";

type TodosResponse = {
  todos: SourceTodo[];
};

type UsersResponse = {
  users: SourceUser[];
};

export async function getSourceTodos() {
  const response = await fetch(`${API_URL}/todos?limit=24`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar tarefas da fonte de dados.");
  }

  const data = (await response.json()) as TodosResponse;
  return data.todos;
}

export async function getSourceUsers() {
  const response = await fetch(`${API_URL}/users?limit=12`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar usuários da fonte de dados.");
  }

  const data = (await response.json()) as UsersResponse;
  return data.users;
}

export async function getInitialBoardData() {
  const [todos, users] = await Promise.all([getSourceTodos(), getSourceUsers()]);
  return { todos, users };
}
