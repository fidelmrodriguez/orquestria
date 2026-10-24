import type { Priority, Workspace } from "@/types/board";
import { priorityOptions } from "./topbar-options";

type TopbarFiltersProps = {
  workspace?: Workspace | null;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  priorityClassName: string;
  assigneeClassName: string;
  onPriorityChange: (value: Priority | "todas") => void;
  onAssigneeChange: (value: string | "todos") => void;
};

export function TopbarFilters({ workspace, priorityFilter, assigneeFilter, priorityClassName, assigneeClassName, onPriorityChange, onAssigneeChange }: TopbarFiltersProps) {
  return (
    <>
      <select
        value={priorityFilter}
        onChange={(event) => onPriorityChange(event.target.value as Priority | "todas")}
        className={priorityClassName}
        aria-label="Filtrar por prioridade"
      >
        {priorityOptions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        value={assigneeFilter}
        onChange={(event) => onAssigneeChange(event.target.value)}
        className={assigneeClassName}
        aria-label="Filtrar por responsável"
      >
        <option value="todos">Todos</option>
        {workspace?.members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
    </>
  );
}
