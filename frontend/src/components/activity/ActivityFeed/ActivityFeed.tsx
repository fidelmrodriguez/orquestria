"use client";

import { Activity, Radio } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useBoardStore } from "@/store/board-store";

export function ActivityFeed() {
  const activities = useBoardStore((state) => state.activities);

  return (
    <aside className="hidden w-80 shrink-0 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950 2xl:block">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Atividade ao vivo</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sincronização entre abas</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
          <Radio className="size-3" /> online
        </span>
      </div>

      <div className="space-y-3">
        {activities.length ? (
          activities.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Activity className="size-3.5" /> {item.type}
              </div>
              <p className="text-sm leading-5 text-slate-700 dark:text-slate-200">{item.message}</p>
              <p className="mt-2 text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhuma atualização registrada.
          </div>
        )}
      </div>
    </aside>
  );
}
