import { addDays, endOfDay, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import type { Task } from "../features/tasks/types";

/** Tasks that share a Monday. */
export interface WeekGroup {
  key: string;
  start: Date;
  end: Date;
  tasks: Task[];
  openCount: number;
  completedCount: number;
  total: number;
}

/** Start of the week that contains `date`. Weeks run Monday to Sunday. */
export function startOfWeekMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** Last millisecond of the Sunday that closes the week containing `date`. */
export function endOfWeekSunday(date: Date): Date {
  return endOfDay(addDays(startOfWeekMonday(date), 6));
}

/** Stable identifier for the week containing `date`, e.g. `2024-03-11`. */
export function weekKey(date: Date): string {
  return format(startOfWeekMonday(date), "yyyy-MM-dd");
}

/** All seven days of the week containing `date`, Monday first. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** True when both dates fall in the same Monday-to-Sunday week. */
export function isSameWeek(a: Date, b: Date): boolean {
  return weekKey(a) === weekKey(b);
}

/** True when `date` is the current calendar day. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Human readable range for the week containing `date`, e.g.
 * `March 10 - 16, 2024`.
 */
export function formatWeekRange(date: Date): string {
  const start = startOfWeekMonday(date);
  const end = addDays(start, 6);

  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "MMMM d")} - ${format(end, "d, yyyy")}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }

  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

/** Groups tasks into Monday-to-Sunday buckets with their open/done counts. */
export function groupTasksByWeek(tasks: Task[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>();

  for (const task of tasks) {
    const scheduled = new Date(task.scheduledAt);
    const key = weekKey(scheduled);
    let group = groups.get(key);

    if (!group) {
      group = {
        key,
        start: startOfWeekMonday(scheduled),
        end: endOfWeekSunday(scheduled),
        tasks: [],
        openCount: 0,
        completedCount: 0,
        total: 0,
      };
      groups.set(key, group);
    }

    group.tasks.push(task);
  }

  for (const group of groups.values()) {
    group.tasks.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    group.total = group.tasks.length;
    group.completedCount = group.tasks.filter((task) => task.status === "completed").length;
    group.openCount = group.total - group.completedCount;
  }

  return [...groups.values()];
}

/**
 * Orders weeks for display: the week containing `reference` first, then the
 * upcoming weeks, then the past ones.
 */
export function sortWeekGroups(groups: WeekGroup[], reference: Date = new Date()): WeekGroup[] {
  const currentKey = weekKey(reference);

  return [...groups].sort((a, b) => {
    if (a.key === b.key) return 0;
    if (a.key === currentKey) return -1;
    if (b.key === currentKey) return 1;

    const aIsFuture = a.start.getTime() > reference.getTime();
    const bIsFuture = b.start.getTime() > reference.getTime();

    if (aIsFuture && bIsFuture) return a.start.getTime() - b.start.getTime();
    if (!aIsFuture && !bIsFuture) return b.start.getTime() - a.start.getTime();
    return aIsFuture ? -1 : 1;
  });
}

/** Open, completed and percentage totals for the week containing `date`. */
export function weekTotals(tasks: Task[], date: Date): { open: number; completed: number; total: number; percent: number } {
  const weekly = tasks.filter((task) => isSameWeek(new Date(task.scheduledAt), date));
  const completed = weekly.filter((task) => task.status === "completed").length;
  const total = weekly.length;

  return {
    open: total - completed,
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/** Tasks scheduled on the calendar day that contains `date`. */
export function tasksOnDay(tasks: Task[], date: Date): Task[] {
  return tasks
    .filter((task) => isSameDay(new Date(task.scheduledAt), date))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/** Combines a `yyyy-MM-dd` value and an `HH:mm` value into a local `Date`. */
export function toLocalDate(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0, 0);
}

/** `HH:mm` for an ISO timestamp, in the browser's timezone. */
export function toTimeInput(iso: string | null): string {
  return iso ? format(new Date(iso), "HH:mm") : "";
}

/** `yyyy-MM-dd` for an ISO timestamp, in the browser's timezone. */
export function toDateInput(iso: string | null): string {
  return iso ? format(new Date(iso), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
}

/** `09:00` for an ISO timestamp. */
export function formatTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

/** `09:00 - 10:30`, or just the start time when there is no end. */
export function formatTimeRange(task: Task): string {
  const start = formatTime(task.scheduledAt);
  return task.endsAt ? `${start} - ${formatTime(task.endsAt)}` : start;
}

/** `Wed, 13 Mar` for a date. */
export function formatDayLabel(date: Date): string {
  return format(date, "EEE, d MMM");
}

/** `Wednesday, 13 March` for a date. */
export function formatLongDay(date: Date): string {
  return format(date, "EEEE, d MMMM");
}

/** Start of `date`, used when comparing calendar days. */
export function startOfDayLocal(date: Date): Date {
  return startOfDay(date);
}
