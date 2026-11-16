/**
 * Cold start do Blitz via Netlify Functions (server-to-server).
 * O navegador consulta apenas /api/orquestria-readiness na própria origem:
 * sem CORS, sem expor tokens e sem confundir o HTML de wake-up com Spring UP.
 */
const DEFAULT_API_BASE = "https://orquestria-api.fidelmrodriguez.blitz.cloud";
const TIMEOUT_MS = 8000;

export async function checkReadiness(fetcher = fetch, apiBase = process.env.ORQUESTRIA_API_URL || DEFAULT_API_BASE) {
  const base = apiBase.trim().replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+$/i.test(base)) return false;

  try {
    const response = await fetcher(`${base}/actuator/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (response.status !== 200 || !response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return false;
    }
    const payload = await response.json();
    return payload !== null && typeof payload === "object" && payload.status === "UP";
  } catch {
    // Backend dormindo, rede indisponível ou timeout: a UI tentará de novo.
    return false;
  }
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ status: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", Allow: "GET" }
    });
  }

  const ready = await checkReadiness();
  return new Response(JSON.stringify({ status: ready ? "UP" : "STARTING" }), {
    status: ready ? 200 : 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0" }
  });
}
