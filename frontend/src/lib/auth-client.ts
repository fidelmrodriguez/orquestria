export const GUEST_IDENTIFIER = "guest";
export const GUEST_PASSWORD = "OrquestriaDemo2026!";
export const AUTH_TOKEN_STORAGE_KEY = "orquestria-auth-token";
const getApiUrl = () => (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");
export type AuthResult = {
  token: string;
  id: string;
  name: string;
  email: string;
  accountType: "GUEST" | "USER";
  expiresAt: string;
};
/**
 * Compartilha a sessão entre abas da mesma origem. Migra tokens gravados antes
 * desta correção no sessionStorage sem pedir novo login ao usuário.
 * Nunca armazena e-mail, senha ou perfil: somente o token já emitido pela API.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (current) return current;
  } catch { /* Pode estar bloqueado pela configuração do navegador. */ }

  try {
    const oldToken = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!oldToken) return null;
    try {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, oldToken);
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch { /* Mantém o token da aba atual quando o armazenamento compartilhado falhar. */ }
    return oldToken;
  } catch { return null; }
}

function emitAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("orquestria:auth-changed"));
}

export function saveAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  // localStorage permite F5, nova aba e navegação direta para /gerenciar.
  try {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    try { window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY); } catch { /* Sem impacto. */ }
  } catch {
    // Fallback somente para ambientes que desabilitam localStorage.
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
  emitAuthChanged();
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY); } catch { /* Sem impacto. */ }
  try { window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY); } catch { /* Sem impacto. */ }
  emitAuthChanged();
}

/** Não apagar um login novo por causa de um 401 de uma requisição antiga. */
export function clearAuthTokenIfCurrent(expectedToken: string): boolean {
  if (!expectedToken || getAuthToken() !== expectedToken) return false;
  clearAuthToken();
  return true;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  accountType: "GUEST" | "USER";
};

/**
 * Reidrata o estado do Zustand consultando a fonte de verdade: /api/auth/me.
 * Apenas um 401/403 invalida o token; falhas de rede não removem uma sessão válida.
 */
export async function restoreAuthSession(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("A API de autenticação não está configurada.");

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  } catch {
    throw new Error("Não foi possível verificar a sessão. Confira sua conexão e tente atualizar a página.");
  }

  console.info("[Orquestria][auth] Validação de sessão", { status: response.status, sucesso: response.ok });
  if (response.status === 401 || response.status === 403) {
    clearAuthTokenIfCurrent(token);
    return null;
  }
  if (!response.ok) {
    throw new Error(`Não foi possível verificar a sessão (HTTP ${response.status}).`);
  }

  const user = await response.json() as Partial<AuthUser>;
  if (typeof user.id !== "string" || typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      (user.accountType !== "GUEST" && user.accountType !== "USER")) {
    throw new Error("A API retornou dados inesperados durante a verificação de sessão.");
  }
  return { id: user.id, name: user.name, email: user.email, accountType: user.accountType };
}

export async function authenticate(endpoint: "login" | "register", payload: object): Promise<AuthResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    console.error("[Orquestria][auth] URL da API não configurada", { endpoint });
    throw new Error("A API de autenticação não está configurada.");
  }
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store"
    });
  } catch {
    console.error("[Orquestria][auth] Falha de rede", { endpoint });
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  // Diagnóstico sem dados pessoais: não registrar e-mail, nome, senha, token ou body.
  console.info("[Orquestria][auth] Resposta da API", {
    operacao: endpoint, status: response.status, sucesso: response.ok
  });
  if (!response.ok) {
    if (endpoint === "login" && response.status === 401) {
      throw new Error("Usuário, e-mail ou senha incorretos.");
    }
    if (endpoint === "register" && response.status === 409) {
      throw new Error("Este e-mail ou nome de usuário já está em uso. Escolha outro usuário ou entre na conta existente.");
    }
    if (response.status === 400) {
      throw new Error("Confira os dados informados e tente novamente.");
    }
    throw new Error(`Não foi possível ${endpoint === "login" ? "entrar" : "criar a conta"} (HTTP ${response.status}).`);
  }
  const result = await response.json() as AuthResult;
  saveAuthToken(result.token);
  return result;
}
export async function revokeSession() {
  const token = getAuthToken();
  const apiUrl = getApiUrl();
  clearAuthToken();
  if (!token || !apiUrl) return;
  try {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, keepalive: true
    });
  } catch { /* Logout local é mantido se a rede falhar. */ }
}
