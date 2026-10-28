import { ArrowLeft } from "lucide-react";

/** Retorno consistente e acessível nas páginas independentes do Kanban. */
export function BackToKanbanLink() {
  return (
    <a
      href="/"
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-200"
    >
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
      Voltar ao Kanban
    </a>
  );
}
