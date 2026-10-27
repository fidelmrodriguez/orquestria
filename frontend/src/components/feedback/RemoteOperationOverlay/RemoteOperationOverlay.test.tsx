import { render, screen } from "@testing-library/react";
import { RemoteOperationOverlay } from "./RemoteOperationOverlay";

describe("bloqueio de operações remotas", () => {
  it("ativa proteção contra selects nativos e mantém o modal acessível", () => {
    const { rerender, unmount } = render(<RemoteOperationOverlay open label="Salvando tarefa..." />);
    expect(screen.getByRole("dialog", {name:"Salvando tarefa..."})).toHaveAttribute("aria-modal", "true");
    expect(document.body).toHaveClass("orquestria-remote-pending");
    rerender(<RemoteOperationOverlay open={false} label="Salvando tarefa..." />);
    expect(document.body).not.toHaveClass("orquestria-remote-pending");
    unmount();
  });
});
