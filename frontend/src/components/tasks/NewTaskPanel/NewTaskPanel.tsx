"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import type { Priority } from "@/types/board";

const schema = z.object({
  title: z.string().min(3, "Informe um título com pelo menos 3 caracteres."),
  description: z.string().min(8, "Descreva a tarefa com mais detalhes."),
  columnId: z.string().min(1, "Selecione a coluna."),
  assigneeId: z.string().min(1, "Selecione o responsável."),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  dueDate: z.string().min(1, "Informe o prazo."),
  tags: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

type NewTaskPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function NewTaskPanel({ open, onClose }: NewTaskPanelProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const addTask = useBoardStore((state) => state.addTask);
  const { notify } = useToast();
  const columns = useMemo(() => {
    if (!workspace || !project) return [];
    return workspace.columns.filter((column) => column.projectId === project.id).sort((a, b) => a.order - b.order);
  }, [project, workspace]);

  const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: "",
      description: "",
      columnId: columns[0]?.id || "",
      assigneeId: workspace?.members[0]?.id || "",
      priority: "media",
      dueDate: defaultDate,
      tags: "Produto, Operação"
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
      tags: values.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) || []
    });
    if (saved === false) {
      notify("Não foi possível salvar a tarefa na API Java.", "error");
      return;
    }
    reset();
    notify("Tarefa criada com sucesso.", "success");
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nova tarefa</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Criar atividade no projeto</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Fechar painel">
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit(submit)} className="panel-scroll flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block space-y-2">
            <span className="label">Título</span>
            <input {...register("title")} className="field" placeholder="Ex.: Validar fluxo de aprovação" />
            {errors.title && <span className="error-text">{errors.title.message}</span>}
          </label>

          <label className="block space-y-2">
            <span className="label">Descrição</span>
            <textarea {...register("description")} className="field min-h-28 resize-none" placeholder="Contexto, objetivo e critérios de aceite" />
            {errors.description && <span className="error-text">{errors.description.message}</span>}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Coluna</span>
              <select {...register("columnId")} className="field">
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
              {errors.columnId && <span className="error-text">{errors.columnId.message}</span>}
            </label>

            <label className="block space-y-2">
              <span className="label">Responsável</span>
              <select {...register("assigneeId")} className="field">
                {workspace.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.assigneeId && <span className="error-text">{errors.assigneeId.message}</span>}
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
              <input type="date" {...register("dueDate")} className="field" />
              {errors.dueDate && <span className="error-text">{errors.dueDate.message}</span>}
            </label>
          </div>

          <label className="block space-y-2">
            <span className="label">Tags</span>
            <input {...register("tags")} className="field" placeholder="Produto, Design, API" />
          </label>

          <div className="sticky bottom-0 -mx-5 mt-8 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              <Plus className="size-4" /> Criar tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
