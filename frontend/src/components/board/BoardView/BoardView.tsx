"use client";

import { AddColumnForm } from "./AddColumnForm";
import { BoardColumn } from "./BoardColumn";
import { BoardSummary } from "./BoardSummary";
import { EmptyBoardState } from "./EmptyBoardState";
import { useBoardViewData } from "./useBoardViewData";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";

type BoardViewProps = {
  onNewTask: () => void;
};

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

  if (!workspace || !project) {
    return <EmptyBoardState />;
  }

  return (
    <section className="space-y-5">
      <BoardSummary
        project={project}
        taskCount={filteredTasks.length}
        memberCount={workspace.members.length}
        columnCount={columns.length}
        onRenameProject={updateProject}
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={filteredTasks.filter((task) => task.columnId === column.id)}
            members={workspace.members}
            draggedTaskId={draggedTaskId}
            onNewTask={onNewTask}
            onMoveTask={moveTask}
            onRenameColumn={updateColumn}
            onDragTask={setDraggedTask}
          />
        ))}

        <AddColumnForm projectId={project.id} onAddColumn={addColumn} />
      </div>
    </section>
  );
}
