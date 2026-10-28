/** Regressão: o 401 de uma única operação não deve derrubar um login ainda válido. */
import { clearAuthToken, getAuthToken, saveAuthToken } from "@/lib/auth-client";

const originalFetch = globalThis.fetch;
const originalHeaders = globalThis.Headers;

// Jest/jsdom não disponibiliza necessariamente a implementação nativa de Headers.
class TestHeaders {
  private readonly values = new Map<string, string>();
  constructor(initial?: HeadersInit) {
    if (initial && !Array.isArray(initial)) {
      for (const [name, value] of Object.entries(initial as Record<string, string>)) this.set(name, value);
    }
  }
  set(name: string, value: string) { this.values.set(name.toLowerCase(), value); }
  get(name: string) { return this.values.get(name.toLowerCase()) ?? null; }
}
const previousApiUrl = process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL;
const duplicatePath = "/api/projects/project-id/tasks/task-id/duplicate";

function mockResponse(status: number, requestId?: string): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => name === "X-Request-ID" ? requestId || null : "application/json" },
    json: async () => ({ id: "copied-task", projectId: "project-id" })
  } as Response;
}

beforeEach(() => {
  jest.resetModules();
  process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL = "https://api.example.test";
  window.localStorage.clear();
  window.sessionStorage.clear();
  globalThis.fetch = jest.fn() as typeof fetch;
  globalThis.Headers = TestHeaders as unknown as typeof Headers;
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.Headers = originalHeaders;
  if (previousApiUrl === undefined) delete process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL;
  else process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL = previousApiUrl;
  jest.restoreAllMocks();
});

async function duplicate() {
  // A URL da API é resolvida no carregamento do módulo.
  const { postApi } = require("./remote-board") as typeof import("./remote-board");
  return postApi<{id: string}>(duplicatePath, {});
}

describe("401 na duplicação remota", () => {
  it("preserva o login quando /me aceita o mesmo Bearer e não reenvia o POST", async () => {
    saveAuthToken("token-valido");
    const expired = jest.fn();
    window.addEventListener("orquestria:auth-expired", expired);
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(mockResponse(401, "rid-dup"))
      .mockResolvedValueOnce(mockResponse(200));

    await expect(duplicate()).rejects.toMatchObject({ status: 401,
      message: expect.stringContaining("sessão continua válida") });
    expect(getAuthToken()).toBe("token-valido");
    expect(expired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/duplicate");
    expect(fetchMock.mock.calls[0][1]?.headers).toBeInstanceOf(Headers);
    expect((fetchMock.mock.calls[0][1]?.headers as Headers).get("Authorization")).toBe("Bearer token-valido");
    expect(fetchMock.mock.calls[1][0]).toContain("/api/auth/me");
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual({ Authorization: "Bearer token-valido" });
    expect(console.warn).toHaveBeenCalledWith("[Orquestria][auth] Operação recusada",
      expect.objectContaining({ operacao: "duplicar_tarefa", status: 401, sessao: "valid", requestId: "rid-dup" }));
    window.removeEventListener("orquestria:auth-expired", expired);
  });

  it("faz logout somente se /me também rejeitar o token", async () => {
    saveAuthToken("token-expirado");
    const expired = jest.fn();
    window.addEventListener("orquestria:auth-expired", expired);
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(mockResponse(401)).mockResolvedValueOnce(mockResponse(401));

    await expect(duplicate()).rejects.toThrow("A sessão expirou");
    expect(getAuthToken()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    window.removeEventListener("orquestria:auth-expired", expired);
  });

  it("mantém o token quando a consulta de sessão falha por rede", async () => {
    saveAuthToken("token-pendente");
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(mockResponse(401)).mockRejectedValueOnce(new Error("offline"));

    await expect(duplicate()).rejects.toThrow("sessão foi preservada");
    expect(getAuthToken()).toBe("token-pendente");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("não derruba o login mais recente após resposta tardia do /me antigo", async () => {
    saveAuthToken("token-antigo");
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    let completeCheck: (response: Response) => void = () => {};
    fetchMock.mockResolvedValueOnce(mockResponse(401)).mockImplementationOnce(
      () => new Promise<Response>(resolve => { completeCheck = resolve; })
    );

    const pending = duplicate();
    // Uma microtarefa para a requisição 401 avançar até o GET /me.
    await Promise.resolve();
    saveAuthToken("token-novo");
    completeCheck(mockResponse(401));
    await expect(pending).rejects.toThrow("A sessão expirou");
    expect(getAuthToken()).toBe("token-novo");
  });

  it("uma resposta 201 retorna a cópia sem consultar /me", async () => {
    saveAuthToken("token-valido");
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValueOnce(mockResponse(201));

    await expect(duplicate()).resolves.toMatchObject({ id: "copied-task" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe("token-valido");
  });
});
