import cors from "cors";
import express, { type Express } from "express";
import { join } from "node:path";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { taskRouter } from "./routes/task.routes.js";

export interface AppOptions {
  /** Comma separated list of browser origins allowed to call the API. */
  clientOrigin?: string;
  /**
   * Directory with the compiled client. When set, the API also serves the
   * static bundle and answers unknown routes with `index.html`, so the whole
   * app runs behind a single origin.
   */
  staticDir?: string;
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

  if (options.staticDir) {
    app.use(express.static(options.staticDir, { index: false, maxAge: "1h" }));
    // Anything that is not an API call falls through to the client router.
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(options.staticDir as string, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
