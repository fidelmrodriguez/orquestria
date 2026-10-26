"use client";

import { X } from "lucide-react";
import QuickDeleteAction from "@/components/board/QuickDeleteAction";
import { useEffect, useState } from "react";
import { useAccessiblePanel } from "@/hooks/use-accessible-panel";
import { isApiMode } from "@/lib/remote-board";
import type { Task } from "@/types/board";
import { InlineEdit } from "@/components/forms/InlineEdit/InlineEdit";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { selectActiveWorkspace, selectSelectedTask, useBoardStore } from "@/store/board-store";
import { TaskCommentsSection } from "./TaskCommentsSection";
import { TaskPlanningCards } from "./TaskPlanningCards";
import { TaskPropertiesForm } from "./TaskPropertiesForm";

function TaskDescriptionEditor({ task, onSave }: {
  task: Task; onSave: (id: string, patch: {description: string}) => void;
}) {
  const [draft, setDraft] = useState(task.description);
  useEffect(() => { setDraft(task.description); }, [task.id, task.description]);
  return <textarea
    value={draft}
    onChange={(event) => {
      setDraft(event.target.value);
      if (!isApiMode) onSave(task.id, { description: event.target.value });
    }}
    onBlur={() => { if (isApiMode && draft !== task.description) onSave(task.id, { description: draft }); }}
    className="min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
    aria-label="Descrição da tarefa"
  />;
}

export function TaskDetailPanel() {
  const task = useBoardStore(selectSelectedTask);
  const workspace = useBoardStore(selectActiveWorkspace);
  const setSelectedTask = useBoardStore((state) => state.setSelectedTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const moveTask = useBoardStore((state) => state.moveTask);
  const addComment = useBoardStore((state) => state.addComment);
  const { notify } = useToast();
  const { panelRef, onKeyDown } = useAccessiblePanel<HTMLDivElement>(
    Boolean(task && workspace),
    () => setSelectedTask(null)
  );

  if (!task || !workspace) return null;

  const member = workspace.members.find((item) => item.id === task.assigneeId);
  const column = workspace.columns.find((item) => item.id === task.columnId);

  const submitComment = async (message: string) => {
    const result = await addComment(task.id, message);
    if (result === false) notify("Não foi possível salvar o comentário.", "error");
    else notify("Comentário enviado.", "success");
  };

  return (
    <div ref={panelRef} onKeyDown={onKeyDown} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="task-detail-heading"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-slate-200 bg-white shadow-soft outline-none dark:border-slate-800 dark:bg-slate-950 sm:top-0">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p id="task-detail-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Detalhes da tarefa</p>
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

          <TaskDescriptionEditor task={task} onSave={updateTask} />

          <TaskPropertiesForm task={task} workspace={workspace} onUpdateTask={updateTask} onMoveTask={moveTask} />
          <TaskPlanningCards task={task} onUpdateTask={updateTask} />
          <TaskCommentsSection task={task} members={workspace.members} fallbackMember={member} onSubmitComment={submitComment} />
        </div>
        <footer className="border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
          <QuickDeleteAction target={{kind:"task",projectId:task.projectId,id:task.id}}
            name={`tarefa ${task.title}`} impact="A tarefa e seus comentários serão excluídos permanentemente."
            label="Excluir tarefa" className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300" />
        </footer>
      </div>
    </div>
  );
}
