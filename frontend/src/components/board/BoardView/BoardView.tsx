"use client";

import { AddColumnForm } from "./AddColumnForm";
import { BoardColumn } from "./BoardColumn";
import { BoardSummary } from "./BoardSummary";
import { EmptyBoardState } from "./EmptyBoardState";
import { useBoardViewData } from "./useBoardViewData";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";

type BoardViewProps = { onNewTask: (columnId?: string) => void };

export function BoardView({ onNewTask }: BoardViewProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const search = useBoardStore((state) => state.search);
  const priorityFilter = useBoardStore((state) => state.priorityFilter);
  const assigneeFilter = useBoardStore((state) => state.assigneeFilter);
  const draggedTaskId = useBoardStore((state) => state.draggedTaskId);
  const setDraggedTask = useBoardStore((state) => state.setDraggedTask);
  const moveTask = useBoardStore((state) => state.moveTask);
  const updateProject = useBoardStore((state) => state.updateProject);
  const addColumn = useBoardStore((state) => state.addColumn);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const { columns, filteredTasks } = useBoardViewData(workspace, project, search, priorityFilter, assigneeFilter);

  if (!workspace || !project) return <EmptyBoardState />;

  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:h-full">
    <BoardSummary project={project} taskCount={filteredTasks.length} memberCount={workspace.members.length}
      columnCount={columns.length} onRenameProject={updateProject} />
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <p className="text-xs text-slate-500 dark:text-slate-400">{columns.length} colunas no fluxo</p>
      <AddColumnForm projectId={project.id} onAddColumn={addColumn} />
    </div>
    <div aria-label="Colunas do Kanban" className="kanban-board-scroll flex min-h-[390px] min-w-0 gap-4 overflow-x-auto overflow-y-hidden pb-2 lg:min-h-0 lg:flex-1">
      {columns.map((column) => <BoardColumn key={column.id} column={column}
        tasks={filteredTasks.filter((task) => task.columnId === column.id)}
        totalTaskCount={workspace.tasks.filter((task) => task.columnId === column.id && task.projectId === project.id).length}
        members={workspace.members} draggedTaskId={draggedTaskId} onNewTask={() => onNewTask(column.id)}
        onMoveTask={moveTask} onRenameColumn={updateColumn} onDragTask={setDraggedTask} />)}
      {!columns.length && <div className="grid min-w-64 place-items-center rounded-2xl border border-dashed border-slate-300 px-6 text-sm text-slate-500">Adicione uma coluna para começar.</div>}
    </div>
  </section>;
}
