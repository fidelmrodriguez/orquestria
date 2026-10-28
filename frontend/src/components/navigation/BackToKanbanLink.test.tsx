import { render, screen } from "@testing-library/react";
import { BackToKanbanLink } from "./BackToKanbanLink";

describe("Voltar ao Kanban", () => {
  it("mantém o estilo de botão, foco acessível e cores para os dois temas", () => {
    render(<BackToKanbanLink />);
    const link = screen.getByRole("link", { name: "Voltar ao Kanban" });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveClass("inline-flex", "rounded-xl", "dark:bg-slate-900", "dark:text-slate-100");
    expect(link).toHaveClass("focus-visible:ring-2");
  });
});
