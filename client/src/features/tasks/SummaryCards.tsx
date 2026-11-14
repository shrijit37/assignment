import { AlarmClock, CheckCheck } from "lucide-react";

export interface SummaryCardsProps {
  completed: number;
  open: number;
}

const pad = (value: number): string => String(value).padStart(2, "0");

/** Two headline counters for the week: what is done and what is still open. */
export function SummaryCards({ completed, open }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-3xl bg-primary-soft p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-white text-primary">
            <CheckCheck className="size-4" />
          </span>
          <p className="text-[11px] font-semibold leading-tight text-primary-deep/70">
            Tasks completed
          </p>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-primary-deep">
          {pad(completed)}
        </p>
      </div>

      <div className="rounded-3xl bg-danger-soft p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-white text-danger">
            <AlarmClock className="size-4" />
          </span>
          <p className="text-[11px] font-semibold leading-tight text-danger/80">Tasks in progress</p>
        </div>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-danger">{pad(open)}</p>
      </div>
    </div>
  );
}
