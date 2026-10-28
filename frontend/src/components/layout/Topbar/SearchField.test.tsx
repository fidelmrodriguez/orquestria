import { render, screen } from "@testing-library/react";
import { SearchField } from "./SearchField";

describe("foco do campo de pesquisa", () => {
  it("usa a borda externa para o foco, sem desenhar contorno interno", () => {
    render(<SearchField value="" onChange={jest.fn()} placeholder="Pesquisar tarefas" />);
    const input = screen.getByRole("textbox", { name: "Pesquisar tarefas" });
    expect(input).toHaveClass("orquestria-inset-field");
    expect(input.parentElement).toHaveClass("focus-within:border-slate-400");
  });
});
