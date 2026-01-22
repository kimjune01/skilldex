/**
 * Database Query API Routes (v1)
 *
 * Admin-only API key authenticated routes for querying the production database.
 * Provides read-only SQL access for debugging and analytics.
 *
 * SECURITY: Only accessible by super admins (isSuperAdmin = true)
 */
import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skillomatic/db';
import { sql } from 'drizzle-orm';

export const v1DatabaseRoutes = new Hono();

// All routes require API key auth
v1DatabaseRoutes.use('*', apiKeyAuth);

// Middleware to check super admin status
v1DatabaseRoutes.use('*', async (c, next) => {
  const user = c.get('apiKeyUser');
  if (!user.isSuperAdmin) {
    return c.json(
      {
        error: {
          message: 'Database query access requires super admin privileges',
          code: 'FORBIDDEN',
        },
      },
      403
    );
  }
  await next();
});

// Tables that are safe to query (allowlist)
const ALLOWED_TABLES = [
  'users',
  'organizations',
  'organization_invites',
  'api_keys',
  'skills',
  'integrations',
  'skill_usage_logs',
  'scrape_tasks',
  'skill_proposals',
  'error_events',
  'system_settings',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'role_skills',
  'sessions',
];

// Columns that should be redacted from output
const REDACTED_COLUMNS = ['password_hash', 'llm_api_key'];

/**
 * Redact sensitive columns from query results
 */
function redactSensitiveData(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const redacted = { ...row };
    for (const col of REDACTED_COLUMNS) {
      if (col in redacted) {
        redacted[col] = '[REDACTED]';
      }
    }
    return redacted;
  });
}

/**
 * Validate SQL query for safety
 * Returns error message if unsafe, null if safe
 */
function validateQuery(query: string): string | null {
  const upperQuery = query.toUpperCase().trim();

  // Must start with SELECT
  if (!upperQuery.startsWith('SELECT')) {
    return 'Only SELECT queries are allowed';
  }

  // Block dangerous keywords
  const dangerousKeywords = [
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
    'ATTACH',
    'DETACH',
    'PRAGMA',
    'VACUUM',
    'REINDEX',
  ];

  for (const keyword of dangerousKeywords) {
    // Match keyword as whole word (not part of identifier)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(query)) {
      return `Query contains forbidden keyword: ${keyword}`;
    }
  }

  // Block semicolons (prevent multi-statement attacks)
  if (query.includes(';')) {
    const parts = query.split(';').filter((p) => p.trim());
    if (parts.length > 1) {
      return 'Multi-statement queries are not allowed';
    }
  }

  return null;
}

// GET /api/v1/database/tables - List available tables
v1DatabaseRoutes.get('/tables', async (c) => {
  return c.json({
    data: {
      tables: ALLOWED_TABLES,
      redactedColumns: REDACTED_COLUMNS,
    },
  });
});

// GET /api/v1/database/schema/:table - Get table schema
v1DatabaseRoutes.get('/schema/:table', async (c) => {
  const table = c.req.param('table');

  if (!ALLOWED_TABLES.includes(table)) {
    return c.json(
      {
        error: {
          message: `Table '${table}' is not in the allowed list`,
          code: 'INVALID_TABLE',
        },
      },
      400
    );
  }

  try {
    const result = await db.all(sql.raw(`PRAGMA table_info(${table})`));
    return c.json({ data: { table, columns: result } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get schema';
    return c.json({ error: { message } }, 500);
  }
});

// POST /api/v1/database/query - Execute a read-only SQL query
v1DatabaseRoutes.post('/query', async (c) => {
  const body = await c.req.json<{ query: string; limit?: number }>();

  if (!body.query) {
    return c.json({ error: { message: 'Query is required' } }, 400);
  }

  // Validate query safety
  const validationError = validateQuery(body.query);
  if (validationError) {
    return c.json(
      {
        error: {
          message: validationError,
          code: 'INVALID_QUERY',
        },
      },
      400
    );
  }

  // Apply default limit if not specified in query
  let query = body.query.trim();
  const hasLimit = /\bLIMIT\s+\d+/i.test(query);
  const maxLimit = body.limit || 100;

  if (!hasLimit) {
    // Remove trailing semicolon if present
    if (query.endsWith(';')) {
      query = query.slice(0, -1);
    }
    query = `${query} LIMIT ${maxLimit}`;
  }

  try {
    const startTime = Date.now();
    const result = await db.all(sql.raw(query));
    const durationMs = Date.now() - startTime;

    // Redact sensitive columns
    const rows = redactSensitiveData(result as Record<string, unknown>[]);

    return c.json({
      data: {
        rows,
        rowCount: rows.length,
        durationMs,
        query: query, // Echo back the executed query
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query execution failed';
    return c.json({ error: { message } }, 500);
  }
});

// GET /api/v1/database/stats - Get database statistics
v1DatabaseRoutes.get('/stats', async (c) => {
  try {
    const stats: Record<string, number> = {};

    for (const table of ALLOWED_TABLES) {
      try {
        const result = await db.all(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
        stats[table] = (result[0] as { count: number })?.count ?? 0;
      } catch {
        stats[table] = -1; // Table might not exist
      }
    }

    return c.json({ data: { stats } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    return c.json({ error: { message } }, 500);
  }
});
