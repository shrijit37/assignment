import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../models/task.model.js";

/**
 * Request body accepted by `POST /api/tasks`. Everything except the title and
 * the start date/time is optional, matching the brief.
 */
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional(),
  scheduledAt: z.coerce.date({ error: "Start date and time is required" }),
  endsAt: z.coerce.date().nullish(),
  priority: z.enum(TASK_PRIORITIES).nullish(),
  status: z.enum(TASK_STATUSES).optional(),
});

/** Every field is optional, but at least one has to be present. */
export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Query string accepted by `GET /api/tasks`.
 */
export const listTasksQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
