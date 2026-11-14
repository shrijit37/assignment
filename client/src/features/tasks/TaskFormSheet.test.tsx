import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskFormSheet } from "./TaskFormSheet";

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <TaskFormSheet open onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("TaskFormSheet", () => {
  it("opens with the create task heading", () => {
    renderSheet();

    expect(screen.getByRole("dialog", { name: "Add new task" })).toBeInTheDocument();
    expect(screen.getByLabelText("Task title")).toHaveValue("");
    expect(screen.getByLabelText("Date")).not.toHaveValue("");
  });

  it("blocks submission when the title is empty", async () => {
    renderSheet();

    await userEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Give this task a short title")).toBeInTheDocument();
  });

  it("rejects an end time that is not after the start time", async () => {
    renderSheet();

    await userEvent.type(screen.getByLabelText("Task title"), "Finish the report");
    await userEvent.clear(screen.getByLabelText("Start"));
    await userEvent.type(screen.getByLabelText("Start"), "10:00");
    await userEvent.type(screen.getByLabelText(/^Ends/), "09:00");
    await userEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("End time must be after the start time")).toBeInTheDocument();
  });
});
