import { Schema, model, type HydratedDocument } from "mongoose";

export const TASK_STATUSES = ["in_progress", "completed"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** A task as stored in MongoDB. */
export interface Task {
  title: string;
  description: string;
  scheduledAt: Date;
  endsAt: Date | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<Task>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    scheduledAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    priority: { type: String, enum: TASK_PRIORITIES, default: null },
    status: { type: String, enum: TASK_STATUSES, default: "in_progress" },
  },
  { timestamps: true, versionKey: false },
);

taskSchema.index({ scheduledAt: 1 });
taskSchema.index({ status: 1 });

export type TaskDocument = HydratedDocument<Task>;

export const TaskModel = model<Task>("Task", taskSchema);
