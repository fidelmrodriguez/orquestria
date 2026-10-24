import { useState } from "react";
import { Bell, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Activity } from "@/types/board";

type NotificationsMenuProps = {
  activities: Activity[];
};

export function NotificationsMenu({ activities }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="icon-button" aria-label="Notificações" aria-expanded={open}>
        <Bell className="size-4" />
        {activities.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-24px))] rounded-3xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-slate-950 dark:text-white">Notificações</strong>
            <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white" aria-label="Fechar notificações">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {recentActivities.length ? (
              recentActivities.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-sm leading-5 text-slate-700 dark:text-slate-200">{item.message}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
                Nenhuma notificação no momento.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
