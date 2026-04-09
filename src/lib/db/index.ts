import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL!;

// Prevent multiple connections in development (HMR issue)
const globalForDb = globalThis as unknown as {
  postgres: ReturnType<typeof postgres> | undefined;
};

// Sanitize connection string (strip parameters if using PgBouncer/transaction mode)
const client =
  globalForDb.postgres ??
  postgres(connectionString.split("?")[0], {
    max: 10,
    prepare: false,
    ssl: "require",
    // Fail fast if pool is full or connection is slow (remote RTT is ~200ms)
    connect_timeout: 10,
    // Clear idle connections faster to help with pool exhaustion during HMR
    idle_timeout: 10,
    max_lifetime: 60 * 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgres = client;
}

export const db = drizzle(client, { schema });
export { schema };
