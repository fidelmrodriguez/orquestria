import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BoardDeletionActions from "@/components/board/BoardDeletionActions";
import { getAuthToken, restoreAuthSession } from "@/lib/auth-client";
import { apiRequest } from "@/lib/kanban-deletion";

jest.mock("@/lib/auth-client", () => ({
  AUTH_TOKEN_STORAGE_KEY: "orquestria-auth-token",
  getAuthToken: jest.fn(),
  restoreAuthSession: jest.fn()
}));
jest.mock("@/lib/kanban-deletion", () => ({
  ...jest.requireActual("@/lib/kanban-deletion"),
  apiRequest: jest.fn()
}));

const token = getAuthToken as jest.MockedFunction<typeof getAuthToken>;
const restore = restoreAuthSession as jest.MockedFunction<typeof restoreAuthSession>;
const request = apiRequest as jest.MockedFunction<typeof apiRequest>;
const user = { id: "user-teste", name: "Teste", email: "teste@example.org", accountType: "USER" as const };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL = "https://api.example.org";
  token.mockReturnValue("token-ficticio");
  restore.mockResolvedValue(user);
  request.mockResolvedValue([]);
});

describe("BoardDeletionActions", () => {
  it("exibe o atalho assim que identifica um token, sem aguardar /me", async () => {
    let respond!: (result: typeof user | null) => void;
    restore.mockImplementation(() => new Promise(resolve => { respond = resolve; }));
    render(<BoardDeletionActions />);
    expect(await screen.findByRole("button", { name: "Gerenciar exclusões do Kanban" })).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    await act(async () => { respond(user); });
  });

  it("permite nova validação ao clicar se a API falhou durante a montagem", async () => {
    restore.mockRejectedValueOnce(new Error("API temporariamente indisponível"));
    render(<BoardDeletionActions />);
    const btn = await screen.findByRole("button", { name: "Gerenciar exclusões do Kanban" });
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
    await userEvent.click(btn);
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("dialog", { name: "Excluir itens do Kanban" })).toBeInTheDocument();
  });

  it("não exibe o atalho sem token", async () => {
    token.mockReturnValue(null);
    render(<BoardDeletionActions />);
    await waitFor(() => expect(restore).not.toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Gerenciar exclusões do Kanban" })).not.toBeInTheDocument();
  });
});
