/** Mensagens seguras para erros HTTP: nunca mostrar HTML do host ou detalhes internos da API. */
export function readableApiError(status: number, contentType: string | null, body: string): string {
  if (status >= 500) return "Servidor temporariamente indisponível. Aguarde e tente novamente.";
  if (status === 429) return "Muitas solicitações em pouco tempo. Tente novamente em alguns instantes.";
  if (status === 403) return "Você não tem permissão para realizar esta operação.";
  if (status === 404) return "O recurso não existe ou não está disponível para sua conta.";

  if (contentType?.toLowerCase().includes("json") && [400, 409, 422].includes(status)) {
    try {
      const payload: unknown = JSON.parse(body);
      if (payload && typeof payload === "object" && "detail" in payload) {
        const detail = (payload as { detail?: unknown }).detail;
        if (typeof detail === "string" && detail.length > 0 && detail.length <= 180 &&
            !/[<>\r\n]/.test(detail)) return detail;
      }
    } catch { /* Resposta inválida: usar mensagem genérica. */ }
  }
  return `Não foi possível concluir a operação (HTTP ${status}).`;
}
