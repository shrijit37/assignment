import { z } from "zod";
import { HttpError } from "./http-error.js";

/**
 * Validates `data` against a Zod schema and throws a `400` with per-field
 * messages when it does not match.
 *
 * @param schema Schema describing the expected payload.
 * @param data Untrusted input.
 * @returns The parsed, typed payload.
 */
export function parseWith<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const { fieldErrors, formErrors } = z.flattenError(result.error);
    const fields: Record<string, string[]> = {};

    for (const [key, messages] of Object.entries(fieldErrors as Record<string, string[] | undefined>)) {
      if (messages && messages.length > 0) fields[key] = messages;
    }

    throw new HttpError(400, formErrors[0] ?? "Validation failed", fields);
  }

  return result.data;
}
