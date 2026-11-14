import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let staticDir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  staticDir = mkdtempSync(join(tmpdir(), "todo-client-"));
  writeFileSync(join(staticDir, "index.html"), "<!doctype html><title>Taskly</title>");
  writeFileSync(join(staticDir, "app.js"), "console.log('taskly');");

  app = createApp({ clientOrigin: "*", staticDir });
});

afterAll(() => {
  rmSync(staticDir, { recursive: true, force: true });
});

describe("serving the client from the API", () => {
  it("returns the bundle at the root", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("<title>Taskly</title>");
  });

  it("serves hashed assets", async () => {
    const response = await request(app).get("/app.js");

    expect(response.status).toBe(200);
    expect(response.text).toContain("taskly");
  });

  it("hands deep links back to the client router", async () => {
    const search = await request(app).get("/search");
    const app_route = await request(app).get("/app");

    expect(search.status).toBe(200);
    expect(app_route.status).toBe(200);
    expect(search.text).toContain("<title>Taskly</title>");
  });

  it("still answers unknown API routes with JSON", async () => {
    const response = await request(app).get("/api/nope");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/cannot get/i);
  });
});
