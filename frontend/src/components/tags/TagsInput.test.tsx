import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TagsInput from "./TagsInput";

describe("campo de tags", () => {
  it("adiciona tag pelo botão Adicionar", async () => {
    const onChange = jest.fn();
    render(<TagsInput value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Produto" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar tag" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["Produto"]));
  });
  it("continua aceitando Enter", async () => {
    const onChange = jest.fn();
    render(<TagsInput value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Design" } });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["Design"]));
  });
  it("desabilita Adicionar quando não há texto", () => {
    render(<TagsInput value={[]} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Adicionar tag" })).toBeDisabled();
  });
});
