import "server-only";

import { createDbClient } from "./db-client";

type DbClient = ReturnType<typeof createDbClient>;

const globalForDb = globalThis as typeof globalThis & { oneAtlasDb?: DbClient };
let db: DbClient | undefined;

export function getDb() {
  db ??= globalForDb.oneAtlasDb ?? createDbClient();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.oneAtlasDb = db;
  }

  return db;
}
