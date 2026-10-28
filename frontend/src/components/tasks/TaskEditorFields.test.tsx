import { fireEvent, render, screen } from "@testing-library/react";
import { TaskEditorFields, type TaskEditorValues } from "./TaskEditorFields";
import type { Column, Member } from "@/types/board";

jest.mock("@/components/tags/TagsInput", () => ({
  __esModule: true,
  default: () => <span>Editor de tags</span>
}));

const columns: Column[] = [{id:"col1",projectId:"p1",title:"Planejado",order:0,color:"bg-blue-500"}];
const members: Member[] = [{id:"m1",name:"Maria",email:"",avatar:"",role:"admin"}];
const values: TaskEditorValues = {columnId:"col1",assigneeId:"m1",priority:"media",dueDate:"2026-11-15",tags:[]};

describe("campos compartilhados de criação e edição", () => {
  it("usa seletores personalizados e mantém as quatro propriedades e tags", () => {
    const onPriority = jest.fn();
    const onDate = jest.fn();
    const {container} = render(<TaskEditorFields columns={columns} members={members} values={values}
      onColumnChange={jest.fn()} onAssigneeChange={jest.fn()} onPriorityChange={onPriority}
      onDueDateChange={onDate} onTagsChange={jest.fn()} />);
    expect(container.querySelector("select")).toBeNull();
    for (const name of ["Coluna", "Responsável", "Prioridade"])
      expect(screen.getByRole("combobox", {name})).toBeInTheDocument();
    expect(screen.getByText("Editor de tags")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("combobox", {name:"Prioridade"}));
    fireEvent.click(screen.getByRole("option", {name:"Alta"}));
    expect(onPriority).toHaveBeenCalledWith("alta");
    fireEvent.change(screen.getByLabelText("Prazo"), {target:{value:"2026-11-16"}});
    expect(onDate).toHaveBeenCalledWith("2026-11-16");
  });
});
