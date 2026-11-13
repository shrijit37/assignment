import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { TaskModel } from "../src/models/task.model.js";

const app = createApp({ clientOrigin: "*" });
let mongo: MongoMemoryServer;

interface TaskPayload {
  title: string;
  description?: string;
  scheduledAt: string;
  endsAt?: string | null;
  priority?: "low" | "medium" | "high" | null;
  status?: "in_progress" | "completed";
}

const baseTask = (overrides: Partial<TaskPayload> = {}): TaskPayload => ({
  title: "Finish wireframes",
  scheduledAt: "2024-03-13T09:00:00.000Z",
  ...overrides,
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("todo-list-test"));
});

afterEach(async () => {
  await TaskModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("GET /api/health", () => {
  it("reports the API as healthy", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});

describe("POST /api/tasks", () => {
  it("creates a task with only the required fields", async () => {
    const response = await request(app).post("/api/tasks").send(baseTask());

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      title: "Finish wireframes",
      description: "",
      priority: null,
      endsAt: null,
      status: "in_progress",
    });
    expect(response.body.data.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it("stores every optional field", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send(
        baseTask({
          title: "  Team sync  ",
          description: "Weekly sync with the design team",
          endsAt: "2024-03-13T10:00:00.000Z",
          priority: "high",
          status: "completed",
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      title: "Team sync",
      description: "Weekly sync with the design team",
      priority: "high",
      status: "completed",
    });
  });

  it("rejects a missing title", async () => {
    const response = await request(app).post("/api/tasks").send({ scheduledAt: "2024-03-13T09:00:00.000Z" });

    expect(response.status).toBe(400);
    expect(response.body.fields.title).toBeDefined();
  });

  it("rejects a blank title", async () => {
    const response = await request(app).post("/api/tasks").send(baseTask({ title: "   " }));

    expect(response.status).toBe(400);
    expect(response.body.fields.title).toBeDefined();
  });

  it("rejects a missing start date", async () => {
    const response = await request(app).post("/api/tasks").send({ title: "No date" });

    expect(response.status).toBe(400);
    expect(response.body.fields.scheduledAt).toBeDefined();
  });

  it("rejects an unknown priority", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask(), priority: "urgent" });

    expect(response.status).toBe(400);
    expect(response.body.fields.priority).toBeDefined();
  });

  it("rejects an end time before the start time", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send(baseTask({ endsAt: "2024-03-13T08:00:00.000Z" }));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/after the start/i);
  });
});

describe("GET /api/tasks", () => {
  beforeEach(async () => {
    await TaskModel.create([
      { title: "Buy a cat food", description: "Whiskas", scheduledAt: new Date("2024-03-12T07:00:00.000Z") },
      { title: "Meeting with team", description: "Roadmap review", scheduledAt: new Date("2024-03-13T14:00:00.000Z") },
      {
        title: "Finish wireframes",
        description: "Onboarding flow",
        scheduledAt: new Date("2024-03-14T09:00:00.000Z"),
        status: "completed",
      },
    ]);
  });

  it("returns tasks ordered by scheduled date", async () => {
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);
    expect(response.body.data.map((task: { title: string }) => task.title)).toEqual([
      "Buy a cat food",
      "Meeting with team",
      "Finish wireframes",
    ]);
  });

  it("filters by status", async () => {
    const response = await request(app).get("/api/tasks").query({ status: "completed" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Finish wireframes");
  });

  it("searches titles and descriptions case-insensitively", async () => {
    const byTitle = await request(app).get("/api/tasks").query({ search: "MEETING" });
    const byDescription = await request(app).get("/api/tasks").query({ search: "whiskas" });

    expect(byTitle.body.data).toHaveLength(1);
    expect(byDescription.body.data).toHaveLength(1);
    expect(byDescription.body.data[0].title).toBe("Buy a cat food");
  });

  it("treats regular expression characters as plain text", async () => {
    const response = await request(app).get("/api/tasks").query({ search: ".*" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });

  it("filters by a date range", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .query({ from: "2024-03-13T00:00:00.000Z", to: "2024-03-13T23:59:59.999Z" });

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Meeting with team");
  });

  it("rejects an invalid status filter", async () => {
    const response = await request(app).get("/api/tasks").query({ status: "done" });

    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("edits the details of a task", async () => {
    const created = await request(app).post("/api/tasks").send(baseTask());

    const response = await request(app)
      .patch(`/api/tasks/${created.body.data.id}`)
      .send({ title: "Finish mobile wireframes", description: "All four screens" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      title: "Finish mobile wireframes",
      description: "All four screens",
    });
  });

  it("marks a task as completed", async () => {
    const created = await request(app).post("/api/tasks").send(baseTask());

    const response = await request(app)
      .patch(`/api/tasks/${created.body.data.id}`)
      .send({ status: "completed" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");
  });

  it("moves a task to another date", async () => {
    const created = await request(app).post("/api/tasks").send(baseTask());

    const response = await request(app)
      .patch(`/api/tasks/${created.body.data.id}`)
      .send({ scheduledAt: "2024-03-20T09:00:00.000Z" });

    expect(response.body.data.scheduledAt).toBe("2024-03-20T09:00:00.000Z");
  });

  it("rejects an end time that lands before the stored start time", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send(baseTask({ endsAt: "2024-03-13T10:00:00.000Z" }));

    const response = await request(app)
      .patch(`/api/tasks/${created.body.data.id}`)
      .send({ scheduledAt: "2024-03-13T11:00:00.000Z" });

    expect(response.status).toBe(400);
    expect(response.body.fields.endsAt).toBeDefined();
  });

  it("rejects an empty update", async () => {
    const created = await request(app).post("/api/tasks").send(baseTask());

    const response = await request(app).patch(`/api/tasks/${created.body.data.id}`).send({});

    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown task", async () => {
    const response = await request(app)
      .patch("/api/tasks/65f0f0f0f0f0f0f0f0f0f0f0")
      .send({ title: "Ghost" });

    expect(response.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const response = await request(app).patch("/api/tasks/not-an-id").send({ title: "Ghost" });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("removes the task and returns 204", async () => {
    const created = await request(app).post("/api/tasks").send(baseTask());

    const removed = await request(app).delete(`/api/tasks/${created.body.data.id}`);
    const list = await request(app).get("/api/tasks");

    expect(removed.status).toBe(204);
    expect(list.body.data).toHaveLength(0);
  });

  it("returns 404 when the task is already gone", async () => {
    const response = await request(app).delete("/api/tasks/65f0f0f0f0f0f0f0f0f0f0f0");

    expect(response.status).toBe(404);
  });
});

describe("unknown routes", () => {
  it("answers with JSON instead of an HTML error page", async () => {
    const response = await request(app).get("/api/nope").set("Accept", "application/json");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/cannot get/i);
  });
});
