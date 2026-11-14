import { Dialog } from "./Dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small confirmation step for destructive actions such as deleting a task. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  pending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-2xl border border-line text-sm font-semibold text-ink transition hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="h-11 flex-1 rounded-2xl bg-danger text-sm font-semibold text-white transition hover:bg-[#cf3a40] disabled:opacity-60"
          >
            {pending ? "Deleting..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{message}</p>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </Dialog>
  );
}
