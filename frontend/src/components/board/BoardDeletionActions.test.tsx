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
    expect(await screen.findByRole("button", { name: "Abrir gerenciamento de exclusões" })).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    await act(async () => { respond(user); });
  });

  it("permite nova validação ao clicar se a API falhou durante a montagem", async () => {
    restore.mockRejectedValueOnce(new Error("API temporariamente indisponível"));
    render(<BoardDeletionActions />);
    const btn = await screen.findByRole("button", { name: "Abrir gerenciamento de exclusões" });
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
    await userEvent.click(btn);
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Gerenciar exclusões do Kanban")).toBeInTheDocument();
  });

  it("mostra o workspace junto do projeto para diferenciar nomes repetidos", async () => {
    request
      .mockResolvedValueOnce([
        { id: "ws-1", name: "Marketing" },
        { id: "ws-2", name: "Operações" }
      ])
      .mockResolvedValueOnce([
        { id: "projeto-1", name: "Projeto inicial", workspaceId: "ws-1" },
        { id: "projeto-2", name: "Projeto inicial", workspaceId: "ws-2" }
      ]);

    render(<BoardDeletionActions />);
    const btn = await screen.findByRole("button", { name: "Abrir gerenciamento de exclusões" });
    await userEvent.click(btn);

    // O workspace aparece no filtro, no título do grupo e no contexto do projeto.
    // Portanto não esperamos uma única ocorrência do mesmo nome na tela.
    const duplicateProjects = await screen.findAllByText("Projeto inicial");
    expect(duplicateProjects).toHaveLength(2);
    const projectRows = duplicateProjects.map((element) => element.closest("li"));
    expect(projectRows.every((row) => row !== null)).toBe(true);
    // Valida as associações sem depender da ordem de exibição dos workspaces.
    const descriptions = projectRows.map((row) => row?.textContent ?? "");
    expect(descriptions).toEqual(expect.arrayContaining([
      expect.stringMatching(/Workspace:\s*Marketing/i),
      expect.stringMatching(/Workspace:\s*Operações/i)
    ]));
    expect(descriptions.every((description) => description.includes("nome repetido"))).toBe(true);
  });

  it("não exibe o atalho sem token", async () => {
    token.mockReturnValue(null);
    render(<BoardDeletionActions />);
    await waitFor(() => expect(restore).not.toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Abrir gerenciamento de exclusões" })).not.toBeInTheDocument();
  });
});
