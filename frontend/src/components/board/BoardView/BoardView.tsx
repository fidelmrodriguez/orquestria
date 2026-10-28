"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { BoardColumn } from "./BoardColumn";
import { EmptyBoardState } from "./EmptyBoardState";
import { useBoardViewData } from "./useBoardViewData";
import { TaskDragPreview } from "./TaskDragPreview";
import { MobileColumnSwitcher } from "./MobileColumnSwitcher";
import { positionFromVisibleTasks, isNoopReorder } from "@/lib/task-order";
import { insertionFromCardHover } from "@/lib/kanban-hover-position";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";
import { getProjectMembers, type Task } from "@/types/board";

// Pointer Events: a tarefa acompanha o cursor; as outras abrem espaço para sua posição final.
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
  height: number;
  destinationId: string | null;
  insertionIndex: number;
  hoveredTaskId: string | null;
  sourceVisibleIndex: number;
  anchorRects: Map<string, { top: number; bottom: number }>;
  scrollOrigins: Map<string, number>;
  windowScrollOrigin: number;
};

type BoardViewProps = { onNewTask: (columnId?: string) => void };

function insertionFromPointer(column: HTMLElement, clientY: number, drag: DragSession) {
  // A medição é feita no começo do drag, ANTES de abrir o espaço animado.
  // Assim, deslocamentos dos cartões não fazem o alvo saltar de posição.
  const columnId = column.dataset.kanbanColumnId;
  const list = column.querySelector<HTMLElement>("[data-kanban-task-list]");
  const scrollDelta = (list?.scrollTop ?? 0) - (drag.scrollOrigins.get(columnId ?? "") ?? 0);
  const pageDelta = window.scrollY - drag.windowScrollOrigin;
  const cards = Array.from(column.querySelectorAll<HTMLElement>("[data-kanban-task-id]"))
    .filter(card => card.dataset.kanbanTaskId !== drag.task.id)
    .map(card => {
      const anchor = drag.anchorRects.get(card.dataset.kanbanTaskId ?? "");
      const rect = anchor ?? card.getBoundingClientRect();
      return { id: card.dataset.kanbanTaskId ?? "",
        top: rect.top - scrollDelta - pageDelta, bottom: rect.bottom - scrollDelta - pageDelta };
    });
  return {
    insertionIndex: insertionFromCardHover(cards, clientY,
      columnId === drag.task.columnId ? drag.sourceVisibleIndex : null),
    hoveredTaskId: cards.find(card => clientY >= card.top && clientY <= card.bottom)?.id ?? null
  };
}

