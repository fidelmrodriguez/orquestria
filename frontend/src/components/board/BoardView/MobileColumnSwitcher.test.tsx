import { render, screen, fireEvent, within } from "@testing-library/react";
import { useState } from "react";
import { MobileColumnSwitcher } from "./MobileColumnSwitcher";
import type { Column } from "@/types/board";

const columns: Column[] = [
  { id: "backlog", projectId: "p1", title: "Backlog", color: "bg-slate-400", order: 0 },
  { id: "andamento", projectId: "p1", title: "Em execução", color: "bg-amber-400", order: 1 },
  { id: "feito", projectId: "p1", title: "Concluído", color: "bg-emerald-400", order: 2 }
];

function Example({ onNewTask = jest.fn() }: { onNewTask?: jest.Mock }) {
  const [current, setCurrent] = useState(columns[0].id);
  return <MobileColumnSwitcher columns={columns} activeColumnId={current}
    taskCounts={{ backlog: 3, andamento: 2, feito: 0 }} onChange={setCurrent} onNewTask={onNewTask} />;
}

describe("navegação mobile do Kanban", () => {
  it("mostra a primeira coluna e navega com setas sem scroll horizontal", () => {
    render(<Example />);
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coluna anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Próxima coluna" }));
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Escolher coluna. Atual: Em execução/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próxima coluna" }));
    expect(screen.getByRole("button", { name: "Próxima coluna" })).toBeDisabled();
  });

  it("permite escolher diretamente uma coluna e indica a quantidade de tarefas", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: /Escolher coluna/ }));
    const menu = screen.getByRole("group", { name: "Colunas disponíveis" });
    expect(within(menu).getByRole("button", { name: /Em execução/ })).toHaveTextContent("2");
    fireEvent.click(within(menu).getByRole("button", { name: /Concluído/ }));
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Colunas disponíveis" })).not.toBeInTheDocument();
  });

  it("cria tarefa na coluna escolhida", () => {
    const onNewTask = jest.fn();
    render(<Example onNewTask={onNewTask} />);
    fireEvent.click(screen.getByRole("button", { name: "Próxima coluna" }));
    fireEvent.click(screen.getByRole("button", { name: "Nova tarefa em Em execução" }));
    expect(onNewTask).toHaveBeenCalledWith("andamento");
  });

  it("oferece criar coluna e tarefa lado a lado no lugar dos botões do topbar", () => {
    const onAddColumn = jest.fn();
    render(<MobileColumnSwitcher columns={columns} activeColumnId="backlog"
      taskCounts={{ backlog: 3, andamento: 2, feito: 0 }} onChange={jest.fn()}
      onNewTask={jest.fn()} onAddColumn={onAddColumn} projectId="p1" />);
    const actions = screen.getByLabelText("Ações do projeto");
    expect(within(actions).getByRole("button", { name: "Adicionar coluna ao projeto" })).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: "Nova tarefa em Backlog" })).toBeInTheDocument();
    fireEvent.click(within(actions).getByRole("button", { name: "Adicionar coluna ao projeto" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome da nova coluna" }), { target: { value: "Revisão" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(onAddColumn).toHaveBeenCalledWith("p1", "Revisão");
  });

  it("permite criar a primeira coluna de projeto vazio", () => {
    render(<MobileColumnSwitcher columns={[]} activeColumnId={null} taskCounts={{}}
      onChange={jest.fn()} onNewTask={jest.fn()} onAddColumn={jest.fn()} projectId="p1" />);
    expect(screen.getByRole("button", { name: "Adicionar coluna ao projeto" })).toBeInTheDocument();
  });

  it("não apresenta navegação quando o projeto não tem colunas", () => {
    const { container } = render(<MobileColumnSwitcher columns={[]} activeColumnId={null}
      taskCounts={{}} onChange={jest.fn()} onNewTask={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
