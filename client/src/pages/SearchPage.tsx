import { ArrowLeft, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { DeleteTaskDialog } from "../features/tasks/DeleteTaskDialog";
import { TaskFormSheet } from "../features/tasks/TaskFormSheet";
import { TaskRow } from "../features/tasks/TaskRow";
import type { Task } from "../features/tasks/types";
import { useTaskSearch, useTasks, useUpdateTask } from "../hooks/use-tasks";

/** Search across task titles and descriptions. */
export function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);

  const allTasks = useTasks();
  const searchResults = useTaskSearch(deferredTerm);
  const updateTask = useUpdateTask();

  const [sheetTask, setSheetTask] = useState<Task | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const query = deferredTerm.trim();
  const activeQuery = query.length > 0 ? searchResults : allTasks;
  const results = activeQuery.data ?? [];
  const openCount = results.filter((task) => task.status === "in_progress").length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleStatus = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      changes: { status: task.status === "completed" ? "in_progress" : "completed" },
    });
  };

  return (
    <div className="min-h-dvh pb-16">
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/app")}
            aria-label="Back to my tasks"
            className="grid size-10 shrink-0 place-items-center rounded-2xl text-ink transition hover:bg-surface"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") navigate("/app");
              }}
              placeholder="Search for a task"
              aria-label="Search for a task"
              autoComplete="off"
              className="h-11 w-full rounded-2xl border border-line bg-white pl-10 pr-9 text-sm font-medium text-ink shadow-card outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-primary [&::-webkit-search-cancel-button]:hidden"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/app")}
            className="shrink-0 px-1 text-sm font-bold text-primary transition hover:text-primary-strong"
          >
            Done
          </button>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">
              {query ? "Search results" : "All tasks"}
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              {query
                ? `${results.length} match${results.length === 1 ? "" : "es"} for "${query}"`
                : `${results.length} task${results.length === 1 ? "" : "s"} · ${openCount} still open`}
            </p>
          </div>
          {activeQuery.isFetching && (
            <span className="text-[11px] font-semibold text-muted">Searching…</span>
          )}
        </div>

        {activeQuery.isPending ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-16 animate-pulse rounded-2xl bg-white shadow-card" />
            ))}
          </div>
        ) : activeQuery.isError ? (
          <div className="mt-10 text-center">
            <p className="text-sm font-bold">Search is unavailable right now</p>
            <p className="mt-1 text-xs text-muted">{activeQuery.error.message}</p>
            <button
              type="button"
              onClick={() => void activeQuery.refetch()}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={query ? "No tasks match that search" : "No tasks yet"}
              message={
                query
                  ? "Try another word, or check the description of the task you are looking for."
                  : "Create a task from the home screen and it will show up here."
              }
              actionLabel={query ? "Clear search" : "Back to my tasks"}
              onAction={() => (query ? setTerm("") : navigate("/app"))}
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {results.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showDate
                onToggle={toggleStatus}
                onEdit={setSheetTask}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}
      </div>

      <TaskFormSheet
        open={sheetTask !== undefined}
        task={sheetTask}
        onClose={() => setSheetTask(undefined)}
        onRequestDelete={(task) => {
          setSheetTask(undefined);
          setDeleteTarget(task);
        }}
      />

      <DeleteTaskDialog task={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
