import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required").optional(),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  USE_MEMORY_DB: z.enum(["0", "1"]).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (!env.MONGODB_URI && env.USE_MEMORY_DB !== "1") {
  console.error("Set MONGODB_URI, or run with USE_MEMORY_DB=1 for a throwaway in-memory database.");
  process.exit(1);
}
