import { NextResponse } from "next/server";
import { probeApiReadiness } from "@/lib/api-readiness";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * Endpoint de prontidão do frontend: sem autenticação e sem expor
 * informações pessoais. A chamada é feita pelo servidor Next.js para
 * não depender do CORS do Blitz nem interpretar o HTML de wake-up como UP.
 */
export async function GET() {
  const apiBase = (
    process.env.ORQUESTRIA_API_URL ||
    process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL ||
    "https://orquestria-api.fidelmrodriguez.blitz.cloud"
  ).trim();

  const result = await probeApiReadiness(apiBase);
  return NextResponse.json(
    { status: result.ready ? "ready" : "waking" },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache"
      }
    }
  );
}
