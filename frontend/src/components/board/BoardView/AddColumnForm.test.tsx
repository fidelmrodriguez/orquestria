import { fireEvent, render, screen } from "@testing-library/react";
import { AddColumnForm } from "./AddColumnForm";

describe("criação de colunas pelo controle compacto da barra superior", () => {
  it("abre formulário sem deslocar a barra e envia nome e projeto", () => {
    const add = jest.fn();
    render(<AddColumnForm projectId="project-1" onAddColumn={add} />);
    fireEvent.click(screen.getByRole("button", { name: /adicionar coluna ao projeto/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /nome da nova coluna/i }), { target: { value: "  Revisão técnica " } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(add).toHaveBeenCalledWith("project-1", "Revisão técnica");
    expect(screen.getByRole("button", { name: /adicionar coluna ao projeto/i })).toBeInTheDocument();
  });
});


it("exibe formulário mobile no fluxo do layout, sem posicionamento absoluto", () => {
  const add = jest.fn();
  const { container } = render(<div className="grid grid-cols-2"><AddColumnForm mobile projectId="p1" onAddColumn={add} /><button>Nova tarefa</button></div>);
  fireEvent.click(screen.getByRole("button", { name: "Adicionar coluna ao projeto" }));
  const form = container.querySelector("#orquestria-mobile-new-column-form");
  expect(form).toHaveClass("col-span-2", "order-last");
  expect(form).not.toHaveClass("absolute");
  fireEvent.change(screen.getByRole("textbox", { name: "Nome da nova coluna" }), { target: { value: "  Ideias  " } });
  fireEvent.click(screen.getByRole("button", { name: "Criar" }));
  expect(add).toHaveBeenCalledWith("p1", "Ideias");
});
