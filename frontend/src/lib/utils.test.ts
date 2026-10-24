import { formatDate } from "./utils";

describe("formatDate", () => {
  it("exibe um valor alternativo para prazos não informados", () => {
    expect(formatDate("", "Sem prazo")).toBe("Sem prazo");
    expect(formatDate(null, "Sem prazo")).toBe("Sem prazo");
    expect(formatDate(undefined, "Sem prazo")).toBe("Sem prazo");
  });

  it("não quebra a interface ao receber uma data inválida", () => {
    expect(formatDate("não-é-uma-data")).toBe("—");
    expect(formatDate("2026-99-99", "Sem prazo")).toBe("Sem prazo");
  });

  it("continua formatando datas válidas em português", () => {
    const result = formatDate("2026-10-24T12:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("24");
  });
});
