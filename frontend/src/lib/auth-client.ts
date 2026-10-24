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
  const response = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), cache: "no-store"
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(body.detail || (response.status === 401 ? "Usuário ou senha inválidos." : `Falha no cadastro ou login (${response.status}).`));
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
