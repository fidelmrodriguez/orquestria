import { FolderKanban } from "lucide-react";
import QuickDeleteAction from "@/components/board/QuickDeleteAction";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/board";
import { CreateNavigationItemForm } from "./CreateNavigationItemForm";

type WorkspaceNavigationProps = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  workspaceName: string;
  onWorkspaceNameChange: (value: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
};

export function WorkspaceNavigation({ workspaces, activeWorkspaceId, workspaceName, onWorkspaceNameChange, onSelectWorkspace, onCreateWorkspace }: WorkspaceNavigationProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Workspaces
      </div>
      <div className="space-y-1">
        {workspaces.map((item) => (
          <div key={item.id} className="group flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectWorkspace(item.id)}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition",
              item.id === activeWorkspaceId
                ? "bg-slate-950 text-white shadow-card dark:bg-white dark:text-slate-950"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            )}
          >
            <FolderKanban className="size-4" />
            <span className="truncate">{item.name}</span>
          </button>
          <QuickDeleteAction target={{ kind: "workspace", id: item.id }} name={`workspace ${item.name}`}
            impact="Workspaces com projetos não podem ser excluídos. Remova os projetos antes de continuar."
            disabledReason={item.projects.length > 0 ? "Remova os projetos antes de excluir este workspace." : undefined}
            label={`Excluir workspace ${item.name}`} iconOnly className="rounded-lg p-1.5 text-red-600 opacity-70 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-20 group-hover:opacity-100 dark:text-red-300" />
          </div>
        ))}
      </div>
      <CreateNavigationItemForm
        value={workspaceName}
        onChange={onWorkspaceNameChange}
        onSubmit={onCreateWorkspace}
        placeholder="Novo workspace"
        ariaLabel="Criar workspace"
      />
    </section>
  );
}
