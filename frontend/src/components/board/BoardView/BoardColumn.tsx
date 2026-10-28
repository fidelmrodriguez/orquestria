import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import QuickDeleteAction from "@/components/board/QuickDeleteAction";
import { InlineEdit } from "@/components/forms/InlineEdit/InlineEdit";
import { TaskCard } from "@/components/board/TaskCard/TaskCard";
import { cn } from "@/lib/utils";
import type { Column, Member, Task } from "@/types/board";

function DropSlot({ height }: { height: number }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return <div aria-hidden="true" data-kanban-drop-slot="true"
    className="kanban-reorder-slot shrink-0 overflow-hidden rounded-3xl border-2 border-dashed border-blue-400/80 bg-blue-100/50 transition-[height,opacity] duration-200 ease-out dark:bg-blue-950/30"
    style={{ height: expanded ? Math.max(90, height) : 0, opacity: expanded ? 1 : 0 }} />;
}


type BoardColumnProps = {
  column: Column;
  tasks: Task[];
  totalTaskCount: number;
  members: Member[];
  dragging: boolean;
  dropTarget: boolean;
  insertionIndex?: number;
  placeholderHeight?: number;
  onNewTask: () => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onPrepareDrag: (event: ReactPointerEvent<HTMLElement>, task: Task) => void;
  onDuplicateTask?: (taskId: string) => void;
  mobileActive?: boolean;
};

export function BoardColumn({ column, tasks, totalTaskCount, members, dragging, dropTarget, insertionIndex = -1, placeholderHeight = 0, onNewTask, onRenameColumn, onPrepareDrag, mobileActive = true, onDuplicateTask }: BoardColumnProps) {
  const [renaming, setRenaming] = useState(false);
  return (
    <div
      data-kanban-column-id={column.id}
      className={cn(
        "min-h-[350px] w-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-3 transition-[border-color,background-color,box-shadow] duration-200 lg:h-full lg:min-h-0 lg:w-[310px] lg:shrink-0 dark:border-slate-800 dark:bg-slate-900/50",
        mobileActive ? "kanban-mobile-column flex" : "hidden lg:flex",
        dragging && !dropTarget && "border-dashed border-slate-300 dark:border-slate-700",
        dropTarget && "kanban-drop-target border-blue-500 bg-blue-50/90 ring-4 ring-blue-100 dark:border-blue-400 dark:bg-blue-950/40 dark:ring-blue-900/40"
      )}
    >
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!renaming && <span className={cn("size-2.5 shrink-0 rounded-full", column.color)} />}
          <InlineEdit
            value={column.title}
            onSave={(value) => onRenameColumn(column.id, value)}
            ariaLabel="Editar nome da coluna"
            onEditingChange={setRenaming}
            className="min-w-0 max-w-[190px] text-sm font-semibold text-slate-800 dark:text-slate-100"
          />
        </div>
        {!renaming && <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">{totalTaskCount}</span>
          <button type="button" onClick={onNewTask} title={`Criar tarefa na coluna ${column.title}`}
            aria-label={`Criar tarefa na coluna ${column.title}`}
            className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"><Plus className="size-4" /></button>
          <QuickDeleteAction target={{kind:"column",projectId:column.projectId,id:column.id}} name={`coluna ${column.title}`}
            impact="A coluna será removida permanentemente." iconOnly label={`Excluir coluna ${column.title}`}
            disabledReason={totalTaskCount > 0 ? "Exclua ou mova todas as tarefas antes de remover a coluna." : undefined}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-25 dark:text-red-300" />
        </div>}
      </div>

      <div className="kanban-scroll flex flex-1 flex-col gap-3 overflow-y-visible pr-1 lg:min-h-0 lg:overflow-y-auto" data-kanban-task-list="true">
        {tasks.flatMap((task, index) => [
          ...(dropTarget && insertionIndex === index ? [<DropSlot key={`insertion-slot-${index}`} height={placeholderHeight} />] : []),
          <TaskCard key={task.id} task={task} member={members.find(member => member.id === task.assigneeId)} onPrepareDrag={onPrepareDrag} onDuplicateTask={onDuplicateTask} />
        ])}
        {dropTarget && insertionIndex >= tasks.length && <DropSlot key={`insertion-slot-${tasks.length}`} height={placeholderHeight} />}
        {!tasks.length && totalTaskCount > 0 && !dragging && (
          <div className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
            Nenhuma tarefa corresponde aos filtros atuais.
          </div>
        )}
        {!tasks.length && totalTaskCount === 0 && !dragging && (
          <button
            type="button"
            onClick={onNewTask}
            className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-center text-sm font-medium text-slate-400 transition hover:border-slate-400 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:text-slate-300"
          >
            Solte uma tarefa aqui ou crie uma nova.
          </button>
        )}
      </div>
    </div>
  );
}
