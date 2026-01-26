# Load Skillomatic MCP Server

Load and test the Skillomatic MCP server for a specific user.

## Steps

1. **Determine environment** (elicit if ambiguous):
   - Local: `http://localhost:3000`
   - Production: `https://api.skillomatic.technology`

2. **Determine user** (elicit if not obvious):
   - Check context for user email/name
   - Common test users: `demo@skillomatic.technology` (local), `superadmin@skillomatic.technology` (prod)
   - Always query for API key from database (step 3)

3. **Get API key** for user:
   ```bash
   # Local
   sqlite3 packages/db/data/skillomatic.db "SELECT key FROM api_keys WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL');"

   # Prod
   turso db shell skillomatic "SELECT key FROM api_keys WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL');"
   ```

4. **Test MCP web endpoint** - verify connection:
   ```bash
   # Local - test the MCP endpoint is accessible (port 3001)
   curl -i -H "Authorization: Bearer API_KEY" http://localhost:3001/mcp

   # Prod
   curl -i -H "Authorization: Bearer API_KEY" https://mcp.skillomatic.technology/mcp
   ```

5. **Check integrations** for user:
   ```bash
   # Local
   sqlite3 packages/db/data/skillomatic.db "SELECT provider, status, nango_connection_id FROM integrations WHERE user_id = 'USER_ID';" -header

   # Prod
   turso db shell skillomatic "SELECT provider, status, nango_connection_id FROM integrations WHERE user_id = 'USER_ID';"
   ```

6. **Output MCP config** for Claude Desktop:
   ```json
   {
     "mcpServers": {
       "skillomatic": {
         "url": "MCP_ENDPOINT",
         "headers": {
           "Authorization": "Bearer API_KEY"
         }
       }
     }
   }
   ```

   Example for local:
   ```json
   {
     "mcpServers": {
       "skillomatic": {
         "url": "http://localhost:3001/mcp",
         "headers": {
           "Authorization": "Bearer sk_test_xxx"
         }
       }
     }
   }
   ```

   Example for production:
   ```json
   {
     "mcpServers": {
       "skillomatic": {
         "url": "https://mcp.skillomatic.technology/mcp",
         "headers": {
           "Authorization": "Bearer sk_live_xxx"
         }
       }
     }
   }
   ```

## Quick Reference

| Environment | MCP Endpoint |
|-------------|--------------|
| Local | http://localhost:3001/mcp |
| Production | https://mcp.skillomatic.technology/mcp |

## Troubleshooting

- **Calendar=false**: Check integration has `status='connected'` and valid `nango_connection_id`
- **No tools**: Verify API key is valid and not revoked
- **Connection refused**: Ensure local API is running (`pnpm dev`)
- **401 Unauthorized**: Check API key format (should start with `sk_live_` or `sk_test_`)
