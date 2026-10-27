import { fireEvent, render, screen } from "@testing-library/react";
import { AddColumnForm } from "./AddColumnForm";

describe("criação de colunas sem coluna fictícia", () => {
  it("abre o campo acima do quadro e envia nome e projeto", () => {
    const add = jest.fn();
    render(<AddColumnForm projectId="project-1" onAddColumn={add} />);
    fireEvent.click(screen.getByRole("button", { name: /adicionar coluna ao projeto/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /nome da nova coluna/i }), { target: { value: "  Revisão técnica " } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(add).toHaveBeenCalledWith("project-1", "Revisão técnica");
    expect(screen.getByRole("button", { name: /adicionar coluna ao projeto/i })).toBeInTheDocument();
  });
});
