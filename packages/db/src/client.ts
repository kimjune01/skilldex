import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

// Get Turso credentials - prefer SST Resource (runtime), fall back to env vars (local/scripts)
let tursoUrl: string | undefined;
let tursoToken: string | undefined;

// In AWS (Lambda or ECS), SST injects secrets via Resource. Try to import it.
const isAws = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.AWS_EXECUTION_ENV || process.env.NODE_ENV === 'production';
if (isAws) {
  try {
    // Dynamic import to avoid bundling sst in local dev
    const { Resource } = await import('sst');
    tursoUrl = (Resource as unknown as Record<string, { value: string }>).TursoDatabaseUrl?.value;
    tursoToken = (Resource as unknown as Record<string, { value: string }>).TursoAuthToken?.value;
  } catch {
    // SST Resource not available, fall through to env vars
  }
}

// Fall back to env vars (local dev, seed scripts, etc.)
tursoUrl = tursoUrl || process.env.TURSO_DATABASE_URL;
tursoToken = tursoToken || process.env.TURSO_AUTH_TOKEN;

// Determine which database to use based on environment
// Local dev uses SQLite even if Turso vars are present (for testing prod configs locally)
// Only use Turso when NODE_ENV=production OR USE_TURSO=true is explicitly set
const isProduction = process.env.NODE_ENV === 'production';
const forceTurso = process.env.USE_TURSO === 'true';
const hasTursoConfig = !!(tursoUrl && tursoToken);
const isTurso = hasTursoConfig && (isProduction || forceTurso);

type DbType = BetterSQLite3Database<typeof schema> | LibSQLDatabase<typeof schema>;

let db: DbType;
let sqlite: import('better-sqlite3').Database | null = null;

if (isTurso) {
  // Production: Use Turso (libsql over HTTP)
  const { createClient } = await import('@libsql/client');

  const client = createClient({
    url: tursoUrl!,
    authToken: tursoToken!,
  });

  db = drizzleLibsql(client, { schema });
  console.log('Connected to Turso database');
} else if (isProduction) {
  // Production but missing Turso vars - this is an error
  console.error('ERROR: Production environment but Turso credentials not set!');
  console.error('TURSO_DATABASE_URL:', tursoUrl ? 'set' : 'missing');
  console.error('TURSO_AUTH_TOKEN:', tursoToken ? 'set' : 'missing');
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
