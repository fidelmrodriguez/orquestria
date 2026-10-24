import { Layers3 } from "lucide-react";

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-card dark:bg-white dark:text-slate-950">
        <Layers3 className="size-5" />
      </div>
      <div>
        <p className="text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">Orquestria</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Gestão de operação</p>
      </div>
    </div>
  );
}
