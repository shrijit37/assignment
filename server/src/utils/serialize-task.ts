import type { TaskDocument, TaskPriority, TaskStatus } from "../models/task.model.js";

/** Wire shape of a task returned by the API. */
export interface TaskDto {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  endsAt: string | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts a Mongoose document into the JSON payload the client consumes.
 *
 * @param task Task document.
 */
export function toTaskDto(task: TaskDocument): TaskDto {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    scheduledAt: task.scheduledAt.toISOString(),
    endsAt: task.endsAt ? task.endsAt.toISOString() : null,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
