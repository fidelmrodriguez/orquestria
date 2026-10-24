import { UsersRound } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Workspace } from "@/types/board";

type TeamPreviewProps = {
  workspace?: Workspace | null;
};

export function TeamPreview({ workspace }: TeamPreviewProps) {
  return (
    <section className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <UsersRound className="size-4" /> Equipe
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
        {workspace?.members.length || 0} pessoas com acesso ao workspace atual.
      </p>
    </section>
  );
}
