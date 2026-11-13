import mongoose from "mongoose";

/**
 * Opens a connection to the configured MongoDB instance.
 *
 * @param uri MongoDB connection string.
 */
export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
}

/** Closes the active MongoDB connection, if any. */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

/**
 * Boots a throwaway in-memory MongoDB instance. Used by the `dev:memory`
 * script and the test suite so the project runs without a local server.
 *
 * @returns The connection string plus a shutdown hook.
 */
export async function startMemoryDatabase(): Promise<{ uri: string; stop: () => Promise<void> }> {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const server = await MongoMemoryServer.create();

  return {
    uri: server.getUri("todo-list"),
    stop: async () => {
      await mongoose.disconnect();
      await server.stop();
    },
  };
}
