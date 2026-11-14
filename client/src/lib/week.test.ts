import { describe, expect, it } from "vitest";
import type { Task } from "../features/tasks/types";
import {
  formatTimeRange,
  formatWeekRange,
  groupTasksByWeek,
  isSameWeek,
  sortWeekGroups,
  startOfWeekMonday,
  tasksOnDay,
  toLocalDate,
  weekDays,
  weekKey,
  weekTotals,
} from "./week";

const makeTask = (overrides: Partial<Task> & Pick<Task, "scheduledAt">): Task => ({
  id: overrides.id ?? "task-1",
  title: overrides.title ?? "Task",
  description: overrides.description ?? "",
  scheduledAt: overrides.scheduledAt,
  endsAt: overrides.endsAt ?? null,
  priority: overrides.priority ?? null,
  status: overrides.status ?? "in_progress",
  createdAt: "2024-03-01T00:00:00.000Z",
  updatedAt: "2024-03-01T00:00:00.000Z",
});

describe("startOfWeekMonday", () => {
  it("returns Monday for a Wednesday", () => {
    expect(startOfWeekMonday(new Date(2024, 2, 13))).toEqual(new Date(2024, 2, 11));
  });

  it("keeps Monday in the same week", () => {
    expect(startOfWeekMonday(new Date(2024, 2, 11, 18))).toEqual(new Date(2024, 2, 11));
  });

  it("groups Sunday with the Monday before it", () => {
    expect(startOfWeekMonday(new Date(2024, 2, 17, 23))).toEqual(new Date(2024, 2, 11));
  });

  it("handles a Sunday that falls on a month boundary", () => {
    expect(startOfWeekMonday(new Date(2024, 2, 31))).toEqual(new Date(2024, 2, 25));
  });
});

describe("weekDays", () => {
  it("returns seven consecutive days starting on Monday", () => {
    const days = weekDays(new Date(2024, 2, 13));

    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(new Date(2024, 2, 11));
    expect(days[6]).toEqual(new Date(2024, 2, 17));
  });
});

describe("weekKey", () => {
  it("is stable for every day of the same week", () => {
    expect(weekKey(new Date(2024, 2, 11))).toBe("2024-03-11");
    expect(weekKey(new Date(2024, 2, 15))).toBe("2024-03-11");
    expect(weekKey(new Date(2024, 2, 17))).toBe("2024-03-11");
    expect(weekKey(new Date(2024, 2, 18))).toBe("2024-03-18");
  });
});

describe("isSameWeek", () => {
  it("matches dates inside the same week only", () => {
    expect(isSameWeek(new Date(2024, 2, 11), new Date(2024, 2, 17))).toBe(true);
    expect(isSameWeek(new Date(2024, 2, 17), new Date(2024, 2, 18))).toBe(false);
  });
});

describe("formatWeekRange", () => {
  it("uses a single month when both ends share it", () => {
    expect(formatWeekRange(new Date(2024, 2, 13))).toBe("March 11 - 17, 2024");
  });

  it("names both months when the week spans two", () => {
    expect(formatWeekRange(new Date(2024, 3, 30))).toBe("Apr 29 - May 5, 2024");
  });

  it("names both years when the week spans two", () => {
    expect(formatWeekRange(new Date(2024, 11, 30))).toBe("Dec 30, 2024 - Jan 5, 2025");
  });
});

describe("groupTasksByWeek", () => {
  const tasks: Task[] = [
    makeTask({ id: "a", scheduledAt: new Date(2024, 2, 13, 9).toISOString(), status: "completed" }),
    makeTask({ id: "b", scheduledAt: new Date(2024, 2, 13, 8).toISOString() }),
    makeTask({ id: "c", scheduledAt: new Date(2024, 2, 18, 10).toISOString() }),
    makeTask({ id: "d", scheduledAt: new Date(2024, 2, 17, 10).toISOString() }),
  ];

  it("creates one group per Monday-to-Sunday week", () => {
    const groups = groupTasksByWeek(tasks);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.key).sort()).toEqual(["2024-03-11", "2024-03-18"]);
  });

  it("counts open and completed tasks per week", () => {
    const [firstWeek] = groupTasksByWeek(tasks);

    expect(firstWeek?.total).toBe(3);
    expect(firstWeek?.completedCount).toBe(1);
    expect(firstWeek?.openCount).toBe(2);
  });

  it("sorts tasks inside a week by start time", () => {
    const [firstWeek] = groupTasksByWeek(tasks);

    expect(firstWeek?.tasks.map((task) => task.id)).toEqual(["b", "a", "d"]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupTasksByWeek([])).toEqual([]);
  });
});

describe("sortWeekGroups", () => {
  const reference = new Date(2024, 2, 13);
  const tasks = [
    makeTask({ id: "past", scheduledAt: new Date(2024, 2, 5, 9).toISOString() }),
    makeTask({ id: "current", scheduledAt: new Date(2024, 2, 13, 9).toISOString() }),
    makeTask({ id: "next", scheduledAt: new Date(2024, 2, 20, 9).toISOString() }),
  ];

  it("puts the current week first, then upcoming, then past", () => {
    const keys = sortWeekGroups(groupTasksByWeek(tasks), reference).map((group) => group.key);

    expect(keys[0]).toBe("2024-03-11");
    expect(keys[1]).toBe("2024-03-18");
    expect(keys[2]).toBe("2024-03-04");
  });
});

describe("weekTotals", () => {
  it("summarises the selected week", () => {
    const tasks = [
      makeTask({ id: "a", scheduledAt: new Date(2024, 2, 12, 9).toISOString(), status: "completed" }),
      makeTask({ id: "b", scheduledAt: new Date(2024, 2, 14, 9).toISOString() }),
      makeTask({ id: "c", scheduledAt: new Date(2024, 2, 25, 9).toISOString() }),
    ];

    expect(weekTotals(tasks, new Date(2024, 2, 13))).toEqual({
      open: 1,
      completed: 1,
      total: 2,
      percent: 50,
    });
  });

  it("reports zero percent for an empty week", () => {
    expect(weekTotals([], new Date(2024, 2, 13)).percent).toBe(0);
  });
});

describe("tasksOnDay", () => {
  it("keeps only tasks on the given day, ordered by time", () => {
    const tasks = [
      makeTask({ id: "late", scheduledAt: new Date(2024, 2, 13, 16).toISOString() }),
      makeTask({ id: "early", scheduledAt: new Date(2024, 2, 13, 8).toISOString() }),
      makeTask({ id: "other", scheduledAt: new Date(2024, 2, 14, 8).toISOString() }),
    ];

    expect(tasksOnDay(tasks, new Date(2024, 2, 13)).map((task) => task.id)).toEqual([
      "early",
      "late",
    ]);
  });
});

describe("formatTimeRange", () => {
  it("shows a start and end time when both exist", () => {
    const task = makeTask({
      scheduledAt: new Date(2024, 2, 13, 9).toISOString(),
      endsAt: new Date(2024, 2, 13, 10, 30).toISOString(),
    });

    expect(formatTimeRange(task)).toBe("09:00 - 10:30");
  });

  it("shows only the start time when there is no end", () => {
    const task = makeTask({ scheduledAt: new Date(2024, 2, 13, 9).toISOString() });

    expect(formatTimeRange(task)).toBe("09:00");
  });
});

describe("toLocalDate", () => {
  it("combines a date and a time into a local date", () => {
    expect(toLocalDate("2024-03-13", "09:30")).toEqual(new Date(2024, 2, 13, 9, 30));
  });
});
