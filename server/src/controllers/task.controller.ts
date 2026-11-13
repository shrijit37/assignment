import type { RequestHandler } from "express";
import mongoose from "mongoose";
import type { QueryFilter } from "mongoose";
import { TaskModel, type Task } from "../models/task.model.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from "../validators/task.validator.js";
import { HttpError } from "../utils/http-error.js";
import { toTaskDto } from "../utils/serialize-task.js";
import { parseWith } from "../utils/validate.js";

/** Escapes a user string so it can be embedded in a `RegExp` literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Reads the `:id` route param and rejects anything that is not a Mongo id.
 *
 * @param id Raw param value.
 */
function requireObjectId(id: unknown): string {
  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid task id");
  }
  return id;
}

/**
 * Guards the optional time range. `endsAt` may be absent, but it can never be
 * at or before the start of the task.
 *
 * @param scheduledAt Start date/time.
 * @param endsAt Optional end date/time.
 */
function assertTimeRange(scheduledAt: Date, endsAt: Date | null): void {
  if (endsAt && endsAt.getTime() <= scheduledAt.getTime()) {
    throw new HttpError(400, "End time must be after the start time", {
      endsAt: ["End time must be after the start time"],
    });
  }
}

/**
 * `GET /api/tasks` — returns tasks ordered by their scheduled date, optionally
 * narrowed down with `search`, `status`, `from` and `to`.
 */
export const listTasks: RequestHandler = async (req, res) => {
  const query = parseWith(listTasksQuerySchema, req.query);
  const filter: QueryFilter<Task> = {};

  if (query.status) filter.status = query.status;

  if (query.search) {
    const pattern = new RegExp(escapeRegExp(query.search), "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  if (query.from || query.to) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (query.from) range.$gte = query.from;
    if (query.to) range.$lte = query.to;
    filter.scheduledAt = range;
  }

  const tasks = await TaskModel.find(filter).sort({ scheduledAt: 1, createdAt: 1 });
  res.json({ data: tasks.map(toTaskDto) });
};

/** `GET /api/tasks/:id` — returns a single task. */
export const getTask: RequestHandler = async (req, res) => {
  const id = requireObjectId(req.params.id);
  const task = await TaskModel.findById(id);

  if (!task) throw new HttpError(404, "Task not found");

  res.json({ data: toTaskDto(task) });
};

/** `POST /api/tasks` — creates a task. Title and start date/time are required. */
export const createTask: RequestHandler = async (req, res) => {
  const input = parseWith(createTaskSchema, req.body);
  assertTimeRange(input.scheduledAt, input.endsAt ?? null);

  const task = await TaskModel.create({
    title: input.title,
    description: input.description ?? "",
    scheduledAt: input.scheduledAt,
    endsAt: input.endsAt ?? null,
    priority: input.priority ?? null,
    status: input.status ?? "in_progress",
  });

  res.status(201).json({ data: toTaskDto(task) });
};

/** `PATCH /api/tasks/:id` — edits any subset of a task, including its status. */
export const updateTask: RequestHandler = async (req, res) => {
  const id = requireObjectId(req.params.id);
  const input = parseWith(updateTaskSchema, req.body);
  const task = await TaskModel.findById(id);

  if (!task) throw new HttpError(404, "Task not found");

  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.scheduledAt !== undefined) task.scheduledAt = input.scheduledAt;
  if (input.priority !== undefined) task.priority = input.priority ?? null;
  if (input.status !== undefined) task.status = input.status;
  if (input.endsAt !== undefined) task.endsAt = input.endsAt ?? null;

  assertTimeRange(task.scheduledAt, task.endsAt ?? null);
  await task.save();

  res.json({ data: toTaskDto(task) });
};

/** `DELETE /api/tasks/:id` — permanently removes a task. */
export const deleteTask: RequestHandler = async (req, res) => {
  const id = requireObjectId(req.params.id);
  const task = await TaskModel.findByIdAndDelete(id);

  if (!task) throw new HttpError(404, "Task not found");

  res.status(204).send();
};
