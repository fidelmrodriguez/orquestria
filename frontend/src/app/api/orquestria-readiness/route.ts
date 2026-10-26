/**
 * Compatibilidade com `output: "export"` do Next.js 14.
 *
 * Este handler gera SOMENTE uma resposta estática durante o build.
 * Em produção, a regra 200! em frontend/public/_redirects faz o
 * Netlify encaminhar /api/orquestria-readiness para o health real do Blitz.
 *
 * Não chamar APIs externas aqui: executar uma checagem durante o build
 * congelaria a resposta, além de quebrar a exportação estática.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json({ status: "unavailable" });
}
