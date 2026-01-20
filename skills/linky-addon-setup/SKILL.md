---
name: linky-addon-setup
description: Install and configure the Linky Scraper browser addon for LinkedIn profile extraction. Required for LinkedIn candidate search.
intent: I want to set up the Linky browser addon
capabilities:
  - Download and install Linky Scraper
  - Configure browser extension
  - Verify LinkedIn access
allowed-tools:
  - Bash
  - Read
---

# Linky Scraper Addon Setup

You are a setup assistant that helps install and configure the Linky Scraper browser addon for LinkedIn profile extraction.

## What is Linky Scraper?

Linky Scraper is a browser extension that enables automated extraction of LinkedIn profile data. It's required for the `/linkedin-lookup` skill to function properly.

**Repository:** https://github.com/kimjune01/linky-scraper-addon

## Prerequisites

- Google Chrome or Chromium-based browser (Edge, Brave, etc.)
- Node.js 18+ and pnpm installed
- Git installed

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/kimjune01/linky-scraper-addon.git
cd linky-scraper-addon
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Build the Extension

```bash
pnpm build
```

This creates a `dist/` folder containing the built extension.

### Step 4: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from the cloned repository
5. The Linky Scraper extension should now appear in your extensions list

### Step 5: Verify Installation

1. Navigate to LinkedIn (https://www.linkedin.com)
2. Make sure you're logged in to your LinkedIn account
3. Click the Linky Scraper extension icon in your browser toolbar
4. You should see the extension popup with connection status

## Usage with LinkedIn Lookup

Once installed, the `/linkedin-lookup` skill can use Linky Scraper to:
- Search for candidate profiles on LinkedIn
- Extract profile information (name, headline, experience, skills)
- Navigate through search results

## Troubleshooting

### Extension not loading
- Ensure Developer mode is enabled in `chrome://extensions/`
- Try rebuilding: `pnpm build`
- Check the console in `chrome://extensions/` for errors

### LinkedIn not connecting
- Make sure you're logged into LinkedIn in the same browser
- Try refreshing the LinkedIn page
- Check if LinkedIn has blocked automation (try again later)

### Build errors
- Ensure Node.js 18+ is installed: `node --version`
- Ensure pnpm is installed: `pnpm --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`

## Keeping Updated

To update the extension to the latest version:

```bash
cd linky-scraper-addon
git pull origin main
pnpm install
pnpm build
```

Then reload the extension in `chrome://extensions/` by clicking the refresh icon.

## Security Notes

- The extension only activates on LinkedIn pages
- Profile data is processed locally in your browser
- No data is sent to external servers (except through Skilldex API when using skills)
- You can review the source code at the GitHub repository

## Next Steps

After installing Linky Scraper, you can use:
- `/linkedin-lookup` - Search for candidates matching a job description
