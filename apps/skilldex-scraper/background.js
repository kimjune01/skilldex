// Skilldex Scraper - Background Service Worker
// Polls for pending scrape tasks and processes them

const POLL_INTERVAL_MS = 5000; // 5 seconds
const DEFAULT_API_URL = 'http://localhost:3000';

let isPolling = false;
let pollTimeoutId = null;
let apiKey = null;
let apiUrl = DEFAULT_API_URL;
let processingTask = null;

// ============ Storage ============

async function loadConfig() {
  const result = await chrome.storage.local.get(['apiKey', 'apiUrl']);
  apiKey = result.apiKey || null;
  apiUrl = result.apiUrl || DEFAULT_API_URL;
  return { apiKey, apiUrl };
}

async function saveConfig(key, url) {
  apiKey = key;
  apiUrl = url || DEFAULT_API_URL;
  await chrome.storage.local.set({ apiKey: key, apiUrl: apiUrl });
}

// ============ API Calls ============

async function claimPendingTask() {
  if (!apiKey) return null;

  try {
    const response = await fetch(`${apiUrl}/api/v1/scrape/tasks?status=pending&claim=true`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to claim task:', response.status);
      return null;
    }

    const data = await response.json();
    return data.task || null;
  } catch (err) {
    console.error('Error claiming task:', err);
    return null;
  }
}

