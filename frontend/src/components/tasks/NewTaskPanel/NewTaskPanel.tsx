"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TagsInput from "@/components/tags/TagsInput";
import { getAuthToken } from "@/lib/auth-client";
import { apiUrl } from "@/lib/remote-board";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { useAccessiblePanel } from "@/hooks/use-accessible-panel";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import type { Priority } from "@/types/board";

const schema = z.object({
  title: z.string().min(3, "Informe um título com pelo menos 3 caracteres."),
  description: z.string().min(8, "Descreva a tarefa com mais detalhes."),
  columnId: z.string().min(1, "Selecione a coluna."),
  assigneeId: z.string().min(1, "Selecione o responsável."),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  dueDate: z.string().min(1, "Informe o prazo.")
});

type FormValues = z.infer<typeof schema>;

type NewTaskPanelProps = {
  initialColumnId?: string;
  open: boolean;
  onClose: () => void;
};

export function NewTaskPanel({ open, onClose, initialColumnId }: NewTaskPanelProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const addTask = useBoardStore((state) => state.addTask);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  useEffect(() => { if (!open) setSelectedTags([]); }, [open]);
  const { notify } = useToast();
  const { panelRef, onKeyDown } = useAccessiblePanel<HTMLDivElement>(open && Boolean(workspace && project), onClose, 'input[name="title"]');
  const columns = useMemo(() => {
    if (!workspace || !project) return [];
    return workspace.columns.filter((column) => column.projectId === project.id).sort((a, b) => a.order - b.order);
  }, [project, workspace]);

  const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: "",
      description: "",
      columnId: (columns.some((column) => column.id === initialColumnId) ? initialColumnId : columns[0]?.id) || "",
      assigneeId: workspace?.members[0]?.id || "",
      priority: "media",
      dueDate: defaultDate
    }
  });

  if (!open || !workspace || !project) return null;

  const submit = async (values: FormValues) => {
    const saved = await addTask({
      title: values.title,
      description: values.description,
      columnId: values.columnId,
      projectId: project.id,
      assigneeId: values.assigneeId,
      priority: values.priority as Priority,
      dueDate: new Date(values.dueDate).toISOString(),
      tags: selectedTags
    });
    if (saved === false) {
      notify("Não foi possível salvar a tarefa na API Java.", "error");
      return;
    }
    reset();
    setSelectedTags([]);
    notify("Tarefa criada com sucesso.", "success");
    onClose();
  };

  return (
    <div ref={panelRef} onKeyDown={onKeyDown} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="new-task-heading"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-slate-200 bg-white shadow-soft outline-none dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nova tarefa</p>
            <h2 id="new-task-heading" className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Criar atividade no projeto</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Fechar painel">
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit(submit)} className="panel-scroll flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block space-y-2">
            <span className="label">Título</span>
            <input {...register("title")} className="field" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "new-task-title-error" : undefined} placeholder="Ex.: Validar fluxo de aprovação" />
            {errors.title && <span id="new-task-title-error" className="error-text">{errors.title.message}</span>}
          </label>

          <label className="block space-y-2">
            <span className="label">Descrição</span>
            <textarea {...register("description")} className="field min-h-28 resize-none" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "new-task-description-error" : undefined} placeholder="Contexto, objetivo e critérios de aceite" />
            {errors.description && <span id="new-task-description-error" className="error-text">{errors.description.message}</span>}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Coluna</span>
              <select {...register("columnId")} className="field" aria-invalid={Boolean(errors.columnId)} aria-describedby={errors.columnId ? "new-task-column-error" : undefined}>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
              {errors.columnId && <span id="new-task-column-error" className="error-text">{errors.columnId.message}</span>}
            </label>

            <label className="block space-y-2">
              <span className="label">Responsável</span>
              <select {...register("assigneeId")} className="field" aria-invalid={Boolean(errors.assigneeId)} aria-describedby={errors.assigneeId ? "new-task-assignee-error" : undefined}>
                {workspace.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.assigneeId && <span id="new-task-assignee-error" className="error-text">{errors.assigneeId.message}</span>}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Prioridade</span>
              <select {...register("priority")} className="field capitalize">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="label">Prazo</span>
              <input type="date" {...register("dueDate")} className="field" aria-invalid={Boolean(errors.dueDate)} aria-describedby={errors.dueDate ? "new-task-due-error" : undefined} />
              {errors.dueDate && <span id="new-task-due-error" className="error-text">{errors.dueDate.message}</span>}
            </label>
          </div>

          <TagsInput label="Tags" value={selectedTags} onChange={setSelectedTags}
            apiBase={apiUrl} token={getAuthToken() || undefined} maxTags={12} />

          <div className="sticky bottom-0 -mx-5 mt-8 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-slate-950">
              <Plus className="size-4" /> {isSubmitting ? "Salvando tarefa..." : "Criar tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
