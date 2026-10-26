import { addTag, normalizeTag, removeTag, renameTag } from "./tags-utils";

describe("Tags: chips e identidade dos nomes", () => {
  it("normaliza espaços e respeita o limite de 32 caracteres", () => {
    expect(normalizeTag("  alta   prioridade  ")).toBe("alta prioridade");
    expect(normalizeTag("x".repeat(50))).toHaveLength(32);
  });
  it("não cria duplicata mesmo usando maiúsculas e minúsculas diferentes", () => {
    expect(addTag(["Urgente"], "URGENTE")).toEqual(["Urgente"]);
    expect(addTag(["Urgente"], "Sprint")).toEqual(["Urgente", "Sprint"]);
  });
  it("permite editar e remover sem afetar as demais tags", () => {
    expect(renameTag(["Urgente", "Sprint"], 1, "Planejamento")).toEqual(["Urgente", "Planejamento"]);
    expect(renameTag(["Urgente", "Sprint"], 1, "urgente")).toEqual(["Urgente", "Sprint"]);
    expect(removeTag(["Urgente", "Sprint"], 0)).toEqual(["Sprint"]);
  });
});

// A vírgula separa tags no armazenamento legado; nunca faz parte do nome.
test("substitui vírgulas por espaços para preservar o catálogo", () => {
  expect(normalizeTag("API, Java")).toBe("API Java");
});
