import { Hono } from 'hono';

export const onboardingRoutes = new Hono();

/**
 * GET /onboarding - Simple getting started guide for new users
 *
 * A streamlined onboarding flow for recruiters joining an org
 * that already has Skillomatic set up.
 */
onboardingRoutes.get('/', (c) => {
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const markdown = `# Welcome to Skillomatic

Skillomatic lets you search candidates, manage your ATS, and source from LinkedIn - all through natural conversation in Claude.

**Goal:** Get you out of dashboards and into Claude in 5 minutes.

---

## One-Time Setup

### 1. Get Your API Key

1. Go to ${baseUrl} and sign in
2. Click **API Keys** > **Generate Key**
3. Copy the key (starts with \`sk_live_\`)

### 2. Save It (Terminal)

\`\`\`bash
security add-generic-password -a $USER -s SKILLOMATIC_API_KEY -w 'PASTE_KEY_HERE'
echo 'export SKILLOMATIC_API_KEY=$(security find-generic-password -a "$USER" -s "SKILLOMATIC_API_KEY" -w 2>/dev/null)' >> ~/.zshrc
source ~/.zshrc
\`\`\`

### 3. Install Skills

\`\`\`bash
mkdir -p ~/.claude/commands
\`\`\`

Download skills from ${baseUrl}/skills and move to \`~/.claude/commands/\`

---

## Start Using Claude

Open **Claude Code** or **Claude Desktop** and try:

\`\`\`
/ats-candidate-search

Senior backend engineer, 5+ years Python, Bay Area
\`\`\`

That's it. You're sourcing candidates through conversation now.

---

## What You Can Do

| Instead of... | Just ask Claude |
|---------------|-----------------|
| Clicking through ATS filters | \`/ats-candidate-search\` + paste job description |
| Manually searching LinkedIn | \`/linkedin-lookup\` + describe ideal candidate |
| Copy-pasting into spreadsheets | \`/daily-report\` for activity summaries |
| Typing candidate info into ATS | \`/ats-candidate-crud\` + "add Jane Doe..." |

Chain them together: *"Find Python engineers on LinkedIn, add the top 3 to our ATS, and draft outreach emails"*

---

## LinkedIn Setup (Optional)

For \`/linkedin-lookup\`, install the browser extension:

1. Get extension from IT (or load \`apps/skillomatic-scraper/\` in Chrome)
2. Click extension icon > enter API URL \`${baseUrl}\` + your API key
3. Stay logged into LinkedIn in Chrome

Guide: ${baseUrl}/api/extension

---

## Help

Stuck? Ask Claude: *"Run /skillomatic-health-check"*

API key issues? Regenerate at ${baseUrl}
`;

  return c.text(markdown, 200, {
    'Content-Type': 'text/markdown',
  });
});