export function BoardView({ onNewTask }: BoardViewProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const search = useBoardStore(state => state.search);
  const priorityFilter = useBoardStore(state => state.priorityFilter);
  const assigneeFilter = useBoardStore(state => state.assigneeFilter);
  const moveTask = useBoardStore(state => state.moveTask);
  const duplicateTask = useBoardStore(state => state.duplicateTask);
  const updateColumn = useBoardStore(state => state.updateColumn);
  const remoteLoading = useBoardStore(state => state.remoteLoading);
  const { columns, filteredTasks } = useBoardViewData(workspace, project, search, priorityFilter, assigneeFilter);
  const boardRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const suppressClickUntilRef = useRef(0);
  const pendingRef = useRef<DragSession | null>(null);
  const activeRef = useRef<DragSession | null>(null);
  const dataRef = useRef({ filteredTasks, tasks: workspace?.tasks ?? [] });
  dataRef.current = { filteredTasks, tasks: workspace?.tasks ?? [] };
  const [dragging, setDragging] = useState<DragSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileColumnId, setMobileColumnId] = useState<string | null>(null);
  const activeMobileColumn = columns.find(column => column.id === mobileColumnId) ?? columns[0];
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const column of columns) counts[column.id] = 0;
    if (project && workspace) {
      for (const task of workspace.tasks) {
        if (task.projectId === project.id && task.columnId in counts) counts[task.columnId] += 1;
      }
    }
    return counts;
  }, [columns, project, workspace]);

  useEffect(() => setMounted(true), []);
  useEffect(() => { setMobileColumnId(null); }, [workspace?.id, project?.id]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      if (!activeRef.current && Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY) < 7) return;
      if (event.cancelable) event.preventDefault();
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const column = hit?.closest<HTMLElement>("[data-kanban-column-id]");
      const destinationId = column?.dataset.kanbanColumnId ?? null;
      const target = column ? insertionFromPointer(column, event.clientY, pending) : null;
      const next = { ...pending, x: event.clientX, y: event.clientY, destinationId,
        insertionIndex: target?.insertionIndex ?? -1, hoveredTaskId: target?.hoveredTaskId ?? null };
      const previous = activeRef.current;
      activeRef.current = next;
      // Atualiza a prévia sem renderizar o quadro inteiro em cada movimento do mouse.
      if (previewRef.current) {
        previewRef.current.style.left = `${next.x - next.offsetX}px`;
        previewRef.current.style.top = `${next.y - next.offsetY}px`;
      }
      if (!previous || previous.destinationId !== destinationId ||
        previous.insertionIndex !== next.insertionIndex || previous.hoveredTaskId !== next.hoveredTaskId)
        setDragging(next);

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
      if (event.type !== "pointerup" || !moved?.destinationId) return;
      const { tasks, filteredTasks } = dataRef.current;
      const position = positionFromVisibleTasks(tasks, filteredTasks, moved.task.id, moved.destinationId, moved.insertionIndex);
      // Arrastar para a posição atual não chama a API, mesmo dentro da mesma coluna.
      if (!isNoopReorder(tasks, moved.task.id, moved.destinationId, position))
        moveTask(moved.task.id, moved.destinationId, position);
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
    if ((event.target as HTMLElement).closest("button, input, select, textarea, a")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const anchorRects = new Map<string, { top: number; bottom: number }>();
    const scrollOrigins = new Map<string, number>();
    boardRef.current?.querySelectorAll<HTMLElement>("[data-kanban-task-id]").forEach(card => {
      const cardRect = card.getBoundingClientRect();
      anchorRects.set(card.dataset.kanbanTaskId ?? "", { top: cardRect.top, bottom: cardRect.bottom });
    });
    boardRef.current?.querySelectorAll<HTMLElement>("[data-kanban-column-id]").forEach(column => {
      scrollOrigins.set(column.dataset.kanbanColumnId ?? "",
        column.querySelector<HTMLElement>("[data-kanban-task-list]")?.scrollTop ?? 0);
    });
    const sourceVisibleIndex = Math.max(0, dataRef.current.filteredTasks
      .filter(item => item.columnId === task.columnId)
      .findIndex(item => item.id === task.id));
    pendingRef.current = {
      task, pointerId: event.pointerId,
      startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      width: rect.width, height: rect.height, destinationId: task.columnId,
      insertionIndex: sourceVisibleIndex, hoveredTaskId: null, sourceVisibleIndex,
      anchorRects, scrollOrigins, windowScrollOrigin: window.scrollY
    };
  };

  if (!workspace || !project) return <EmptyBoardState />;
  const members = getProjectMembers(workspace, project.id);

  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:h-full">
    <MobileColumnSwitcher columns={columns} activeColumnId={activeMobileColumn?.id ?? null} taskCounts={taskCounts}
      onChange={setMobileColumnId} onNewTask={columnId => onNewTask(columnId)} />
    <div ref={boardRef} onClickCapture={event => {
      if (Date.now() < suppressClickUntilRef.current) { event.preventDefault(); event.stopPropagation(); }
    }} aria-label="Colunas do Kanban" className="kanban-board-scroll flex min-w-0 flex-col gap-4 overflow-visible lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-x-auto lg:overflow-y-hidden lg:pb-2">
      {columns.map(column => <BoardColumn key={column.id} column={column}
        tasks={filteredTasks.filter(task => task.columnId === column.id && task.id !== dragging?.task.id)}
        totalTaskCount={workspace.tasks.filter(task => task.columnId === column.id && task.projectId === project.id).length}
        members={members} onNewTask={() => onNewTask(column.id)}
        mobileActive={column.id === activeMobileColumn?.id}
        dragging={Boolean(dragging)} dropTarget={dragging?.destinationId === column.id}
        insertionIndex={dragging?.destinationId === column.id ? dragging.insertionIndex : -1}
        hoveredTaskId={dragging?.destinationId === column.id ? dragging.hoveredTaskId : null}
        placeholderHeight={dragging?.height ?? 0}
        onPrepareDrag={prepareDrag} onRenameColumn={updateColumn} onDuplicateTask={duplicateTask} />)}
      {!columns.length && <div className="grid min-h-[200px] w-full place-items-center rounded-2xl border border-dashed border-slate-300 px-6 text-sm text-slate-500">Adicione uma coluna para começar.</div>}
    </div>
    {dragging && mounted && createPortal(<TaskDragPreview drag={dragging} previewRef={previewRef} />, document.body)}
  </section>;
}
