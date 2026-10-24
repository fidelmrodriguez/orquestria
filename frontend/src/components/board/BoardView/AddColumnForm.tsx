import { useState } from "react";
import { Plus } from "lucide-react";

type AddColumnFormProps = {
  projectId: string;
  onAddColumn: (projectId: string, title: string) => void;
};

export function AddColumnForm({ projectId, onAddColumn }: AddColumnFormProps) {
  const [columnName, setColumnName] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const title = columnName.trim();
        if (!title) return;
        onAddColumn(projectId, title);
        setColumnName("");
      }}
      className="flex min-h-[220px] w-[280px] shrink-0 flex-col justify-between rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Nova coluna</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Adicione uma etapa para adaptar o fluxo do projeto.</p>
      </div>
      <div className="mt-4 flex gap-2">
        <input value={columnName} onChange={(event) => setColumnName(event.target.value)} className="mini-field" placeholder="Nome da coluna" />
        <button type="submit" className="icon-button" aria-label="Criar coluna">
          <Plus className="size-4" />
        </button>
      </div>
    </form>
  );
}
