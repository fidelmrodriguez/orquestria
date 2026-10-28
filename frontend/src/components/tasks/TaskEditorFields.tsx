"use client";

import { CalendarDays } from "lucide-react";
import TagsInput from "@/components/tags/TagsInput";
import { SafeSelect } from "@/components/forms/SafeSelect";
import { getAuthToken } from "@/lib/auth-client";
import { apiUrl } from "@/lib/remote-board";
import type { Column, Member, Priority } from "@/types/board";

export type TaskEditorValues = {
  columnId: string;
  assigneeId: string;
  priority: Priority;
  dueDate: string;
  tags: string[];
};

type Props = {
  columns: Column[];
  members: Member[];
  values: TaskEditorValues;
  onColumnChange: (id: string) => void;
  onAssigneeChange: (id: string) => void;
  onPriorityChange: (priority: Priority) => void;
  onDueDateChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void | boolean | Promise<void | boolean>;
};

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" }
];

/** Mesmos campos e dimensões nos painéis de criação e de edição de tarefas. */
export function TaskEditorFields({ columns, members, values, onColumnChange, onAssigneeChange,
  onPriorityChange, onDueDateChange, onTagsChange }: Props) {
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <span className="label">Coluna</span>
        <SafeSelect label="Coluna" value={values.columnId}
          options={columns.map(column => ({ value: column.id, label: column.title }))}
          onChange={onColumnChange} />
      </div>
      <div className="space-y-2">
        <span className="label">Responsável</span>
        <SafeSelect label="Responsável" value={values.assigneeId}
          options={members.map(member => ({ value: member.id, label: member.name }))}
          onChange={onAssigneeChange} />
      </div>
      <div className="space-y-2">
        <span className="label">Prioridade</span>
        <SafeSelect label="Prioridade" value={values.priority}
          options={priorityOptions} onChange={value => onPriorityChange(value as Priority)} />
      </div>
      <div className="space-y-2">
        <label htmlFor="task-editor-due-date" className="label inline-flex items-center gap-2">
          <CalendarDays className="size-4" /> Prazo
        </label>
        <input id="task-editor-due-date" type="date" value={values.dueDate.slice(0, 10)}
          onChange={event => onDueDateChange(event.target.value)} className="field" />
      </div>
    </div>
    <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
      <TagsInput label="Tags" value={values.tags} onChange={onTagsChange}
        apiBase={apiUrl} token={getAuthToken() || undefined} maxTags={12} />
    </div>
  </div>;
}
