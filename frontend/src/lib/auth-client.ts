export const GUEST_IDENTIFIER = "guest";
export const GUEST_PASSWORD = "OrquestriaDemo2026!";
const TOKEN_KEY = "orquestria-auth-token";
const apiUrl = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");
export type AuthResult = {
  token: string;
  id: string;
  name: string;
  email: string;
  accountType: "GUEST" | "USER";
  expiresAt: string;
};
export function getAuthToken() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
}
export function saveAuthToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearAuthToken() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
}
export async function authenticate(endpoint: "login" | "register", payload: object): Promise<AuthResult> {
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
      throw new Error("E-mail ou senha incorretos. Use o e-mail informado no cadastro.");
    }
    if (endpoint === "register" && response.status === 409) {
      throw new Error("Este e-mail já está cadastrado. Se a conta é sua, selecione 'Já tenho uma conta'.");
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
  clearAuthToken();
  if (!token || !apiUrl) return;
  try {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, keepalive: true
    });
  } catch { /* Logout local é mantido se a rede falhar. */ }
}