async function updateTask(taskId, status, result, errorMessage) {
  if (!apiKey) return;

  try {
    const body = { status };
    if (result) body.result = result;
    if (errorMessage) body.errorMessage = errorMessage;

    const response = await fetch(`${apiUrl}/api/v1/scrape/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Failed to update task:', response.status);
    }
  } catch (err) {
    console.error('Error updating task:', err);
  }
}

// ============ Scraping ============

async function scrapeUrl(url) {
  return new Promise((resolve, reject) => {
    // Create a tab to load the page
    chrome.tabs.create({ url, active: false }, async (tab) => {
      const tabId = tab.id;
      let timeoutId;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        try {
          chrome.tabs.remove(tabId);
        } catch (e) {
          // Tab might already be closed
        }
      };

      // Set timeout for scraping (30 seconds)
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Scrape timeout - page took too long to load'));
        }
      }, 30000);

      // Wait for the tab to finish loading
      const onUpdated = async (updatedTabId, changeInfo) => {
        if (updatedTabId !== tabId || changeInfo.status !== 'complete' || resolved) {
          return;
        }

        resolved = true;
        chrome.tabs.onUpdated.removeListener(onUpdated);

        try {
          // Wait a bit for dynamic content to load
          await new Promise(r => setTimeout(r, 1000));

          // Execute content script to extract page content
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: extractPageContent,
          });

          cleanup();

          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            reject(new Error('Failed to extract page content'));
          }
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      // Handle tab closed
      const onRemoved = (removedTabId) => {
        if (removedTabId === tabId && !resolved) {
          resolved = true;
          chrome.tabs.onRemoved.removeListener(onRemoved);
          chrome.tabs.onUpdated.removeListener(onUpdated);
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error('Tab was closed before scraping completed'));
        }
      };

      chrome.tabs.onRemoved.addListener(onRemoved);
    });
  });
}

// This function runs in the context of the page
function extractPageContent() {
  // Simple HTML to Markdown conversion
  // We use a basic approach here; Turndown can be injected for better conversion

  function htmlToMarkdown(element) {
    let markdown = '';
    const tagName = element.tagName?.toLowerCase();

    // Skip script, style, and hidden elements
    if (['script', 'style', 'noscript', 'svg', 'iframe'].includes(tagName)) {
      return '';
    }

    if (element.hidden || element.style?.display === 'none') {
      return '';
    }

    // Handle text nodes
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent?.trim();
      if (text) return text + ' ';
      return '';
    }

    // Handle elements
    if (element.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(element.childNodes)
        .map(child => htmlToMarkdown(child))
        .join('');

      switch (tagName) {
        case 'h1':
          return `\n# ${children.trim()}\n\n`;
        case 'h2':
          return `\n## ${children.trim()}\n\n`;
        case 'h3':
          return `\n### ${children.trim()}\n\n`;
        case 'h4':
          return `\n#### ${children.trim()}\n\n`;
        case 'h5':
          return `\n##### ${children.trim()}\n\n`;
        case 'h6':
          return `\n###### ${children.trim()}\n\n`;
        case 'p':
          return `\n${children.trim()}\n\n`;
        case 'br':
          return '\n';
        case 'hr':
          return '\n---\n\n';
        case 'strong':
        case 'b':
          return `**${children.trim()}**`;
        case 'em':
        case 'i':
          return `*${children.trim()}*`;
        case 'code':
          return `\`${children.trim()}\``;
        case 'pre':
          return `\n\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
        case 'blockquote':
          return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
        case 'a':
          const href = element.getAttribute('href');
          const text = children.trim();
          if (href && text) {
            return `[${text}](${href})`;
          }
          return text;
        case 'img':
          const alt = element.getAttribute('alt') || '';
          const src = element.getAttribute('src') || '';
          if (src) {
            return `![${alt}](${src})`;
          }
          return '';
        case 'ul':
          return `\n${Array.from(element.children)
            .map(li => `- ${htmlToMarkdown(li).trim()}`)
            .join('\n')}\n\n`;
        case 'ol':
          return `\n${Array.from(element.children)
            .map((li, i) => `${i + 1}. ${htmlToMarkdown(li).trim()}`)
            .join('\n')}\n\n`;
        case 'li':
          return children;
        case 'table':
          return convertTable(element);
        case 'div':
        case 'section':
        case 'article':
        case 'main':
        case 'header':
        case 'footer':
        case 'aside':
        case 'nav':
        case 'span':
          return children;
        default:
          return children;
      }
    }

    return '';
  }

  function convertTable(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let markdown = '\n';
    rows.forEach((row, index) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowContent = cells.map(cell => cell.textContent?.trim() || '').join(' | ');
      markdown += `| ${rowContent} |\n`;

      // Add separator after header row
      if (index === 0) {
        markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      }
    });
    markdown += '\n';

    return markdown;
  }

  // Get page title and main content
  const title = document.title || '';
  const body = document.body;

  let content = '';
  if (title) {
    content += `# ${title}\n\n`;
  }
  content += `URL: ${window.location.href}\n\n`;
  content += '---\n\n';

  // Try to find main content area
  const mainContent = document.querySelector('main, article, [role="main"], .content, #content');
  if (mainContent) {
    content += htmlToMarkdown(mainContent);
  } else {
    content += htmlToMarkdown(body);
  }

  // Clean up excessive whitespace
  content = content
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return content;
}

// ============ Task Processing ============

async function processTask(task) {
  processingTask = task;
  console.log(`Processing task ${task.id}: ${task.url}`);

  try {
    const markdown = await scrapeUrl(task.url);
    await updateTask(task.id, 'completed', markdown);
    console.log(`Task ${task.id} completed successfully`);
  } catch (err) {
    console.error(`Task ${task.id} failed:`, err);
    await updateTask(task.id, 'failed', null, err.message);
  } finally {
    processingTask = null;
  }
}

// ============ Polling ============

async function poll() {
  if (!apiKey || processingTask) {
    schedulePoll();
    return;
  }

  try {
    const task = await claimPendingTask();
    if (task) {
      await processTask(task);
    }
  } catch (err) {
    console.error('Poll error:', err);
  }

  schedulePoll();
}

function schedulePoll() {
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
  }
  pollTimeoutId = setTimeout(poll, POLL_INTERVAL_MS);
}

function startPolling() {
  if (isPolling) return;
  isPolling = true;
  console.log('Starting poll loop');
  poll();
}

function stopPolling() {
  isPolling = false;
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }
  console.log('Stopped polling');
}

// ============ Message Handling ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({
      isPolling,
      apiKey: apiKey ? `${apiKey.slice(0, 10)}...` : null,
      apiUrl,
      processingTask: processingTask ? { id: processingTask.id, url: processingTask.url } : null,
    });
    return true;
  }

  if (message.type === 'SET_CONFIG') {
    saveConfig(message.apiKey, message.apiUrl).then(() => {
      if (message.apiKey) {
        startPolling();
      } else {
        stopPolling();
      }
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'START_POLLING') {
    startPolling();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'STOP_POLLING') {
    stopPolling();
    sendResponse({ success: true });
    return true;
  }
});

// ============ Initialization ============

async function init() {
  await loadConfig();
  if (apiKey) {
    startPolling();
  }
  console.log('Skilldex Scraper initialized');
}

init();
