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

  it("usa o tema global em todos os elementos do estado de espera", () => {
    document.documentElement.classList.add("dark");
    try {
      const { container } = render(<ApiReadinessGate><p>Aplicação carregada</p></ApiReadinessGate>);
      const main = container.querySelector("main");
      const panel = screen.getByRole("region", { name: "Inicialização do Orquestria" });
      expect(main).toHaveClass("dark:bg-slate-950", "dark:bg-none", "dark:text-slate-100");
      expect(panel).toHaveClass("dark:border-slate-700", "dark:bg-slate-900/95");
      expect(screen.getByRole("timer")).toHaveClass("dark:text-white");
      expect(screen.getByText(/o primeiro acesso pode levar até cerca de 3 minutos/i)).toHaveClass("dark:bg-slate-800", "dark:text-slate-200");
      expect(screen.getByText(/a conexão é verificada automaticamente/i)).toHaveClass("dark:text-slate-400");
    } finally {
      document.documentElement.classList.remove("dark");
    }
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
