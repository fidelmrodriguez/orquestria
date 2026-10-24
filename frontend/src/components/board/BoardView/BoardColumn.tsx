import { InlineEdit } from "@/components/forms/InlineEdit/InlineEdit";
import { TaskCard } from "@/components/board/TaskCard/TaskCard";
import { cn } from "@/lib/utils";
import type { Column, Member, Task } from "@/types/board";

type BoardColumnProps = {
  column: Column;
  tasks: Task[];
  members: Member[];
  draggedTaskId: string | null;
  onNewTask: () => void;
  onMoveTask: (taskId: string, columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDragTask: (taskId: string | null) => void;
};

export function BoardColumn({ column, tasks, members, draggedTaskId, onNewTask, onMoveTask, onRenameColumn, onDragTask }: BoardColumnProps) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/plain") || draggedTaskId;
        if (id) onMoveTask(id, column.id);
        onDragTask(null);
      }}
      className={cn(
        "flex max-h-[calc(100vh-260px)] min-h-[360px] w-[310px] shrink-0 flex-col rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-3 transition dark:border-slate-800 dark:bg-slate-900/50",
        draggedTaskId && "border-dashed border-slate-400 dark:border-slate-600"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("size-2.5 rounded-full", column.color)} />
          <InlineEdit
            value={column.title}
            onSave={(value) => onRenameColumn(column.id, value)}
            ariaLabel="Editar nome da coluna"
            className="max-w-[190px] text-sm font-semibold text-slate-800 dark:text-slate-100"
          />
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">{tasks.length}</span>
      </div>

      <div className="kanban-scroll flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} member={members.find((member) => member.id === task.assigneeId)} />
        ))}
        {!tasks.length && (
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
