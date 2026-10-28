import { ApiRequestError, isMissingCollaborationEndpoint } from "./remote-board";

describe("Compatibilidade da API de colaboração", () => {
  it("reconhece o endpoint antigo que interpreta invited como UUID", () => {
    expect(isMissingCollaborationEndpoint(new ApiRequestError(400, "Parâmetro inválido."))).toBe(true);
  });

  it("aceita 404 quando uma rota nova ainda não foi publicada", () => {
    expect(isMissingCollaborationEndpoint(new ApiRequestError(404, "Recurso não encontrado"))).toBe(true);
  });

  it("não ignora erros de autorização e autenticação", () => {
    expect(isMissingCollaborationEndpoint(new ApiRequestError(401, "Sessão expirada"))).toBe(false);
    expect(isMissingCollaborationEndpoint(new ApiRequestError(403, "Acesso negado"))).toBe(false);
  });

  it("não mascara falhas no banco, servidor ou argumentos inválidos da nova API", () => {
    expect(isMissingCollaborationEndpoint(new ApiRequestError(500, "Falha inesperada"))).toBe(false);
    expect(isMissingCollaborationEndpoint(new ApiRequestError(400, "Entrada não permitida"))).toBe(false);
    expect(isMissingCollaborationEndpoint(new Error("Falha de rede"))).toBe(false);
  });
});
