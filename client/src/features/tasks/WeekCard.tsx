import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { cn } from "../../lib/cn";
import { formatWeekRange, type WeekGroup } from "../../lib/week";
import { TaskRow } from "./TaskRow";
import type { Task } from "./types";

export interface WeekCardProps {
  group: WeekGroup;
  isCurrent: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

/** Collapsible summary of one Monday-to-Sunday week and its tasks. */
export function WeekCard({
  group,
  isCurrent,
  expanded,
  onToggle,
  onEditTask,
  onToggleTask,
  onDeleteTask,
}: WeekCardProps) {
  const panelId = useId();
  const percent = group.total === 0 ? 0 : Math.round((group.completedCount / group.total) * 100);

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-surface/60"
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="min-w-0 break-words">{formatWeekRange(group.start)}</span>
              {isCurrent && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  This week
                </span>
              )}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-medium text-muted">
              <span>{group.openCount} in progress</span>
              <span aria-hidden="true">·</span>
              <span>{group.completedCount} completed</span>
            </span>
            <span className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-[#e8e9f6]">
              <span
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
                aria-hidden="true"
              />
            </span>
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </h3>

      <div id={panelId} hidden={!expanded} className="border-t border-line px-3 pb-3 pt-3">
        {group.tasks.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted">No tasks this week.</p>
        ) : (
          <ul className="space-y-2">
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showDate
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
