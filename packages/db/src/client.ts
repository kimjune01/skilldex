import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

// Determine which database to use based on environment
const isTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

type DbType = BetterSQLite3Database<typeof schema> | LibSQLDatabase<typeof schema>;

let db: DbType;
let sqlite: import('better-sqlite3').Database | null = null;

if (isTurso) {
  // Production: Use Turso (libsql over HTTP)
  const { createClient } = await import('@libsql/client');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  db = drizzleLibsql(client, { schema });
  console.log('Connected to Turso database');
} else {
  // Local development: Use better-sqlite3
  const { default: Database } = await import('better-sqlite3');
  const { existsSync, mkdirSync } = await import('fs');
  const { dirname } = await import('path');

  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/skillomatic.db';

  // Ensure directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL');

  db = drizzleSqlite(sqlite, { schema });
  console.log(`Connected to local SQLite database: ${dbPath}`);
}

export { db, sqlite };
