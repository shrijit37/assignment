import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatLongDay, formatWeekRange, isSameWeek, weekDays } from "../../lib/week";

export interface WeekStripProps {
  selected: Date;
  onSelect: (date: Date) => void;
  hasTasks: (date: Date) => boolean;
}

/** Monday-to-Sunday day picker with week navigation. */
export function WeekStrip({ selected, onSelect, hasTasks }: WeekStripProps) {
  const days = weekDays(selected);
  const selectedKey = format(selected, "yyyy-MM-dd");
  const caption = isSameWeek(selected, new Date()) ? "This week" : "Selected week";

  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {caption}
          </p>
          <p className="truncate text-sm font-bold">{formatWeekRange(selected)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(addDays(selected, -7))}
            aria-label="Previous week"
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(addDays(selected, 7))}
            aria-label="Next week"
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isSelected = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={formatLongDay(day)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 transition",
                isSelected
                  ? "bg-primary text-white shadow-float"
                  : "text-muted hover:bg-surface hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wide",
                  isSelected ? "text-white/75" : "text-muted/80",
                )}
              >
                {format(day, "EEE")}
              </span>
              <span className="text-sm font-bold">{format(day, "d")}</span>
              <span
                className={cn(
                  "size-1 rounded-full",
                  hasTasks(day) ? (isSelected ? "bg-white" : "bg-primary") : "bg-transparent",
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
