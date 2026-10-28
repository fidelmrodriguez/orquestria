import { fireEvent, render, screen, within } from "@testing-library/react";
import { MobileTaskMove } from "./MobileTaskMove";
import type { Column, Task } from "@/types/board";

const task = { id: "t1", columnId: "c1", title: "Verificar integração" } as Task;
const columns = [
  { id: "c1", projectId: "p1", title: "Backlog", order: 0 },
  { id: "c2", projectId: "p1", title: "Planejado", order: 1 }
] as Column[];

describe("menu de movimentação mobile", () => {
  it("permite subir, descer e mudar de coluna sem arrastar", () => {
    const move = jest.fn();
    render(<MobileTaskMove task={task} columns={columns} canMoveUp canMoveDown onMove={move} />);
    const trigger = screen.getByRole("button", { name: "Mover tarefa Verificar integração" });

    fireEvent.click(trigger);
    const group = screen.getByRole("group", { name: "Movimentar Verificar integração" });
    fireEvent.click(within(group).getByRole("button", { name: "Descer uma posição" }));
    expect(move).toHaveBeenCalledWith(task, "c1", "down");
    expect(screen.queryByRole("group", { name: "Movimentar Verificar integração" })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Planejado" }));
    expect(move).toHaveBeenCalledWith(task, "c2", undefined);
  });

  it("respeita limites, bloqueio durante operação e fechamento por Escape", () => {
    const move = jest.fn();
    const { rerender } = render(<MobileTaskMove task={task} columns={columns} canMoveUp={false} canMoveDown onMove={move} />);
    const trigger = screen.getByRole("button", { name: "Mover tarefa Verificar integração" });
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Subir uma posição" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Movimentar Verificar integração" })).not.toBeInTheDocument();
    rerender(<MobileTaskMove task={task} columns={columns} canMoveUp canMoveDown disabled onMove={move} />);
    expect(trigger).toBeDisabled();
    expect(move).not.toHaveBeenCalled();
  });
});


it("monta o dropdown no body para não ser coberto por outros cards", () => {
  const { container } = render(<MobileTaskMove task={task} columns={columns} canMoveUp canMoveDown onMove={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Mover tarefa Verificar integração" }));
  const panel = screen.getByRole("group", { name: "Movimentar Verificar integração" });
  expect(panel.parentElement).toBe(document.body);
  expect(panel).toHaveClass("z-[130]");
  expect(container.querySelector('[role="group"]')).toBeNull();
});
