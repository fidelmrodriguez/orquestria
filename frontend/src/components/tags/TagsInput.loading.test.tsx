import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TagsInput from "./TagsInput";

describe("feedback ao adicionar tags", () => {
  it("mostra espera bloqueante até a confirmação de persistência", async () => {
    let resolveSave: (() => void) | undefined;
    const onChange = jest.fn(() => new Promise<void>(resolve => { resolveSave = resolve; }));
    render(<TagsInput value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Produto" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar tag" }));
    expect(screen.getByRole("status", { name: "Salvando tag" })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(["Produto"]);
    resolveSave?.();
    await waitFor(() => expect(screen.queryByRole("status", { name: "Salvando tag" })).not.toBeInTheDocument());
  });
});
