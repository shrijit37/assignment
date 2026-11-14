import { Check, Clock, Pencil, Trash } from "lucide-react";
import { cn } from "../../lib/cn";
import { useSwipeToReveal } from "../../hooks/use-swipe-to-reveal";
import { formatDayLabel, formatTimeRange } from "../../lib/week";
import { PriorityBadge } from "./PriorityBadge";
import type { Task } from "./types";

export interface TaskRowProps {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  showDate?: boolean;
}

/**
 * One task: a completion checkbox, its details, quick edit and delete. On touch
 * screens the row can be swiped left to uncover a delete button.
 */
export function TaskRow({ task, onToggle, onEdit, onDelete, showDate = false }: TaskRowProps) {
  const swipe = useSwipeToReveal();
  const completed = task.status === "completed";
  const time = formatTimeRange(task);

  return (
    <li className="relative overflow-hidden rounded-2xl bg-white">
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-[92px] items-center justify-center rounded-r-2xl bg-danger transition-transform duration-200",
          swipe.open || swipe.dragging ? "visible" : "invisible",
        )}
        style={{ transform: `translateX(${92 + swipe.offset}px)` }}
      >
        <button
          type="button"
          onClick={() => {
            swipe.close();
            onDelete(task);
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white"
          aria-hidden={!swipe.open}
          tabIndex={swipe.open ? 0 : -1}
        >
          <Trash className="size-4" />
          Delete
        </button>
      </div>

      <div
        {...swipe.handlers}
        style={{ transform: `translateX(${swipe.offset}px)` }}
        className={cn(
          "group relative flex touch-pan-y items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card",
          swipe.dragging ? "transition-none" : "transition-transform duration-200",
        )}
      >
        <label className="relative grid size-[22px] shrink-0 place-items-center">
          <input
            type="checkbox"
            checked={completed}
            onChange={() => onToggle(task)}
            aria-label={completed ? `Mark ${task.title} as in progress` : `Mark ${task.title} as completed`}
            className="absolute inset-0 size-full cursor-pointer appearance-none rounded-lg border-2 border-[#cdd2e4] transition checked:border-primary checked:bg-primary"
          />
          <Check
            className={cn(
              "pointer-events-none size-3.5 text-white transition",
              completed ? "opacity-100" : "opacity-0",
            )}
            strokeWidth={3.5}
          />
        </label>

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left"
          aria-label={`Open ${task.title}`}
        >
          <span
            className={cn(
              "block truncate text-sm font-semibold",
              completed && "text-muted line-through",
            )}
          >
            {task.title}
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {showDate ? `${formatDayLabel(new Date(task.scheduledAt))} · ${time}` : time}
            </span>
            {task.priority && <PriorityBadge priority={task.priority} />}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="grid size-8 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-primary-soft hover:text-primary"
        >
          <Pencil className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="grid size-8 shrink-0 place-items-center rounded-xl text-muted opacity-0 transition hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 md:opacity-100"
        >
          <Trash className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
