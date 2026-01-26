# Skillomatic Scraper Extension

A Chrome extension that polls the Skillomatic API for pending scrape tasks and returns markdown content.

## Installation

### Development

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory

### Adding Icons

The extension requires icon files. You can create simple icons or use placeholder images:

```
icons/
  icon16.png   (16x16 pixels)
  icon48.png   (48x48 pixels)
  icon128.png  (128x128 pixels)
```

You can use any image editor or online tool to create these. Recommended: Simple "S" letter on a purple (#4f46e5) background.

## Configuration

1. Click the extension icon in Chrome toolbar
2. Enter your Skillomatic API URL (default: `https://api.skillomatic.technology`)
3. Enter your Skillomatic API key (starts with `sk_`)
4. Click "Save & Connect"

## How It Works

1. The extension polls `/v1/scrape/tasks?status=pending&claim=true` every 5 seconds
2. When a task is claimed, it opens the URL in a background tab
3. After the page loads, it extracts the content and converts to Markdown
4. The result is PUT back to `/v1/scrape/tasks/:id`

## Troubleshooting

### "Not connected" status
- Make sure the API URL is correct and the server is running
- Check that your API key is valid

### Scraping fails
- Some sites block automated access
- Check browser console for errors
- Ensure the site doesn't require authentication

## Privacy

- The extension only accesses URLs requested by your Skillomatic instance
- No data is sent to third parties
- All communication is with your configured Skillomatic API
