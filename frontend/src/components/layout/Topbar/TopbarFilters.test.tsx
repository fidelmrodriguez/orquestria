import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopbarFilters } from "./TopbarFilters";
import type { Workspace } from "@/types/board";

const workspace = {
  members: [
    { id: "user-1", name: "João" },
    { id: "user-2", name: "Maria" }
  ]
} as Workspace;

const props = {
  workspace,
  priorityFilter: "todas" as const,
  assigneeFilter: "todos" as const,
  priorityClassName: "hidden md:block",
  assigneeClassName: "hidden lg:block",
};

describe("filtros da barra superior", () => {
  it("usa menus acessíveis iguais aos do drawer, sem selects nativos", async () => {
    const user = userEvent.setup();
    const onPriorityChange = jest.fn();
    const onAssigneeChange = jest.fn();
    const { container } = render(<TopbarFilters {...props} onPriorityChange={onPriorityChange} onAssigneeChange={onAssigneeChange} />);

    expect(container.querySelectorAll("select")).toHaveLength(0);
    expect(screen.getByRole("combobox", { name: "Filtrar por prioridade" })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("combobox", { name: "Filtrar por prioridade" }));
    expect(screen.getByRole("listbox", { name: "Filtrar por prioridade" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Alta" }));
    expect(onPriorityChange).toHaveBeenCalledWith("alta");
    expect(screen.queryByRole("listbox", { name: "Filtrar por prioridade" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Filtrar por responsável" }));
    await user.click(screen.getByRole("option", { name: "Maria" }));
    expect(onAssigneeChange).toHaveBeenCalledWith("user-2");
  });

  it("fecha o filtro sem alterar o valor quando Escape é pressionado", async () => {
    const user = userEvent.setup();
    const onPriorityChange = jest.fn();
    render(<TopbarFilters {...props} onPriorityChange={onPriorityChange} onAssigneeChange={jest.fn()} />);
    const trigger = screen.getByRole("combobox", { name: "Filtrar por prioridade" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(onPriorityChange).not.toHaveBeenCalled();
  });

  it("respeita as classes responsivas usadas pelo cabeçalho", () => {
    const { container } = render(<TopbarFilters {...props} onPriorityChange={jest.fn()} onAssigneeChange={jest.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filtrar por prioridade" }).parentElement?.parentElement).toHaveClass("hidden", "md:block");
    expect(screen.getByRole("combobox", { name: "Filtrar por responsável" }).parentElement?.parentElement).toHaveClass("hidden", "lg:block");
    expect(container.querySelectorAll('button[role="combobox"]')).toHaveLength(2);
  });
});
