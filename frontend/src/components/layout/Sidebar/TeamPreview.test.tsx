import { render, screen } from "@testing-library/react";
import { TeamPreview } from "./TeamPreview";
import type { Workspace } from "@/types/board";

const owner = { id: "owner", name: "Proprietária", email: "", avatar: "", role: "admin" as const };
const collaborator = { id: "user-2", name: "Convidada", email: "", avatar: "", role: "membro-admin" as const };
const workspace: Workspace = {
  id: "ws", name: "Desenvolvimento", description: "", members: [owner, collaborator],
  columns: [], tasks: [], projects: [
    { id: "first", workspaceId: "ws", name: "Primeiro", description: "", visibility: "equipe", createdAt: "", members: [owner, collaborator] },
    { id: "second", workspaceId: "ws", name: "Segundo", description: "", visibility: "equipe", createdAt: "", members: [owner] }
  ]
};

describe("resumo de participantes da sidebar", () => {
  it("mostra os participantes apenas do projeto ativo", () => {
    const { rerender } = render(<TeamPreview workspace={workspace} projectId="first" />);
    expect(screen.getByText(/2 pessoas disponíveis/)).toBeInTheDocument();
    expect(screen.getByLabelText("Convidada")).toBeInTheDocument();
    expect(screen.getByLabelText("Convidada")).toHaveAttribute("title", "Convidada");
    expect(screen.getByLabelText("Convidada")).toHaveClass("select-none");
    rerender(<TeamPreview workspace={workspace} projectId="second" />);
    expect(screen.getByText(/1 pessoa disponível/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Convidada")).not.toBeInTheDocument();
  });
});
