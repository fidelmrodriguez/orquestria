import { render, screen } from "@testing-library/react";
import ApiReadinessGate from "./ApiReadinessGate";

describe("aviso de inicialização da API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Simula uma API ainda em repouso, sem depender de rede nem avançar timers.
    global.fetch = jest.fn(() => new Promise<Response>(() => {})) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("mantém as informações essenciais em formato compacto no celular", () => {
    render(<ApiReadinessGate><p>Aplicação carregada</p></ApiReadinessGate>);
    const panel = screen.getByRole("region", { name: "Inicialização do Orquestria" });
    expect(panel).toHaveClass("px-5", "py-6", "sm:py-12");
    expect(screen.getByRole("heading", { name: "Preparando seu ambiente" })).toHaveClass("text-xl", "sm:text-3xl");
    expect(screen.getByText("Conectando à API Java e ao PostgreSQL.")).toHaveClass("sm:hidden");
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByText(/o primeiro acesso pode levar até cerca de 3 minutos/i)).toBeInTheDocument();
    expect(screen.queryByText("Aplicação carregada")).not.toBeInTheDocument();
  });
});
