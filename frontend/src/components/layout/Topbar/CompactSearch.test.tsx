import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { CompactSearch } from "./CompactSearch";
import type { Workspace } from "@/types/board";

const workspace = {
  members: [
    { id: "user-1", name: "João" },
    { id: "user-2", name: "Maria" }
  ],
  projects: [{
    id: "proj",
    members: [
      { id: "user-1", name: "João" },
      { id: "user-2", name: "Maria" }
    ]
  }]
} as Workspace;

function Example() {
  const [query, setQuery] = useState("");
  return (
    <CompactSearch
      value={query}
      onChange={setQuery}
      workspace={workspace}
      projectId="proj"
      priorityFilter="todas"
      assigneeFilter="todos"
      onPriorityChange={jest.fn()}
      onAssigneeChange={jest.fn()}
    />
  );
}

describe("pesquisa compacta até 1919px", () => {
  it("mantém a pesquisa recolhida até ser solicitada", () => {
    render(<Example />);
    expect(screen.getByRole("button", { name: "Abrir busca" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveFocus();
  });

  it("expande a busca no fluxo do topbar até 1919px, com filtros desde 768px", () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Abrir busca" });
    expect(trigger).toHaveClass("min-[1920px]:hidden");
    fireEvent.click(trigger);
    const panel = screen.getByRole("search", { name: "Pesquisar tarefas" });
    expect(panel).toHaveClass("order-last", "w-full", "basis-full", "min-[1920px]:hidden");
    expect(panel).not.toHaveClass("absolute", "max-w-[740px]");
    expect(screen.getByRole("textbox", { name: "Buscar" })).toBeInTheDocument();
    const filters = screen.getByRole("combobox", { name: "Filtrar por prioridade" }).parentElement?.parentElement?.parentElement;
    expect(filters).toHaveClass("hidden", "md:flex");
    expect(screen.getByRole("combobox", { name: "Filtrar por responsável" })).toBeInTheDocument();
  });

  it("fecha o dropdown ao passar para 1920px", () => {
    const previousWidth = window.innerWidth;
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    try {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1920 });
      fireEvent.resize(window);
      expect(screen.queryByRole("search")).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: previousWidth });
    }
  });

  it("permite pesquisar e fechar com Escape, retornando o foco ao botão", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    const input = screen.getByRole("textbox", { name: "Buscar" });
    fireEvent.change(input, { target: { value: "Planejamento" } });
    expect(input).toHaveValue("Planejamento");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir busca" })).toHaveFocus();
  });

  it("fecha ao clicar fora sem apagar o texto pesquisado", () => {
    render(<div><Example /><button type="button">Fora</button></div>);
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar" }), { target: { value: "API" } });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir busca" }));
    expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveValue("API");
  });
});
