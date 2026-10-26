import { UsersRound } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Workspace } from "@/types/board";

type TeamPreviewProps = {
  workspace?: Workspace | null;
};

export function TeamPreview({ workspace }: TeamPreviewProps) {
  return (
    <section className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <span className="inline-flex items-center gap-2"><UsersRound className="size-4" /> Equipe</span>
        <a href="/equipe" aria-label="Adicionar membro da equipe" title="Adicionar membro da equipe"
          className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200">+ Membro</a>
      </div>
      <div className="flex -space-x-2">
        {workspace?.members.slice(0, 6).map((member) => (
          <div
            key={member.id}
            aria-label={member.name}
            className="grid size-8 place-items-center rounded-full border-2 border-white bg-slate-950 text-[10px] font-semibold text-white dark:border-slate-900 dark:bg-white dark:text-slate-950"
          >
            {getInitials(member.name)}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {workspace?.members.length || 0} pessoas disponíveis para atribuição de tarefas. Adicionar à equipe não compartilha o projeto.
      </p>
    </section>
  );
}
