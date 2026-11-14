import { useEffect, useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useDeleteTask } from "../../hooks/use-tasks";
import type { Task } from "./types";

export interface DeleteTaskDialogProps {
  task: Task | null;
  onClose: () => void;
}

/** Asks for confirmation before a task is deleted. */
export function DeleteTaskDialog({ task, onClose }: DeleteTaskDialogProps) {
  const mutation = useDeleteTask();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [task?.id]);

  const handleConfirm = () => {
    if (!task) return;
    setError(null);

    mutation.mutate(task.id, {
      onSuccess: onClose,
      onError: (cause) =>
        setError(cause instanceof Error ? cause.message : "Could not delete this task."),
    });
  };

  return (
    <ConfirmDialog
      open={task !== null}
      title="Delete this task?"
      message={`"${task?.title ?? ""}" will be removed from your week. This cannot be undone.`}
      pending={mutation.isPending}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
