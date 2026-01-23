# Load Skillomatic MCP Server

Load and test the Skillomatic MCP server for a specific user.

## Steps

1. **Determine environment** (elicit if ambiguous):
   - Local: `http://localhost:3000`
   - Production: `https://api.skillomatic.technology`

2. **Determine user** (elicit if not obvious):
   - Check context for user email/name
   - Common users:
     - Local: `demo@skillomatic.technology` (API key: `sk_test_demo_api_key`)
     - Prod: `superadmin@skillomatic.technology` (API key: `sk_live_prod_super_admin_debug_key_2024`)

3. **Get API key** for user:
   ```bash
   # Local
   sqlite3 packages/db/data/skillomatic.db "SELECT key FROM api_keys WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL');"

   # Prod
   turso db shell skillomatic "SELECT key FROM api_keys WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL');"
   ```

4. **Build MCP** (if local):
   ```bash
   pnpm --filter @skillomatic/mcp build
   ```

5. **Test MCP server** - list tools:
   ```bash
   # Local
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
     SKILLOMATIC_API_URL=http://localhost:3000 \
     SKILLOMATIC_API_KEY=API_KEY \
     node packages/mcp/dist/index.js 2>&1

   # Prod
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
     SKILLOMATIC_API_URL=https://api.skillomatic.technology \
     SKILLOMATIC_API_KEY=API_KEY \
     node packages/mcp/dist/index.js 2>&1
   ```

6. **Check integrations** for user:
   ```bash
   # Local
   sqlite3 packages/db/data/skillomatic.db "SELECT provider, status, nango_connection_id FROM integrations WHERE user_id = 'USER_ID';" -header

   # Prod
   turso db shell skillomatic "SELECT provider, status, nango_connection_id FROM integrations WHERE user_id = 'USER_ID';"
   ```

7. **Output MCP config** for Claude Desktop:
   ```json
   {
     "mcpServers": {
       "skillomatic": {
         "command": "node",
         "args": ["FULL_PATH/packages/mcp/dist/index.js"],
         "env": {
           "SKILLOMATIC_API_URL": "API_URL",
           "SKILLOMATIC_API_KEY": "API_KEY"
         }
       }
     }
   }
   ```

## Quick Reference

| Environment | API URL | Demo API Key |
|-------------|---------|--------------|
| Local | http://localhost:3000 | sk_test_demo_api_key |
| Production | https://api.skillomatic.technology | sk_live_prod_super_admin_debug_key_2024 |

## Troubleshooting

- **Calendar=false**: Check integration has `status='connected'` and valid `nango_connection_id`
- **No tools**: Verify API key is valid and not revoked
- **Connection refused**: Ensure local API is running (`pnpm dev`)
