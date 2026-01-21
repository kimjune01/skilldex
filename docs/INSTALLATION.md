# Getting Started with Skilldex

This guide covers getting started with Skilldex for recruiters. Skilldex works with Claude Desktop, Claude Code, and other AI assistants.

## Quick Start

1. **Log in** to your Skilldex instance (URL provided by your admin)
2. **Generate API key** in Settings > API Keys
3. **Install browser extension** for LinkedIn lookup
4. **Start using** skills in Claude

## Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SKILLDEX ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  YOUR BROWSER                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           ││
│  │  │ Skilldex Web │  │ Skilldex Ext │  │ LLM Provider │           ││
│  │  │ (Chat UI)    │  │ (LinkedIn)   │  │ (direct)     │           ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘           ││
│  │         │                 │                 │                    ││
│  │         └─────────────────┴─────────────────┘                    ││
│  │                All data stays in your browser                    ││
│  └──────────────────────────────────────────────────────────────────┘│
│                              │                                        │
│                              │ Auth only                              │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Skilldex Cloud - Skills library, auth, coordination             ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Privacy by design:** Chat conversations and ATS data never leave your browser. Skilldex servers only handle authentication and skill delivery.

## Step 1: Create Your Account

1. Navigate to your Skilldex instance (provided by your admin)
2. Log in with credentials or SSO
3. Complete any required onboarding steps

## Step 2: Generate API Key

1. Go to **Settings > API Keys**
2. Click **Generate Key**
3. Copy the key (starts with `sk_live_`)

You can view your API key anytime from the dashboard.

## Step 3: Install Browser Extension

The Skilldex Scraper extension enables LinkedIn lookup using your authenticated LinkedIn session.

### Chrome Installation

1. Get the extension from your IT department or:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the extension folder

2. Click the **Skilldex Scraper** icon in your toolbar

3. Configure:
   - **API URL**: Your Skilldex instance URL
   - **API Key**: Your `sk_live_...` key

4. Click **Save & Connect**

The status should show a green dot when connected.

### How LinkedIn Lookup Works

1. You ask Claude to find candidates on LinkedIn
2. Skilldex creates a "scrape task" for the LinkedIn URL
3. The browser extension (running in your Chrome) picks up the task
4. It opens LinkedIn **in your browser session** (you're already logged in)
5. The extension extracts the page content and returns it to the chat
6. Claude analyzes the profiles and presents results

**Key benefit:** Your LinkedIn session is used, so no separate authentication is needed.

## Step 4: Using the Chat

Navigate to **Chat** in the Skilldex sidebar to start using skills.

### Example: LinkedIn Lookup

```
Find senior Python developers with AWS experience in San Francisco
```

Claude will:
1. Search LinkedIn using your session
2. Extract relevant profiles
3. Present a summary of matching candidates

### Example: ATS Search

```
Show me candidates in our pipeline for the Senior Engineer role
```

Claude will:
1. Query your connected ATS
2. Retrieve matching candidates
3. Present details and status

## Available Skills

Skills are organized by what they can do:

| Category | Skills | Requirements |
|----------|--------|--------------|
| **Sourcing** | LinkedIn lookup, candidate search | Browser extension |
| **ATS** | Candidate CRUD, pipeline management | ATS integration |
| **Communication** | Email drafts, outreach templates | Email integration |
| **Productivity** | Daily reports, summaries | None |

View all available skills in the **Skills** section of the sidebar.

## Troubleshooting

### "Extension not connecting"

1. Check the extension icon shows a green status
2. Verify API URL and key are correct
3. Try clicking "Reconnect"

### "LinkedIn lookup not working"

1. Make sure you're logged into LinkedIn in Chrome
2. Check the extension is running (green status)
3. LinkedIn may rate-limit - wait a few minutes
4. Ensure popup blocker isn't blocking new tabs

### "Skills not appearing"

1. Refresh the page
2. Check your role has access to the skill (ask admin)
3. Verify API key is valid

### "401 Unauthorized"

1. Your API key may be expired or revoked
2. Go to Settings > API Keys
3. Generate a new key

## Security Notes

### Your Data Stays Local

- Chat conversations exist only in your browser
- ATS data is fetched directly, not stored
- LinkedIn content is processed client-side
- Skilldex servers only see metadata (skill usage logs)

### API Key Safety

- Never share your API key
- Revoke immediately if compromised
- Your admin can view/revoke keys if needed

## Getting Help

- **Account issues**: Contact your Skilldex admin
- **Feature requests**: Use the Chat to propose new skills
- **Technical problems**: Contact IT support
