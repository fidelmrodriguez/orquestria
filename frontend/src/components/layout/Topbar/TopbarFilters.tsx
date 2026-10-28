import { SafeSelect } from "@/components/forms/SafeSelect";
import { getProjectMembers, type Priority, type Workspace } from "@/types/board";
import { priorityOptions } from "./topbar-options";

type TopbarFiltersProps = {
  workspace?: Workspace | null;
  projectId?: string | null;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  priorityClassName: string;
  assigneeClassName: string;
  onPriorityChange: (value: Priority | "todas") => void;
  onAssigneeChange: (value: string | "todos") => void;
};

/** Os filtros reutilizam os mesmos menus do drawer: sem popup nativo do navegador. */
export function TopbarFilters({ workspace, projectId, priorityFilter, assigneeFilter, priorityClassName, assigneeClassName, onPriorityChange, onAssigneeChange }: TopbarFiltersProps) {
  const controlClassName = "!rounded-2xl !px-3 !py-2 !text-sm focus:!ring-1 focus:!ring-slate-200 dark:focus:!ring-slate-700";

  return (
    <>
      <div className={priorityClassName}>
        <SafeSelect
          label="Filtrar por prioridade"
          value={priorityFilter}
          options={priorityOptions}
          onChange={(next) => onPriorityChange(next as Priority | "todas")}
          className={controlClassName}
        />
      </div>
      <div className={assigneeClassName}>
        <SafeSelect
          label="Filtrar por responsável"
          value={assigneeFilter}
          options={[
            { value: "todos", label: "Todos" },
            ...getProjectMembers(workspace, projectId).map((member) => ({ value: member.id, label: member.name }))
          ]}
          onChange={onAssigneeChange}
          className={controlClassName}
        />
      </div>
    </>
  );
}
