import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { CompactSearch } from "./CompactSearch";

function Example() {
  const [query, setQuery] = useState("");
  return <CompactSearch value={query} onChange={setQuery} />;
}

describe("pesquisa compacta para tablets", () => {
  it("mantém a pesquisa recolhida até ser solicitada", () => {
    render(<Example />);
    expect(screen.getByRole("button", { name: "Abrir busca" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Pesquisar tarefas, tags ou responsáveis" })).toHaveFocus();
  });

  it("abre uma faixa no fluxo do cabeçalho em vez de um painel flutuante", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    const field = screen.getByRole("search");
    expect(field).toHaveClass("order-last", "w-full", "basis-full");
    expect(field).not.toHaveClass("absolute");
  });

  it("permite pesquisar e fechar com Escape, retornando o foco ao botão", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    const input = screen.getByRole("textbox", { name: "Pesquisar tarefas, tags ou responsáveis" });
    fireEvent.change(input, { target: { value: "Planejamento" } });
    expect(input).toHaveValue("Planejamento");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir busca" })).toHaveFocus();
  });

  it("fecha ao clicar fora sem apagar o texto pesquisado", () => {
    render(<div><Example /><button type="button">Fora</button></div>);
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar tarefas, tags ou responsáveis" }), { target: { value: "API" } });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    expect(screen.getByRole("textbox", { name: "Pesquisar tarefas, tags ou responsáveis" })).toHaveValue("API");
  });
});
