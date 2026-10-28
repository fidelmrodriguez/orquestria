import {
  AUTH_TOKEN_STORAGE_KEY, getAuthToken, saveAuthToken, clearAuthToken,
  restoreAuthSession, revokeSession, clearAuthTokenIfCurrent
} from "@/lib/auth-client";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  globalThis.fetch = jest.fn() as typeof fetch;
  process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL = "https://example.test";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("persistência da sessão entre abas", () => {
  it("salva token no armazenamento compartilhado da origem", () => {
    saveAuthToken("token-123");
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("token-123");
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getAuthToken()).toBe("token-123");
  });

  it("avisa o painel do Kanban quando o login ou logout muda na mesma aba", () => {
    const listener = jest.fn();
    window.addEventListener("orquestria:auth-changed", listener);
    try {
      saveAuthToken("token-compartilhado");
      clearAuthToken();
      expect(listener).toHaveBeenCalledTimes(2);
    } finally {
      window.removeEventListener("orquestria:auth-changed", listener);
    }
  });

  it("não apaga sessão mais nova ao receber resposta antiga", () => {
    saveAuthToken("token-novo");
    expect(clearAuthTokenIfCurrent("token-antigo")).toBe(false);
    expect(getAuthToken()).toBe("token-novo");
    expect(clearAuthTokenIfCurrent("token-novo")).toBe(true);
    expect(getAuthToken()).toBeNull();
  });

  it("migra sem perda tokens antigos do sessionStorage", () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "token-legado");
    expect(getAuthToken()).toBe("token-legado");
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("token-legado");
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("invalida token em armazenamento antigo e novo", () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "antigo");
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "novo");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it("busca o perfil real em /me com bearer, sem acessar a senha", async () => {
    saveAuthToken("token-123");
    const spy = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    spy.mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ id: "uuid", name: "Teste", email: "t@exemplo.com", accountType: "USER" })
    } as Response);
    await expect(restoreAuthSession()).resolves.toMatchObject({ id: "uuid", name: "Teste" });
    const request = spy.mock.calls[0];
    expect(request[0]).toContain("/api/auth/me");
    expect(request[1]?.headers).toEqual({ Authorization: "Bearer token-123" });
  });

  it("limpa token ao receber 401 sem tentar autenticar com outra conta", async () => {
    saveAuthToken("expirado");
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(restoreAuthSession()).resolves.toBeNull();
    expect(getAuthToken()).toBeNull();
  });

  it("não remove token de login novo durante restauração antiga", async () => {
    saveAuthToken("token-antigo");
    let respond: (response: Response) => void = () => {};
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
      () => new Promise<Response>(resolve => { respond = resolve; })
    );
    const pending = restoreAuthSession();
    saveAuthToken("token-novo");
    respond({ ok: false, status: 401 } as Response);
    await expect(pending).resolves.toBeNull();
    expect(getAuthToken()).toBe("token-novo");
  });

  it("preserva token em falha temporária da API para permitir retentativa", async () => {
    saveAuthToken("token-123");
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error("offline"));
    await expect(restoreAuthSession()).rejects.toThrow("Não foi possível verificar");
    expect(getAuthToken()).toBe("token-123");
  });

  it("logout revoga a sessão e remove tokens locais", async () => {
    saveAuthToken("token-123");
    const spy = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    spy.mockResolvedValue({ ok: true } as Response);
    await revokeSession();
    expect(getAuthToken()).toBeNull();
    expect(spy.mock.calls[0][0]).toContain("/api/auth/logout");
  });
});
