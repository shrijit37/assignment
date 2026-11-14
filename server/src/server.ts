import "dotenv/config";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { createApp } from "./app.js";
import { connectDatabase, startMemoryDatabase } from "./config/database.js";
import { env } from "./config/env.js";

/**
 * Finds the compiled client to serve alongside the API. `STATIC_DIR` wins,
 * otherwise the two layouts the project is started from are tried: the
 * repository root (`npm start`) and the workspace itself (`npm run dev`).
 *
 * @returns Absolute path to the bundle, or `undefined` when it is not built.
 */
function resolveStaticDir(): string | undefined {
  if (env.STATIC_DIR) return resolve(env.STATIC_DIR);

  return [
    resolve(process.cwd(), "client/dist"),
    resolve(process.cwd(), "../client/dist"),
  ].find((dir) => existsSync(join(dir, "index.html")));
}

/**
 * Connects to a database, then starts the HTTP server and wires up graceful
 * shutdown for container platforms.
 */
async function main(): Promise<void> {
  let stopDatabase = async (): Promise<void> => {
    const { disconnectDatabase } = await import("./config/database.js");
    await disconnectDatabase();
  };

  if (env.USE_MEMORY_DB === "1") {
    const memory = await startMemoryDatabase();
    await connectDatabase(memory.uri);
    stopDatabase = memory.stop;
    console.log("Using in-memory MongoDB (data is discarded on exit)");
  } else {
    await connectDatabase(env.MONGODB_URI as string);
  }

  const staticDir = resolveStaticDir();
  const app = createApp({ clientOrigin: env.CLIENT_ORIGIN, staticDir });
  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
    if (staticDir) console.log(`Serving the client from ${staticDir}`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    console.log(`Received ${signal}, shutting down`);
    server.close(() => {
      stopDatabase()
        .catch((error: unknown) => console.error("Failed to close database", error))
        .finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error: unknown) => {
  console.error("Failed to start the API", error);
  process.exit(1);
});
