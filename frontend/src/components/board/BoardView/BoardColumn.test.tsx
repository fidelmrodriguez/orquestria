import { fireEvent, render, screen } from "@testing-library/react";
import { BoardColumn } from "./BoardColumn";
import type { Column } from "@/types/board";

jest.mock("@/components/board/QuickDeleteAction", () => ({
  __esModule: true,
  default: ({ label }: {label: string}) => <button type="button" aria-label={label}>Excluir</button>
}));

const column: Column = { id: "col-1", projectId: "prj-1", title: "Planejado", color: "bg-blue-500", order: 0 };

describe("edição do cabeçalho da coluna", () => {
  it("esconde contagem, criação e exclusão enquanto edita e restaura após salvar", () => {
    const rename = jest.fn();
    render(<BoardColumn column={column} tasks={[]} totalTaskCount={0} members={[]}
      dragging={false} dropTarget={false} onNewTask={jest.fn()} onRenameColumn={rename}
      onPrepareDrag={jest.fn()} />);
    expect(screen.getByRole("button", {name: "Criar tarefa na coluna Planejado"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Excluir coluna Planejado"})).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: "Editar nome da coluna"}));
    expect(screen.queryByRole("button", {name: "Criar tarefa na coluna Planejado"})).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {name: "Excluir coluna Planejado"})).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", {name: "Editar nome da coluna"}), {target:{value:"Em andamento"}});
    fireEvent.click(screen.getByRole("button", {name:"Salvar"}));
    expect(rename).toHaveBeenCalledWith("col-1", "Em andamento");
    expect(screen.getByRole("button", {name: "Criar tarefa na coluna Planejado"})).toBeInTheDocument();
  });
});

describe("exibição responsiva de colunas", () => {
  it("oculta colunas inativas somente no mobile, preservando todas no desktop", () => {
    const { container } = render(<BoardColumn column={column} tasks={[]} totalTaskCount={0} members={[]}
      dragging={false} dropTarget={false} onNewTask={jest.fn()} onRenameColumn={jest.fn()}
      onPrepareDrag={jest.fn()} mobileActive={false} />);
    const element = container.querySelector('[data-kanban-column-id="col-1"]');
    expect(element).toHaveClass("hidden", "lg:flex");
  });
});
