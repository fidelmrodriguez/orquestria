import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskPropertiesForm } from "./TaskPropertiesForm";
import type { Task, Workspace } from "@/types/board";

const task: Task = {
  id: "task-1", title: "Verificar acessibilidade", description: "Descrição",
  projectId: "project-1", columnId: "column-1", assigneeId: "member-1",
  priority: "media", dueDate: "2026-11-02", tags: [], comments: [],
  createdAt: "2026-10-26", updatedAt: "2026-10-26"
};
const workspace: Workspace = {
  id: "workspace-1", name: "Workspace", description: "", projects: [], tasks: [task],
  members: [{ id: "member-1", name: "Pessoa", email: "", avatar: "", role: "editor" }],
  columns: [
    { id: "column-1", projectId: "project-1", title: "A fazer", order: 0, color: "bg-slate-400" },
    { id: "column-2", projectId: "project-1", title: "Concluído", order: 1, color: "bg-slate-400" },
    { id: "column-other", projectId: "project-other", title: "Projeto alheio", order: 0, color: "bg-slate-400" }
  ]
};

describe("edição de propriedades por teclado e sem selects nativos", () => {
  it("move a tarefa apenas entre colunas do mesmo projeto", async () => {
    const user = userEvent.setup();
    const onMoveTask = jest.fn();
    const { container } = render(<TaskPropertiesForm task={task} workspace={workspace} members={workspace.members} onUpdateTask={jest.fn()} onMoveTask={onMoveTask} />);
    expect(container.querySelector("select")).toBeNull();
    await user.click(screen.getByRole("combobox", { name: "Coluna" }));
    expect(screen.getByRole("option", { name: "A fazer" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Projeto alheio" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Concluído" }));
    expect(onMoveTask).toHaveBeenCalledWith("task-1", "column-2");
    expect(screen.queryByRole("listbox", { name: "Coluna" })).not.toBeInTheDocument();
  });

  it("não envia alteração quando seleciona a coluna atual", async () => {
    const user = userEvent.setup();
    const onMoveTask = jest.fn();
    render(<TaskPropertiesForm task={task} workspace={workspace} members={workspace.members} onUpdateTask={jest.fn()} onMoveTask={onMoveTask} />);
    await user.click(screen.getByRole("combobox", { name: "Coluna" }));
    await user.click(screen.getByRole("option", { name: "A fazer" }));
    expect(onMoveTask).not.toHaveBeenCalled();
  });

  it("permite alterar a prioridade sem criar popup nativo sobre a confirmação", async () => {
    const user = userEvent.setup();
    const update = jest.fn();
    render(<TaskPropertiesForm task={task} workspace={workspace} members={workspace.members} onUpdateTask={update} onMoveTask={jest.fn()} />);
    await user.click(screen.getByRole("combobox", { name: "Prioridade" }));
    await user.click(screen.getByRole("option", { name: "Alta" }));
    expect(update).toHaveBeenCalledWith("task-1", { priority: "alta" });
    expect(screen.queryByRole("listbox", { name: "Prioridade" })).not.toBeInTheDocument();
  });
});
