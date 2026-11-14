import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "../../api/http";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Field, inputClasses, invalidClasses } from "../../components/ui/Field";
import { useCreateTask, useUpdateTask } from "../../hooks/use-tasks";
import { cn } from "../../lib/cn";
import { toDateInput, toLocalDate, toTimeInput } from "../../lib/week";
import { PRIORITY_LABELS, type PriorityChoice, type Task } from "./types";

const formSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give this task a short title")
      .max(120, "Titles can be up to 120 characters"),
    date: z.string().min(1, "Pick a date"),
    startTime: z.string().min(1, "Pick a start time"),
    endTime: z.string(),
    priority: z.enum(["none", "low", "medium", "high"]),
    description: z.string().max(1000, "Descriptions can be up to 1000 characters"),
  })
  .superRefine((values, ctx) => {
    if (values.endTime && values.startTime && values.endTime <= values.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after the start time",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const PRIORITY_OPTIONS: PriorityChoice[] = ["none", "low", "medium", "high"];

const PRIORITY_STYLES: Record<PriorityChoice, string> = {
  none: "data-[active=true]:bg-ink data-[active=true]:text-white",
  low: "data-[active=true]:bg-emerald-500 data-[active=true]:text-white",
  medium: "data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  high: "data-[active=true]:bg-rose-500 data-[active=true]:text-white",
};

function defaultValuesFor(task?: Task | null): FormValues {
  const now = new Date();
  const step = 15 * 60_000;
  const nextSlot = new Date(Math.ceil(now.getTime() / step) * step);

  return {
    title: task?.title ?? "",
    date: toDateInput(task?.scheduledAt ?? null),
    startTime: task ? toTimeInput(task.scheduledAt) : format(nextSlot, "HH:mm"),
    endTime: toTimeInput(task?.endsAt ?? null),
    priority: task?.priority ?? "none",
    description: task?.description ?? "",
  };
}

export interface TaskFormSheetProps {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onRequestDelete?: (task: Task) => void;
}

/**
 * Bottom sheet used for both creating and editing a task. The same form backs
 * both flows so validation and field behaviour cannot drift apart.
 */
export function TaskFormSheet({ open, task, onClose, onRequestDelete }: TaskFormSheetProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValuesFor(task),
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValuesFor(task));
    setFormError(null);
  }, [open, task, reset]);

  const priority = watch("priority");
  const pending = createTask.isPending || updateTask.isPending || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const scheduledAt = toLocalDate(values.date, values.startTime);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("date", { message: "Pick a valid date" });
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      scheduledAt: scheduledAt.toISOString(),
      endsAt: values.endTime ? toLocalDate(values.date, values.endTime).toISOString() : null,
      priority: values.priority === "none" ? null : values.priority,
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, changes: payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onClose();
    } catch (cause) {
      if (cause instanceof ApiError) {
        const fields = cause.fields ?? {};
        const targets: Record<string, keyof FormValues> = {
          title: "title",
          description: "description",
          scheduledAt: "date",
          endsAt: "endTime",
        };
        let mapped = false;

        for (const [field, messages] of Object.entries(fields)) {
          const message = messages[0];
          const target = targets[field];
          if (!message || !target) continue;
          setError(target, { message });
          mapped = true;
        }

        if (!mapped) setFormError(cause.message);
        return;
      }

      setFormError("Something went wrong while saving. Please try again.");
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "Add new task"}
      description={
        task ? "Update the details and save your changes." : "Plan it now, tick it off later."
      }
      footer={
        <div className="flex items-center gap-3">
          {task && onRequestDelete && (
            <Button
              variant="ghost"
              onClick={() => onRequestDelete(task)}
              className="text-danger hover:bg-danger-soft hover:text-danger"
            >
              <Trash className="size-4" />
              Delete
            </Button>
          )}
          <Button
            type="submit"
            form="task-form"
            disabled={pending}
            className="h-12 flex-1 rounded-2xl text-sm"
          >
            {pending ? "Saving..." : task ? "Save changes" : "Create task"}
          </Button>
        </div>
      }
    >
      <form id="task-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Task title" htmlFor="task-title" error={errors.title?.message}>
          <input
            id="task-title"
            data-autofocus
            placeholder="Doing homework"
            autoComplete="off"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "task-title-error" : undefined}
            className={cn(inputClasses, invalidClasses(Boolean(errors.title)))}
            {...register("title")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" htmlFor="task-start" error={errors.startTime?.message}>
            <input
              id="task-start"
              type="time"
              aria-invalid={Boolean(errors.startTime)}
              aria-describedby={errors.startTime ? "task-start-error" : undefined}
              className={cn(inputClasses, invalidClasses(Boolean(errors.startTime)))}
              {...register("startTime")}
            />
          </Field>

          <Field label="Ends" htmlFor="task-end" error={errors.endTime?.message} optional>
            <input
              id="task-end"
              type="time"
              aria-invalid={Boolean(errors.endTime)}
              aria-describedby={errors.endTime ? "task-end-error" : undefined}
              className={cn(inputClasses, invalidClasses(Boolean(errors.endTime)))}
              {...register("endTime")}
            />
          </Field>
        </div>

        <Field label="Date" htmlFor="task-date" error={errors.date?.message}>
          <input
            id="task-date"
            type="date"
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "task-date-error" : undefined}
            className={cn(inputClasses, invalidClasses(Boolean(errors.date)))}
            {...register("date")}
          />
        </Field>

        <Field label="Priority" optional>
          <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option}
                id={`task-priority-${option}`}
                type="button"
                role="radio"
                aria-checked={priority === option}
                data-active={priority === option}
                onClick={() => setValue("priority", option, { shouldDirty: true })}
                className={cn(
                  "rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-ink",
                  PRIORITY_STYLES[option],
                )}
              >
                {option === "none" ? "None" : PRIORITY_LABELS[option]}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Description"
          htmlFor="task-description"
          error={errors.description?.message}
          optional
        >
          <textarea
            id="task-description"
            rows={3}
            placeholder="Add a description"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "task-description-error" : undefined}
            className={cn(inputClasses, "resize-none", invalidClasses(Boolean(errors.description)))}
            {...register("description")}
          />
        </Field>

        {formError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            {formError}
          </p>
        )}

        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Dialog>
  );
}
