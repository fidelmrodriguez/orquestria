import { FolderKanban } from "lucide-react";
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
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectWorkspace(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition",
              item.id === activeWorkspaceId
                ? "bg-slate-950 text-white shadow-card dark:bg-white dark:text-slate-950"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            )}
          >
            <FolderKanban className="size-4" />
            <span className="truncate">{item.name}</span>
          </button>
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
