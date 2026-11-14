import { CheckCheck, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { DeleteTaskDialog } from "../features/tasks/DeleteTaskDialog";
import { SummaryCards } from "../features/tasks/SummaryCards";
import { TaskFormSheet } from "../features/tasks/TaskFormSheet";
import { TaskRow } from "../features/tasks/TaskRow";
import { WeekCard } from "../features/tasks/WeekCard";
import { WeekStrip } from "../features/tasks/WeekStrip";
import { WeeklyProgress } from "../features/tasks/WeeklyProgress";
import type { Task } from "../features/tasks/types";
import { useTasks, useUpdateTask } from "../hooks/use-tasks";
import {
  formatLongDay,
  groupTasksByWeek,
  isToday,
  sortWeekGroups,
  startOfDayLocal,
  tasksOnDay,
  weekKey,
  weekTotals,
} from "../lib/week";

/** Weekly planner: day picker, counters, progress and every task by week. */
export function HomePage() {
  const tasksQuery = useTasks();
  const updateTask = useUpdateTask();

  const [selected, setSelected] = useState(() => startOfDayLocal(new Date()));
  const [sheetTask, setSheetTask] = useState<Task | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [weekOverrides, setWeekOverrides] = useState<Record<string, boolean>>({});

  const tasks = tasksQuery.data ?? [];
  const groups = useMemo(() => sortWeekGroups(groupTasksByWeek(tasks)), [tasks]);
  const totals = useMemo(() => weekTotals(tasks, selected), [tasks, selected]);
  const dayTasks = useMemo(() => tasksOnDay(tasks, selected), [tasks, selected]);
  const currentWeek = weekKey(selected);
  const isSelectedToday = isToday(selected);

  const isWeekExpanded = (key: string): boolean => weekOverrides[key] ?? key === currentWeek;

  const toggleWeek = (key: string) => {
    setWeekOverrides((current) => ({ ...current, [key]: !isWeekExpanded(key) }));
  };

  const toggleStatus = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      changes: { status: task.status === "completed" ? "in_progress" : "completed" },
    });
  };

  const openCreate = () => setSheetTask(null);
  const closeSheet = () => setSheetTask(undefined);

  const dayHeading = isSelectedToday ? "Today's tasks" : formatLongDay(selected);
  const openTaskCount = dayTasks.filter((task) => task.status === "in_progress").length;

  return (
    <div className="min-h-dvh pb-28 lg:pb-14">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-white shadow-float">
              <CheckCheck className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {formatLongDay(selected)}
              </p>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">My tasks</h1>
            </div>
          </div>

          <div className="hidden md:block">
            <Button onClick={openCreate} className="h-11">
              <Plus className="size-4" />
              New task
            </Button>
          </div>
        </header>

        {tasksQuery.isPending ? (
          <HomeSkeleton />
        ) : tasksQuery.isError ? (
          <div className="mx-auto mt-16 max-w-sm text-center">
            <p className="text-sm font-bold">Could not load your tasks</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{tasksQuery.error.message}</p>
            <Button onClick={() => void tasksQuery.refetch()} className="mt-5">
              Try again
            </Button>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-7">
            <div className="space-y-4 lg:sticky lg:top-6">
              <WeekStrip
                selected={selected}
                onSelect={setSelected}
                hasTasks={(day) => tasksOnDay(tasks, day).length > 0}
              />
              <SummaryCards completed={totals.completed} open={totals.open} />
              <WeeklyProgress
                percent={totals.percent}
                completed={totals.completed}
                total={totals.total}
              />
            </div>

            <div className="space-y-7">
              <section aria-labelledby="day-heading">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 id="day-heading" className="text-base font-bold">
                      {dayHeading}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {dayTasks.length === 0
                        ? "Nothing scheduled"
                        : `${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"} · ${openTaskCount} still open`}
                    </p>
                  </div>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      title="Nothing planned for this day"
                      message="Add a task with a title and a time, and it will show up in this week."
                    />
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {dayTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={toggleStatus}
                        onEdit={setSheetTask}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="weeks-heading">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 id="weeks-heading" className="text-base font-bold">
                      Weekly overview
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Mondays to Sundays, newest first
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {groups.length} {groups.length === 1 ? "week" : "weeks"}
                  </span>
                </div>

                {groups.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      title="Your week is empty"
                      message="Create your first task and it will be grouped into the week it belongs to."
                      actionLabel="Create a task"
                      onAction={openCreate}
                    />
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {groups.map((group) => (
                      <WeekCard
                        key={group.key}
                        group={group}
                        isCurrent={group.key === weekKey(new Date())}
                        expanded={isWeekExpanded(group.key)}
                        onToggle={() => toggleWeek(group.key)}
                        onEditTask={setSheetTask}
                        onToggleTask={toggleStatus}
                        onDeleteTask={setDeleteTarget}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-5 z-30 md:hidden">
        <button
          type="button"
          onClick={openCreate}
          aria-label="Add a task"
          className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-float transition hover:bg-primary-strong active:translate-y-px"
        >
          <Plus className="size-6" />
        </button>
      </div>

      <TaskFormSheet
        open={sheetTask !== undefined}
        task={sheetTask}
        onClose={closeSheet}
        onRequestDelete={(task) => {
          closeSheet();
          setDeleteTarget(task);
        }}
      />

      <DeleteTaskDialog task={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="mt-5 grid animate-pulse gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-7">
      <div className="space-y-4">
        <div className="h-[132px] rounded-3xl bg-white shadow-card" />
        <div className="h-[108px] rounded-3xl bg-white shadow-card" />
        <div className="h-[104px] rounded-3xl bg-white shadow-card" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-40 rounded-full bg-[#eceef7]" />
        <div className="h-16 rounded-2xl bg-white shadow-card" />
        <div className="h-16 rounded-2xl bg-white shadow-card" />
        <div className="h-16 rounded-2xl bg-white shadow-card" />
      </div>
    </div>
  );
}
