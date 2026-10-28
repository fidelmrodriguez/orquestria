"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Clock3, MessageCircle, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getNotifications } from "@/lib/notifications";
import { useBoardStore } from "@/store/board-store";
import type { Activity } from "@/types/board";

type NotificationsMenuProps = { activities: Activity[] };

/** Avisos locais e prazos: lidos nesta instalação, sem prometer notificações push. */
export function NotificationsMenu({ activities }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentUser = useBoardStore(state => state.currentUser);
  const workspaces = useBoardStore(state => state.workspaces);
  const readIds = useBoardStore(state => state.notificationReadIds);
  const markRead = useBoardStore(state => state.markNotificationsRead);
  const setWorkspace = useBoardStore(state => state.setActiveWorkspace);
  const setProject = useBoardStore(state => state.setActiveProject);
  const setSelectedTask = useBoardStore(state => state.setSelectedTask);
  const entries = getNotifications(activities, workspaces, currentUser);
  const readSet = new Set(readIds);
  const unread = entries.filter(entry => !readSet.has(entry.id)).length;

  useEffect(() => {
    if (!open) return;
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const openPanel = () => {
    if (!open) markRead(entries.map(item => item.id));
    setOpen(value => !value);
  };

  const visit = (entry: (typeof entries)[number]) => {
    if (!entry.projectId || !entry.taskId) return;
    const space = workspaces.find(item => item.projects.some(project => project.id === entry.projectId));
    const taskExists = space?.tasks.some(task => task.id === entry.taskId);
    if (!space || !taskExists) return;
    setWorkspace(space.id);
    setProject(entry.projectId);
    setSelectedTask(entry.taskId);
    markRead([entry.id]);
    setOpen(false);
  };

  return <div ref={rootRef} className="relative shrink-0">
    <button ref={buttonRef} type="button" onClick={openPanel} className="icon-button relative" aria-label={unread ? `Notificações, ${unread} não lidas` : "Notificações"} aria-expanded={open} aria-haspopup="dialog">
      <Bell className="size-4" />
      {unread > 0 && <span data-testid="notification-unread-dot" aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500" />}
    </button>
    {open && <section role="dialog" aria-label="Central de notificações" className="absolute right-0 top-12 z-[80] w-[min(370px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Notificações</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Prazos e atividades nesta sessão</p>
        </div>
        <button type="button" onClick={() => { markRead(entries.map(item => item.id)); setOpen(false); }} aria-label="Fechar notificações" className="grid size-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"><X className="size-4" /></button>
      </div>
      <div className="mt-2 max-h-[min(65dvh,420px)] space-y-2 overflow-y-auto overscroll-contain">
        {entries.length ? entries.map(entry => {
          const canOpen = Boolean(entry.projectId && entry.taskId && workspaces.some(space => space.tasks.some(task => task.id === entry.taskId)));
          return <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-2">
              <div className="pt-0.5 text-slate-500 dark:text-slate-400">{entry.kind === "due" ? <Clock3 className="size-4" /> : entry.kind === "comment" ? <MessageCircle className="size-4" /> : <CheckCheck className="size-4" />}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-slate-800 dark:text-slate-200">{entry.message}</p>
                {entry.kind !== "due" && <p className="mt-1 text-xs text-slate-500">{formatDate(entry.createdAt)}</p>}
                {canOpen && <button type="button" onClick={() => visit(entry)} className="mt-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">Abrir tarefa</button>}
              </div>
            </div>
          </div>;
        }) : <p className="px-2 py-5 text-center text-sm text-slate-500">Nenhum prazo próximo ou atividade recente para exibir.</p>}
      </div>
      <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <button type="button" onClick={() => markRead(entries.map(item => item.id))} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"><CheckCheck className="size-4" /> Marcar todas como lidas</button>
      </div>
    </section>}
  </div>;
}
