export function EmptyBoardState() {
  return (
    <div className="grid min-h-[50vh] place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950">
      <div>
        <p className="text-lg font-semibold text-slate-950 dark:text-white">Nenhum projeto ativo</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Crie um workspace ou selecione um projeto para continuar.</p>
      </div>
    </div>
  );
}
