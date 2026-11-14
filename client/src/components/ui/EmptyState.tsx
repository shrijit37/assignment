import { CalendarPlus } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly placeholder for lists with nothing to show. */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-white/70 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <CalendarPlus className="size-5" />
      </span>
      <p className="mt-4 text-sm font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
