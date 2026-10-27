import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useAccessiblePanel } from "./use-accessible-panel";

function ExampleDialog({ strict = false }: { strict?: boolean }) {
  const [open, setOpen] = useState(false);
  const { panelRef, onKeyDown } = useAccessiblePanel<HTMLDivElement>(open, () => setOpen(false), undefined, !strict);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Abrir painel</button>
      {open && (
        <>
        <div data-testid="dialog-backdrop" onMouseDown={() => { /* Intencionalmente bloqueante. */ }} />
        <div ref={panelRef} role="dialog" aria-label="Painel de teste" tabIndex={-1} onKeyDown={onKeyDown}>
          <button type="button">Primeiro</button>
          <button type="button">Último</button>
          {strict && <button type="button" onClick={() => setOpen(false)}>Fechar painel</button>}
        </div>
        </>
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
  it("não fecha o painel bloqueante ao clicar no fundo ou pressionar Escape; apenas no X", async () => {
    const user = userEvent.setup();
    render(<ExampleDialog strict />);
    await user.click(screen.getByRole("button", { name: "Abrir painel" }));
    const panel = screen.getByRole("dialog", { name: "Painel de teste" });
    fireEvent.mouseDown(screen.getByTestId("dialog-backdrop"));
    expect(panel).toBeInTheDocument();
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(panel).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar painel" }));
    expect(screen.queryByRole("dialog", { name: "Painel de teste" })).not.toBeInTheDocument();
  });
});
