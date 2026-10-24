"use client";

import { X } from "lucide-react";
import { InlineEdit } from "@/components/forms/InlineEdit/InlineEdit";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { selectActiveWorkspace, selectSelectedTask, useBoardStore } from "@/store/board-store";
import { TaskCommentsSection } from "./TaskCommentsSection";
import { TaskPlanningCards } from "./TaskPlanningCards";
import { TaskPropertiesForm } from "./TaskPropertiesForm";

export function TaskDetailPanel() {
  const task = useBoardStore(selectSelectedTask);
  const workspace = useBoardStore(selectActiveWorkspace);
  const setSelectedTask = useBoardStore((state) => state.setSelectedTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const addComment = useBoardStore((state) => state.addComment);
  const { notify } = useToast();

  if (!task || !workspace) return null;

  const member = workspace.members.find((item) => item.id === task.assigneeId);
  const column = workspace.columns.find((item) => item.id === task.columnId);

  const submitComment = (message: string) => {
    addComment(task.id, message);
    notify("Comentário enviado.", "success");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950 sm:top-0">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Detalhes da tarefa</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{column?.title || "Sem coluna"}</p>
          </div>
          <button type="button" onClick={() => setSelectedTask(null)} className="icon-button" aria-label="Fechar painel">
            <X className="size-5" />
          </button>
        </header>

        <div className="panel-scroll flex-1 space-y-6 overflow-y-auto p-5">
          <InlineEdit
            value={task.title}
            onSave={(value) => updateTask(task.id, { title: value })}
            ariaLabel="Editar título da tarefa"
            className="max-w-full text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white"
            inputClassName="text-xl font-semibold"
          />

          <textarea
            value={task.description}
            onChange={(event) => updateTask(task.id, { description: event.target.value })}
            className="min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Descrição da tarefa"
          />

          <TaskPropertiesForm task={task} workspace={workspace} onUpdateTask={updateTask} />
          <TaskPlanningCards task={task} onUpdateTask={updateTask} />
          <TaskCommentsSection task={task} members={workspace.members} fallbackMember={member} onSubmitComment={submitComment} />
        </div>
      </div>
    </div>
  );
}
