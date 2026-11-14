import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, fetchTasks, updateTask } from "../api/tasks";
import type { Task, TaskInput } from "../features/tasks/types";

export const taskKeys = {
  all: ["tasks"] as const,
  search: (term: string) => ["tasks", "search", term] as const,
};

/** Loads every task, ordered by date. */
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: () => fetchTasks(),
  });
}

/**
 * Loads tasks matching `term` from the API. Keeps showing the previous result
 * while the next keystroke is in flight.
 *
 * @param term Search term.
 */
export function useTaskSearch(term: string) {
  const queryClient = useQueryClient();
  const trimmed = term.trim();

  return useQuery({
    queryKey: taskKeys.search(trimmed),
    queryFn: () => fetchTasks({ search: trimmed }),
    enabled: trimmed.length > 0,
    placeholderData: () => queryClient.getQueryData<Task[]>(taskKeys.all)?.filter((task) => {
      const haystack = `${task.title} ${task.description}`.toLowerCase();
      return haystack.includes(trimmed.toLowerCase());
    }),
  });
}

/** Creates a task, then refreshes the cached lists. */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

interface UpdateVariables {
  id: string;
  changes: Partial<TaskInput>;
}

/**
 * Updates a task. The cached list is patched immediately so toggling a status
 * feels instant, and rolled back if the request fails.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: UpdateVariables) => updateTask(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (tasks) =>
        tasks?.map((task) =>
          task.id === id ? { ...task, ...changes, updatedAt: new Date().toISOString() } : task,
        ),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

/** Deletes a task and drops it from the cached list right away. */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (tasks) =>
        tasks?.filter((task) => task.id !== id),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
