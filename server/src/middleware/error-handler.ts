import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/http-error.js";

/** Answers unknown routes with a JSON 404 instead of Express' HTML page. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Cannot ${req.method} ${req.path}`));
};

/**
 * Single place that turns thrown errors into JSON responses. Known error kinds
 * keep their status code; anything else becomes a logged 500.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, fields: err.fields });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([key, detail]) => [key, [detail.message]]),
    );
    res.status(400).json({ message: "Validation failed", fields });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Request body must be valid JSON" });
    return;
  }

  console.error("Unhandled API error:", err);
  res.status(500).json({ message: "Internal server error" });
};
