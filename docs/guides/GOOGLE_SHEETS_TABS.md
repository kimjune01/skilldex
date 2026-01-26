# Google Sheets Multi-Tab System

Track any data type in your Skillomatic spreadsheet with dedicated tools for each tab.

## How It Works

When you connect Google Sheets, Skillomatic creates one spreadsheet for you. Inside that spreadsheet, you can create multiple **tabs** (sheets), each representing a different data type:

- **Contacts** - Track business contacts and leads
- **Jobs** - Track job applications
- **Inventory** - Track products or assets
- **Party Guests** - Track RSVPs for an event

Each tab you create gets its own set of MCP tools. For example, a "Contacts" tab generates:
- `contacts_add` - Add a new contact
- `contacts_list` - List all contacts
- `contacts_search` - Search contacts
- `contacts_update` - Update a contact
- `contacts_delete` - Delete a contact

## Quick Start

### 1. List Your Tabs

Ask Claude: *"What tabs do I have in my spreadsheet?"*

Claude will call `list_tabs` and show you:
- Tab names and their purposes
- Column headers for each tab
- Available tools for each tab
- Link to your spreadsheet

### 2. Create a New Tab

Ask Claude: *"Create a Contacts tab for tracking sales leads"*

Claude will call `create_tab` with:
- **Title**: "Contacts"
- **Purpose**: "Track sales leads"
- **Columns**: Name, Company, Email, Phone, Stage, Notes

**Important**: After creating a tab, restart Claude Code (or your MCP connection) to use the new tools.

### 3. Add Data

Ask Claude: *"Add John Doe from Acme Corp, john@acme.com, he's a lead"*

Claude calls `contacts_add` with the data. The tool is hardcoded to write to the Contacts tab only.

### 4. Search and Update

- *"Find all contacts from Acme"* → `contacts_search`
- *"Update row 3 to mark as Contacted"* → `contacts_update`
- *"Show me all my contacts"* → `contacts_list`

### 5. Modify Schema

Need to add a column? Ask Claude: *"Add a 'Last Contact' column to my Contacts tab"*

Claude calls `update_tab_schema` with the complete column list.

**Note**: Existing data rows are not modified when you change columns.

## Available Tools

### Tab Management (always available)

| Tool | Description |
|------|-------------|
| `list_tabs` | List all tabs with columns and purposes |
| `create_tab` | Create a new tab (requires restart after) |
| `update_tab_schema` | Change columns or purpose |
| `delete_tab` | Delete a tab and all its data (requires restart after) |

### Per-Tab Tools (generated for each tab)

For a tab named "Contacts":

| Tool | Description |
|------|-------------|
| `contacts_add` | Add a new row |
| `contacts_list` | List rows with pagination |
| `contacts_search` | Search across all columns |
| `contacts_update` | Update specific fields in a row |
| `contacts_delete` | Delete a row |

## Design Principles

### No Generic Tools

Unlike raw Google Sheets access, there are no `read_range` or `append_rows` tools. Each tool targets a specific tab, preventing accidental writes to the wrong place.

### All Columns Are Text

Every column is treated as a string. No date formatting, number validation, or type coercion. This keeps things simple and predictable.

### Restart Required for New Tools

When you create or delete a tab, the MCP tools need to regenerate. Restart Claude Code to pick up the changes.

## Troubleshooting

### "Google Sheets not connected"

Connect Google Sheets in the Skillomatic web UI under Integrations.

### "Tab not found"

Tab names are case-insensitive. Check `list_tabs` for exact names.

### New tools not appearing after `create_tab`

Restart Claude Code. Tools are generated when the MCP connection starts.

### "Read-only access"

Your Google Sheets integration is set to read-only. Change it in Integrations settings.

---

## Code Pointers

For developers investigating issues or extending functionality:

| Component | File | Description |
|-----------|------|-------------|
| API Routes | `apps/api/src/routes/v1/sheets.ts` | All `/v1/sheets/*` endpoints |
| Token Refresh | `apps/api/src/lib/google-oauth.ts` | OAuth token management, `tabs` field initialization |
| MCP Tools | `packages/mcp/src/tools/sheets.ts` | Tool definitions and per-tab generation |
| Tool Registration | `packages/mcp/src/tools/index.ts` | Where `hasGoogleSheets` triggers registration |
| API Client | `packages/mcp/src/api-client.ts` | Client methods for MCP to call API |
| Types | `packages/mcp/src/types.ts` | `TabConfig`, `TabsResponse`, etc. |
| Capability Detection | `apps/api/src/routes/skills.ts` | `/skills/config` returns `hasGoogleSheets` |

### Key Functions

**API Side:**
- `getGoogleSheetsIntegration()` - Fetches integration with token refresh (`sheets.ts:66`)
- `sheetsRequest()` - Makes authenticated Google Sheets API calls (`sheets.ts:145`)
- `saveMetadata()` - Persists tab changes and increments version (`sheets.ts:131`)

**MCP Side:**
- `registerSheetsTools()` - Entry point for tool registration (`sheets.ts:505`)
- `registerToolsForTab()` - Generates 5 CRUD tools per tab (`sheets.ts:257`)
- `buildColumnFieldMap()` - Handles column name collisions (`sheets.ts:35`)

### Data Flow

```
User Request → Claude → MCP Tool → API Client → /v1/sheets/* → Google Sheets API
                                                      ↓
                                              Integration Metadata
                                              (tabs[], tabsVersion)
```

### Version Tracking

`tabsVersion` in integration metadata increments on any tab/schema change. This enables future optimizations like:
- Caching tools until version changes
- Detecting stale tool definitions

Currently, tools regenerate on every MCP connection (lazy regeneration).
