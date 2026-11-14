export interface WeeklyProgressProps {
  percent: number;
  completed: number;
  total: number;
}

/** Completion bar for the selected week. */
export function WeeklyProgress({ percent, completed, total }: WeeklyProgressProps) {
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">Weekly progress</h2>
        <span className="text-xs font-bold text-primary">{percent}%</span>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8e9f6]"
        role="progressbar"
        aria-label="Weekly progress"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary-deep transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] font-medium text-muted">
        {completed} of {total} {total === 1 ? "task" : "tasks"} completed this week
      </p>
    </section>
  );
}
