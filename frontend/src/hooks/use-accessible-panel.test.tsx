import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useAccessiblePanel } from "./use-accessible-panel";

function ExampleDialog() {
  const [open, setOpen] = useState(false);
  const { panelRef, onKeyDown } = useAccessiblePanel<HTMLDivElement>(open, () => setOpen(false));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Abrir painel</button>
      {open && (
        <div ref={panelRef} role="dialog" aria-label="Painel de teste" tabIndex={-1} onKeyDown={onKeyDown}>
          <button type="button">Primeiro</button>
          <button type="button">Último</button>
        </div>
      )}
    </>
  );
}

describe("painéis acessíveis", () => {
  it("recebe foco e devolve ao botão de abertura após Escape", async () => {
    const user = userEvent.setup();
    render(<ExampleDialog />);
    const opener = screen.getByRole("button", { name: "Abrir painel" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Painel de teste" });
    expect(dialog).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("mantém Tab e Shift+Tab dentro do diálogo", async () => {
    const user = userEvent.setup();
    render(<ExampleDialog />);
    await user.click(screen.getByRole("button", { name: "Abrir painel" }));
    const first = screen.getByRole("button", { name: "Primeiro" });
    const last = screen.getByRole("button", { name: "Último" });
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });
});
