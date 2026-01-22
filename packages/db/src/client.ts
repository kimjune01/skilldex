import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

// Determine which database to use based on environment
// In production (Lambda), NODE_ENV=production and Turso vars should be set
const isProduction = process.env.NODE_ENV === 'production';
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
} else if (isProduction) {
  // Production but missing Turso vars - this is an error
  console.error('ERROR: Production environment but TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set!');
  console.error('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'set' : 'missing');
  console.error('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'set' : 'missing');
  throw new Error('Production requires Turso database configuration');
} else {
  // Local development: Use better-sqlite3
  // Dynamic import to avoid bundling native module in Lambda
  const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
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
