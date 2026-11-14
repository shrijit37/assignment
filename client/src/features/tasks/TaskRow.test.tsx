import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "./types";
import { TaskRow } from "./TaskRow";

const task: Task = {
  id: "task-1",
  title: "Meeting with team",
  description: "Roadmap review",
  scheduledAt: new Date(2024, 2, 13, 9, 0).toISOString(),
  endsAt: new Date(2024, 2, 13, 10, 0).toISOString(),
  priority: "high",
  status: "in_progress",
  createdAt: "2024-03-01T00:00:00.000Z",
  updatedAt: "2024-03-01T00:00:00.000Z",
};

function renderRow(overrides: Partial<Parameters<typeof TaskRow>[0]> = {}) {
  const handlers = {
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  render(
    <ul>
      <TaskRow task={task} {...handlers} {...overrides} />
    </ul>,
  );

  return handlers;
}

describe("TaskRow", () => {
  it("shows the title, time range and priority", () => {
    renderRow();

    expect(screen.getByText("Meeting with team")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 10:00")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("calls onToggle when the checkbox is clicked", async () => {
    const handlers = renderRow();

    await userEvent.click(screen.getByRole("checkbox", { name: /as completed/i }));

    expect(handlers.onToggle).toHaveBeenCalledWith(task);
  });

  it("reflects a completed task", () => {
    renderRow({ task: { ...task, status: "completed" } });

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText("Meeting with team")).toHaveClass("line-through");
  });

  it("opens the editor from the pencil button", async () => {
    const handlers = renderRow();

    await userEvent.click(screen.getByRole("button", { name: "Edit Meeting with team" }));

    expect(handlers.onEdit).toHaveBeenCalledWith(task);
  });

  it("asks to delete from the row action", async () => {
    const handlers = renderRow();

    await userEvent.click(screen.getByRole("button", { name: "Delete Meeting with team" }));

    expect(handlers.onDelete).toHaveBeenCalledWith(task);
  });
});
