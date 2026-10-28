import { UsersRound } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { getProjectMembers, type Workspace } from "@/types/board";

type TeamPreviewProps = {
  workspace?: Workspace | null;
  projectId?: string | null;
};

export function TeamPreview({ workspace, projectId }: TeamPreviewProps) {
  const members = getProjectMembers(workspace, projectId);
  return (
    <section className="sidebar-team-preview shrink-0 rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <span className="inline-flex items-center gap-2"><UsersRound className="size-4" /> Equipe</span>
        {!workspace?.invited && <a href={projectId ? `/equipe?projectId=${encodeURIComponent(projectId)}` : "/equipe"} aria-label="Adicionar membro da equipe" title="Adicionar membro da equipe"
          className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200">+ Membro</a>}
      </div>
      <div className="flex -space-x-2">
        {members.slice(0, 6).map((member) => (
          <div
            key={member.id}
            aria-label={member.name}
            className="grid size-8 place-items-center rounded-full border-2 border-white bg-slate-950 text-[10px] font-semibold text-white dark:border-slate-900 dark:bg-white dark:text-slate-950"
          >
            {getInitials(member.name)}
          </div>
        ))}
      </div>
      <p className="sidebar-team-description mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {members.length} {members.length === 1 ? "pessoa disponível" : "pessoas disponíveis"} para atribuição de tarefas. {workspace?.invited ? "Acesso de membro-admin somente aos projetos compartilhados." : "Os acessos são concedidos por projeto."}
      </p>
    </section>
  );
}
