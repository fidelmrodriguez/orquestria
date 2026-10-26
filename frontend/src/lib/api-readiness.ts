/**
 * Verificação anônima feita no servidor Next.js, não no navegador.
 * O Blitz pode responder uma página HTML "waking up" com HTTP 200;
 * só consideramos pronto um health UP do Spring ou um 401/403 do
 * endpoint de autenticação do próprio Java.
 */
export type ReadinessResult = { ready: boolean; source: "health" | "auth" | "unavailable" };

async function getWithTimeout(url: string, fetcher: typeof fetch, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function probeApiReadiness(
  apiBase: string,
  fetcher: typeof fetch = fetch,
  timeoutMs = 7000
): Promise<ReadinessResult> {
  const base = apiBase.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return { ready: false, source: "unavailable" };

  let fallbackToAuth = false;
  try {
    const response = await getWithTimeout(`${base}/actuator/health`, fetcher, timeoutMs);
    if (response.status === 200) {
      // Uma página HTML do Blitz durante o cold start NÃO é health UP.
      const type = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!type.includes("json")) return { ready: false, source: "health" };
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "status" in body &&
          (body as { status?: unknown }).status === "UP") {
        return { ready: true, source: "health" };
      }
      // DOWN, OUT_OF_SERVICE e UNKNOWN: nunca liberar a aplicação.
      return { ready: false, source: "health" };
    }
    // Algumas configurações Spring Security protegem o actuator.
    fallbackToAuth = [401, 403, 404, 405].includes(response.status);
  } catch {
    // Timeout, sleep e falha de rede: aguardar antes de tentar outra vez.
    return { ready: false, source: "unavailable" };
  }

  if (!fallbackToAuth) return { ready: false, source: "health" };

  try {
    // Sem credenciais: quando o Java está pronto, /me deve negar a
    // requisição com 401/403. Isso prova que o Spring respondeu, sem
    // enviar senha nem token do visitante ao servidor de verificação.
    const response = await getWithTimeout(`${base}/api/auth/me`, fetcher, timeoutMs);
    if (response.status === 401 || response.status === 403) {
      return { ready: true, source: "auth" };
    }
    return { ready: false, source: "auth" };
  } catch {
    return { ready: false, source: "unavailable" };
  }
}
