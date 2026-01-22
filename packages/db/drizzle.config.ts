import { defineConfig } from 'drizzle-kit';

// Use Turso (libsql) for production, SQLite for local dev
const isTurso = process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: isTurso ? 'turso' : 'sqlite',
  dbCredentials: isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL || 'file:./data/skillomatic.db',
      },
});
