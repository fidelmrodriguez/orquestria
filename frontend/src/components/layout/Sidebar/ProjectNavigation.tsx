import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/board";
import { CreateNavigationItemForm } from "./CreateNavigationItemForm";

type ProjectNavigationProps = {
  workspace?: Workspace | null;
  activeProjectId: string | null;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
};

export function ProjectNavigation({ workspace, activeProjectId, projectName, onProjectNameChange, onSelectProject, onCreateProject }: ProjectNavigationProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Projetos
      </div>
      <div className="space-y-1">
        {workspace?.projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectProject(project.id)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition",
              project.id === activeProjectId
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            )}
          >
            <span className="truncate">{project.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              {workspace.tasks.filter((task) => task.projectId === project.id).length}
            </span>
          </button>
        ))}
      </div>
      {workspace && (
        <CreateNavigationItemForm
          value={projectName}
          onChange={onProjectNameChange}
          onSubmit={onCreateProject}
          placeholder="Novo projeto"
          ariaLabel="Criar projeto"
        />
      )}
    </section>
  );
}
