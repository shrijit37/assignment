import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { taskRouter } from "./routes/task.routes.js";

export interface AppOptions {
  /** Comma separated list of browser origins allowed to call the API. */
  clientOrigin?: string;
}

/**
 * Builds the Express application. Kept separate from the HTTP server so tests
 * can exercise it without binding a port.
 *
 * @param options Runtime configuration.
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const origins = (options.clientOrigin ?? "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: origins.includes("*") ? true : origins }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/tasks", taskRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
