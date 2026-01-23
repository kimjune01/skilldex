# Local Database Query

Query the local SQLite database directly without shell escaping issues.

## Usage

```bash
sqlite3 packages/db/data/skillomatic.db "<SQL>"
```

## Common Queries

### Users
```sql
SELECT id, email, name, is_admin FROM users;
```

### Integrations
```sql
SELECT * FROM integrations;
```

### Add Integration
```sql
INSERT INTO integrations (id, user_id, organization_id, provider, status, nango_connection_id, created_at, updated_at)
VALUES ('int-XXX', 'user-demo', 'org-default', 'calendly', 'connected', 'NANGO_CONN_ID', datetime('now'), datetime('now'));
```

### Skills
```sql
SELECT id, slug, name, is_enabled FROM skills;
```

### API Keys
```sql
SELECT id, user_id, key, name FROM api_keys;
```

## Quick Commands

Reset and seed:
```bash
rm packages/db/data/skillomatic.db* && pnpm db:push && pnpm db:seed
```

Open interactive shell:
```bash
sqlite3 packages/db/data/skillomatic.db
```
