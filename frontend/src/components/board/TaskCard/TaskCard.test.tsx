import { fireEvent, render, screen } from "@testing-library/react";
import { TaskCard } from "./TaskCard";
import type { Task } from "@/types/board";

const task: Task = {
  id: "task-original", projectId: "project-a", columnId: "column-a",
  title: "Preparar entrega", description: "Detalhes da tarefa",
  assigneeId: "owner", priority: "media", position: 0,
  tags: ["produto"], comments: [], dueDate: "2026-11-15T12:00:00Z",
  createdAt: "2026-10-28T00:00:00Z", updatedAt: "2026-10-28T00:00:00Z"
};

describe("duplicação contextual do cartão", () => {
  it("chama a duplicação do cartão certo sem iniciar drag nem abrir detalhes", () => {
    const duplicate = jest.fn();
    const prepareDrag = jest.fn();
    render(<TaskCard task={task} onDuplicateTask={duplicate} onPrepareDrag={prepareDrag} />);
    const button = screen.getByRole("button", { name: "Duplicar tarefa Preparar entrega" });
    fireEvent.pointerDown(button);
    fireEvent.click(button);
    expect(duplicate).toHaveBeenCalledWith("task-original");
    expect(prepareDrag).not.toHaveBeenCalled();
  });
});
