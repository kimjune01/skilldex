import { Hono } from 'hono';

export const extensionRoutes = new Hono();

/**
 * GET /extension - Browser extension installation guide
 *
 * Returns markdown instructions for installing and configuring
 * the Skilldex Scraper Chrome extension.
 */
extensionRoutes.get('/', (c) => {
  const apiUrl = process.env.API_URL || c.req.header('host') || 'http://localhost:3000';

  const markdown = `# Skilldex Scraper Browser Extension

The Skilldex Scraper extension enables LinkedIn profile lookups by opening pages in your authenticated browser session.

## Why This Extension?

When you use \`/linkedin-lookup\` in Claude, the skill needs to access LinkedIn profile data. Instead of managing OAuth tokens or storing credentials, the extension opens LinkedIn pages **in your actual browser** where you're already logged in.

## How It Works

\`\`\`
Claude Code                    Skilldex API                   Your Browser
    │                              │                              │
    │ 1. /linkedin-lookup          │                              │
    │ ──────────────────────────►  │                              │
    │                              │                              │
    │ 2. Create scrape task        │                              │
    │    POST /api/v1/scrape/tasks │                              │
    │                              │                              │
    │                              │ 3. Extension polls for tasks │
    │                              │ ◄──────────────────────────  │
    │                              │                              │
    │                              │ 4. Return pending task       │
    │                              │ ──────────────────────────►  │
    │                              │                              │
    │                              │ 5. Extension opens LinkedIn  │
    │                              │    in a new tab (logged in!) │
    │                              │                              │
    │                              │ 6. Extract page content      │
    │                              │ ◄──────────────────────────  │
    │                              │                              │
    │ 7. Return profile data       │                              │
    │ ◄──────────────────────────  │                              │
\`\`\`

## Installation

### Step 1: Get the Extension

The extension source is in \`apps/skilldex-scraper/\` in the Skilldex repository.

**Option A: Load Unpacked (Development)**

1. Download or clone the Skilldex repository
2. Open Chrome and go to \`chrome://extensions/\`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the \`apps/skilldex-scraper\` folder
6. The extension icon should appear in your toolbar

**Option B: Enterprise Installation**

If your IT department has deployed the extension, it may already be installed. Check your Chrome extensions or contact IT.

### Step 2: Configure the Extension

1. Click the **Skilldex Scraper** extension icon in your Chrome toolbar
2. Enter your configuration:

   **API URL:**
   \`\`\`
   ${apiUrl}
   \`\`\`

   **API Key:**
   Your personal API key from the Skilldex dashboard (starts with \`sk_live_\`)

3. Click **Save & Connect**

### Step 3: Verify Connection

The extension popup should show:
- **Status:** Green dot with "Polling"
- **API Key:** "Configured" or a masked version

If you see a red dot or errors, check:
- API URL is correct (no trailing slash)
- API key is valid and not revoked
- You're connected to the internet

## Usage

Once configured, the extension works automatically:

1. Keep Chrome open in the background
2. Make sure you're logged into LinkedIn
3. Use \`/linkedin-lookup\` in Claude Code
4. The extension will open LinkedIn pages and extract profile data

You'll see brief tab flashes as the extension opens and closes tabs.

## Troubleshooting

### Extension shows "Not connected"

- Verify the API URL is correct
- Check your API key is valid
- Try clicking "Save & Connect" again

### Scrape tasks stay "pending"

- Is Chrome running? The extension needs the browser open
- Is the extension enabled? Check \`chrome://extensions/\`
- Click the extension icon and verify "Polling" status

### LinkedIn pages don't load

- Are you logged into LinkedIn? Open linkedin.com and verify
- Is there a popup blocker? Allow popups from the extension
- LinkedIn may be rate-limiting - wait a few minutes

### Tasks timeout after 2 minutes

The extension may not be responding. Check:
- Extension is installed and enabled
- Chrome is in the foreground (some systems throttle background tabs)
- No browser extensions blocking the scraper

## Security Notes

- The extension only accesses URLs for scrape tasks from the Skilldex API
- Your LinkedIn session cookies stay in your browser - never sent to the API
- Only page content (as markdown) is sent back to Skilldex
- API key is stored in Chrome's sync storage (encrypted)

## Extension Permissions

| Permission | Purpose |
|------------|---------|
| \`storage\` | Store API URL and key |
| \`tabs\` | Open new tabs for scraping |
| \`scripting\` | Extract page content |
| \`<all_urls>\` | Access LinkedIn pages |

## Getting Help

- **Extension issues:** Check this page or contact IT
- **API issues:** Check the Skilldex dashboard
- **LinkedIn access:** Verify your LinkedIn account status

---

*Extension version: 1.0.0*
*API: ${apiUrl}*
`;

  return c.text(markdown, 200, {
    'Content-Type': 'text/markdown',
  });
});

/**
 * GET /extension/status - Quick status check for extension
 *
 * Returns a simple JSON response that the extension can use
 * to verify connectivity.
 */
extensionRoutes.get('/status', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
