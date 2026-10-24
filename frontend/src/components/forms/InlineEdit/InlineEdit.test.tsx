import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineEdit } from "@/components/forms/InlineEdit/InlineEdit";

describe("InlineEdit", () => {
  it("salva o valor editado ao pressionar Enter", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    render(<InlineEdit value="Projeto inicial" onSave={onSave} ariaLabel="Editar projeto" />);

    await user.click(screen.getByRole("button", { name: "Editar projeto" }));
    const input = screen.getByRole("textbox", { name: "Editar projeto" });
    await user.clear(input);
    await user.type(input, "Projeto comercial{enter}");

    expect(onSave).toHaveBeenCalledWith("Projeto comercial");
  });

  it("cancela a edição ao pressionar Escape", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    render(<InlineEdit value="Backlog" onSave={onSave} ariaLabel="Editar coluna" />);

    await user.click(screen.getByRole("button", { name: "Editar coluna" }));
    const input = screen.getByRole("textbox", { name: "Editar coluna" });
    await user.clear(input);
    await user.type(input, "Nova coluna{escape}");

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Backlog")).toBeInTheDocument();
  });
});
