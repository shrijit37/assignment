import type { Task, TaskInput, TaskStatus } from "../features/tasks/types";
import { apiRequest } from "./http";

interface TaskListResponse {
  data: Task[];
}

interface TaskResponse {
  data: Task;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
}

/**
 * Fetches tasks, optionally narrowed down by a search term or status.
 *
 * @param filters Optional search/status filters.
 */
export async function fetchTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);

  const query = params.toString();
  const response = await apiRequest<TaskListResponse>(`/tasks${query ? `?${query}` : ""}`);

  return response.data;
}

/** Creates a task and returns the stored record. */
export async function createTask(input: TaskInput): Promise<Task> {
  const response = await apiRequest<TaskResponse>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

/** Applies a partial update to a task. */
export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const response = await apiRequest<TaskResponse>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

/** Permanently removes a task. */
export async function deleteTask(id: string): Promise<void> {
  await apiRequest<void>(`/tasks/${id}`, { method: "DELETE" });
}
