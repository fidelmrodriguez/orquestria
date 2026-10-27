"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { AddColumnForm } from "./AddColumnForm";
import { BoardColumn } from "./BoardColumn";
import { BoardSummary } from "./BoardSummary";
import { EmptyBoardState } from "./EmptyBoardState";
import { useBoardViewData } from "./useBoardViewData";
import { TaskDragPreview } from "./TaskDragPreview";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import { shouldMoveTask } from "@/lib/kanban-drag";
import type { Task } from "@/types/board";

// O arrasto é controlado por Pointer Events. A prévia acompanha o cursor em
// uma camada própria, em vez de depender da imagem semitransparente nativa do HTML5.
type DragSession = {
  pointerId: number;
  task: Task;
  startX: number;
  startY: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  destinationId: string | null;
};

type BoardViewProps = { onNewTask: (columnId?: string) => void };

export function BoardView({ onNewTask }: BoardViewProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const search = useBoardStore((state) => state.search);
  const priorityFilter = useBoardStore((state) => state.priorityFilter);
  const assigneeFilter = useBoardStore((state) => state.assigneeFilter);
  const moveTask = useBoardStore((state) => state.moveTask);
  const updateProject = useBoardStore((state) => state.updateProject);
  const addColumn = useBoardStore((state) => state.addColumn);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const remoteLoading = useBoardStore((state) => state.remoteLoading);
  const { columns, filteredTasks } = useBoardViewData(workspace, project, search, priorityFilter, assigneeFilter);
  const boardRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const suppressClickUntilRef = useRef(0);
  const pendingRef = useRef<DragSession | null>(null);
  const activeRef = useRef<DragSession | null>(null);
  const [dragging, setDragging] = useState<DragSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      const moved = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
      if (!activeRef.current && moved < 7) return;
      if (event.cancelable) event.preventDefault();
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const column = hit?.closest<HTMLElement>("[data-kanban-column-id]");
      const destinationId = column?.dataset.kanbanColumnId ?? null;
      const next = { ...pending, x: event.clientX, y: event.clientY, destinationId };
      const previous = activeRef.current;
      activeRef.current = next;
      // A prévia move diretamente pelo DOM: não renderizar todo o Kanban a cada pixel.
      if (previewRef.current) {
        previewRef.current.style.left = `${next.x - next.offsetX}px`;
        previewRef.current.style.top = `${next.y - next.offsetY}px`;
      }
      if (!previous || previous.destinationId !== destinationId) setDragging(next);

      // Permite alcançar colunas além da região visível sem criar outra barra.
      const viewport = boardRef.current;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
          if (event.clientX > rect.right - 55) viewport.scrollLeft += 18;
          else if (event.clientX < rect.left + 55) viewport.scrollLeft -= 18;
        }
      }
    }
    function finish(event: PointerEvent) {
      if (pendingRef.current?.pointerId !== event.pointerId) return;
      const moved = activeRef.current;
      pendingRef.current = null;
      activeRef.current = null;
      setDragging(null);
      if (moved) suppressClickUntilRef.current = Date.now() + 350;
      // Nunca chama a API ao soltar na mesma coluna ou fora de uma coluna.
      if (event.type === "pointerup" && moved && shouldMoveTask(moved.task.columnId, moved.destinationId)) {
        moveTask(moved.task.id, moved.destinationId!);
      }
    }
    function cancel() {
      pendingRef.current = null;
      activeRef.current = null;
      setDragging(null);
    }
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") cancel(); }
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moveTask]);

  useEffect(() => {
    pendingRef.current = null;
    activeRef.current = null;
    setDragging(null);
  }, [project?.id, workspace?.id, remoteLoading]);

  const prepareDrag = (event: ReactPointerEvent<HTMLElement>, task: Task) => {
    if (event.button !== 0 || pendingRef.current || remoteLoading) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, textarea, a")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pendingRef.current = {
      task, pointerId: event.pointerId,
      startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      width: rect.width, destinationId: null
    };
  };

  if (!workspace || !project) return <EmptyBoardState />;

  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:h-full">
    <BoardSummary project={project} taskCount={filteredTasks.length} memberCount={workspace.members.length}
      columnCount={columns.length} onRenameProject={updateProject} />
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <p className="text-xs text-slate-500 dark:text-slate-400">{columns.length} colunas no fluxo</p>
      <AddColumnForm projectId={project.id} onAddColumn={addColumn} />
    </div>
    <div ref={boardRef} onClickCapture={(event) => { if (Date.now() < suppressClickUntilRef.current) { event.preventDefault(); event.stopPropagation(); } }} aria-label="Colunas do Kanban" className="kanban-board-scroll flex min-h-[390px] min-w-0 gap-4 overflow-x-auto overflow-y-hidden pb-2 lg:min-h-0 lg:flex-1">
      {columns.map((column) => <BoardColumn key={column.id} column={column}
        tasks={filteredTasks.filter((task) => task.columnId === column.id && task.id !== dragging?.task.id)}
        totalTaskCount={workspace.tasks.filter((task) => task.columnId === column.id && task.projectId === project.id).length}
        members={workspace.members} onNewTask={() => onNewTask(column.id)}
        dragging={Boolean(dragging)} dropTarget={dragging?.destinationId === column.id && dragging.task.columnId !== column.id}
        onPrepareDrag={prepareDrag} onRenameColumn={updateColumn} />)}
      {!columns.length && <div className="grid min-w-64 place-items-center rounded-2xl border border-dashed border-slate-300 px-6 text-sm text-slate-500">Adicione uma coluna para começar.</div>}
    </div>
    {dragging && mounted && createPortal(<TaskDragPreview drag={dragging} previewRef={previewRef} />, document.body)}
  </section>;
}
