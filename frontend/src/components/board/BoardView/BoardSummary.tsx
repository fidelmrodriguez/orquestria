import { InlineEdit } from "@/components/forms/InlineEdit/InlineEdit";
import type { Project } from "@/types/board";
import { BoardMetric } from "./BoardMetric";

type BoardSummaryProps = {
  project: Project;
  taskCount: number;
  memberCount: number;
  columnCount: number;
  onRenameProject: (projectId: string, name: string) => void;
};

export function BoardSummary({ project, taskCount, memberCount, columnCount, onRenameProject }: BoardSummaryProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <InlineEdit
          value={project.name}
          onSave={(value) => onRenameProject(project.id, value)}
          ariaLabel="Editar nome do projeto"
          className="max-w-full text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white"
          inputClassName="text-xl font-semibold"
        />
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{project.description}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
        <BoardMetric label="Tarefas" value={taskCount} />
        <BoardMetric label="Membros" value={memberCount} />
        <BoardMetric label="Colunas" value={columnCount} />
      </div>
    </div>
  );
}
