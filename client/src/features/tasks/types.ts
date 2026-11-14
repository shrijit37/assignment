export type TaskStatus = "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

/** A task as returned by the API. */
export interface Task {
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

/** Payload accepted by `POST /api/tasks` and `PATCH /api/tasks/:id`. */
export interface TaskInput {
  title: string;
  description?: string;
  scheduledAt: string;
  endsAt?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus;
}

/** Every value the task form can produce, including the "no priority" choice. */
export type PriorityChoice = TaskPriority | "none";

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
