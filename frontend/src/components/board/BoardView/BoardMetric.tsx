type BoardMetricProps = {
  label: string;
  value: number;
};

export function BoardMetric({ label, value }: BoardMetricProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-900">
      <p className="text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}
