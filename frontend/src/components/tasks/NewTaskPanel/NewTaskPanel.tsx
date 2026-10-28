"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { TaskEditorFields } from "@/components/tasks/TaskEditorFields";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { useAccessiblePanel } from "@/hooks/use-accessible-panel";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import { getProjectMembers, type Priority } from "@/types/board";

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
  const setSelectedTask = useBoardStore((state) => state.setSelectedTask);
  const projectMembers = getProjectMembers(workspace, project?.id);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  useEffect(() => { if (!open) setSelectedTags([]); }, [open]);
  const { notify } = useToast();
  const { panelRef, onKeyDown } = useAccessiblePanel<HTMLDivElement>(open && Boolean(workspace && project), onClose, 'input[name="title"]', false);
  const columns = useMemo(() => {
    if (!workspace || !project) return [];
    return workspace.columns.filter((column) => column.projectId === project.id).sort((a, b) => a.order - b.order);
  }, [project, workspace]);

  const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: "",
      description: "",
      columnId: (columns.some((column) => column.id === initialColumnId) ? initialColumnId : columns[0]?.id) || "",
      assigneeId: projectMembers[0]?.id || "",
      priority: "media",
      dueDate: defaultDate
    }
  });

  const current = watch();
  const updateValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValue(key, value, { shouldValidate: true, shouldDirty: true });
  };

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
    // A criação não deve abrir automaticamente o drawer de detalhes.
    setSelectedTask(null);
    notify("Tarefa criada com sucesso.", "success");
    onClose();
  };

  return (
    <Fragment>
      <div className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-[1px] dark:bg-slate-950/70" aria-hidden="true" />
    <div ref={panelRef} onKeyDown={onKeyDown} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="new-task-heading"
      className="fixed inset-y-0 right-0 z-[70] w-full max-w-xl border-l border-slate-200 bg-white shadow-soft outline-none dark:border-slate-800 dark:bg-slate-950">
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

        <div className="panel-scroll flex-1 overflow-y-auto p-5">
          <form id="new-task-form" onSubmit={handleSubmit(submit)} className="space-y-6">
            <label className="block space-y-2">
              <span className="label">Título</span>
              <input {...register("title")} className="field" aria-invalid={Boolean(errors.title)}
                placeholder="Ex.: Validar fluxo de aprovação" />
              {errors.title && <span className="error-text">{errors.title.message}</span>}
            </label>
            <label className="block space-y-2">
              <span className="label">Descrição</span>
              <textarea {...register("description")}
                className="orquestria-inset-field min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-600"
                aria-invalid={Boolean(errors.description)} placeholder="Contexto, objetivo e critérios de aceite" />
              {errors.description && <span className="error-text">{errors.description.message}</span>}
            </label>
            <TaskEditorFields columns={columns} members={projectMembers}
              values={{ columnId: current.columnId || "", assigneeId: current.assigneeId || "",
                priority: current.priority || "media", dueDate: current.dueDate || "", tags: selectedTags }}
              onColumnChange={value => updateValue("columnId", value)}
              onAssigneeChange={value => updateValue("assigneeId", value)}
              onPriorityChange={value => updateValue("priority", value)}
              onDueDateChange={value => updateValue("dueDate", value)}
              onTagsChange={setSelectedTags} />
            {errors.columnId && <span className="error-text">{errors.columnId.message}</span>}
            {errors.assigneeId && <span className="error-text">{errors.assigneeId.message}</span>}
            {errors.dueDate && <span className="error-text">{errors.dueDate.message}</span>}
          </form>
        </div>
        <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
          <button form="new-task-form" type="submit" disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-slate-950">
            <Plus className="size-4" /> {isSubmitting ? "Salvando tarefa..." : "Criar tarefa"}
          </button>
        </footer>
      </div>
    </div>
    </Fragment>
  );
}
