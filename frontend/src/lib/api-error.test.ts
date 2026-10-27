import { readableApiError } from "@/lib/api-error";

describe("respostas seguras da API", () => {
  it("não expõe HTML devolvido pelo provedor durante o despertar", () => {
    expect(readableApiError(503, "text/html", "<html>API is waking up</html>"))
      .toBe("Servidor temporariamente indisponível. Aguarde e tente novamente.");
  });
  it("mantém erros de validação úteis e curtos", () => {
    expect(readableApiError(409, "application/problem+json", JSON.stringify({ detail: "Coluna possui tarefas" })))
      .toBe("Coluna possui tarefas");
  });
  it("não exibe detalhes de erro contendo marcação", () => {
    expect(readableApiError(400, "application/json", JSON.stringify({ detail: "<script>abc</script>" })))
      .toBe("Não foi possível concluir a operação (HTTP 400).");
  });
  it("informa falta de permissão e recurso inexistente", () => {
    expect(readableApiError(403, null, "")).toContain("permissão");
    expect(readableApiError(404, null, "")).toContain("recurso");
  });
});
