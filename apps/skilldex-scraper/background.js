// Skilldex Scraper - Background Service Worker
// Connects via WebSocket to receive scrape tasks in real-time

const DEFAULT_API_URL = 'http://localhost:3000';
const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 20000; // Keep alive every 20s (Chrome official recommendation)

let apiKey = null;
let apiUrl = DEFAULT_API_URL;
let ws = null;
let processingTask = null;
let pingIntervalId = null;
let reconnectTimeoutId = null;
let isConnecting = false;

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

// ============ WebSocket Connection ============

function getWsUrl() {
  const httpUrl = new URL(apiUrl);
  const wsProtocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${httpUrl.host}/ws/scrape?apiKey=${encodeURIComponent(apiKey)}&mode=extension`;
}

function connect() {
  if (!apiKey || isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }

  isConnecting = true;
  console.log('[WS] Connecting to', getWsUrl().replace(apiKey, '***'));

  try {
    ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      isConnecting = false;
      console.log('[WS] Connected');
      startPingInterval();
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Received:', data.type);

        if (data.type === 'task_assigned' && data.task) {
          await handleTaskAssignment(data.task);
        }

        if (data.type === 'pong') {
          // Connection is alive
        }
      } catch (err) {
        console.error('[WS] Message parse error:', err);
      }
    };

    ws.onclose = (event) => {
      isConnecting = false;
      console.log('[WS] Closed:', event.code, event.reason);
      cleanup();
      scheduleReconnect();
    };

    ws.onerror = (event) => {
      isConnecting = false;
      console.error('[WS] Error:', event);
      cleanup();
    };
  } catch (err) {
    isConnecting = false;
    console.error('[WS] Connection error:', err);
    scheduleReconnect();
  }
}

function disconnect() {
  cleanup();
  if (ws) {
    ws.close();
    ws = null;
  }
}

function cleanup() {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimeoutId || !apiKey) return;

  console.log(`[WS] Reconnecting in ${RECONNECT_DELAY_MS}ms...`);
  reconnectTimeoutId = setTimeout(() => {
    reconnectTimeoutId = null;
    connect();
  }, RECONNECT_DELAY_MS);
}

function startPingInterval() {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
  }
  pingIntervalId = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, PING_INTERVAL_MS);
}

// ============ Task Handling ============

async function handleTaskAssignment(task) {
  if (processingTask) {
    console.log('[Task] Already processing a task, ignoring new assignment');
    return;
  }

  console.log(`[Task] Received task ${task.id}: ${task.url}`);
  await processTask(task);
}

async function processTask(task) {
  processingTask = task;

  try {
    // Mark task as processing
    await updateTask(task.id, 'processing');

    // Scrape the URL
    const markdown = await scrapeUrl(task.url);
    await updateTask(task.id, 'completed', markdown);
    console.log(`[Task] ${task.id} completed successfully`);
  } catch (err) {
    console.error(`[Task] ${task.id} failed:`, err);
    await updateTask(task.id, 'failed', null, err.message);
  } finally {
    processingTask = null;
  }
}

// ============ API Calls ============

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
      console.error('[API] Failed to update task:', response.status);
    }
  } catch (err) {
    console.error('[API] Error updating task:', err);
  }
}

// ============ Scraping ============

async function scrapeUrl(url) {
  return new Promise((resolve, reject) => {
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

// Domain-specific exclusion/inclusion config (injected at runtime)
const DOMAIN_EXCLUSIONS = {
  "www.linkedin.com": {
    "inclusionSelectors": ["main"],
    "exclusionSelectors": [
      "div[class*='nav']",
      "div[class*='global']",
      ".visually-hidden",
      "footer",
      "div[class*='load']",
      "section.scaffold-layout-toolbar",
      "code",
      "aside",
      "style",
      "noscript",
      "iframe",
      "header",
      "header nav",
      ".advertisement",
      ".cookie-banner",
      ".ad-banner-container",
      ".pv-right-rail__empty-iframe",
      ".artdeco-toast-item",
      ".msg-overlay-list-bubble",
      ".msg-overlay-conversation-bubble",
      ".global-nav"
    ]
  },
  "github.com": {
    "inclusionSelectors": ["main", "article", ".markdown-body"],
    "exclusionSelectors": [
      "header", "nav", "footer", ".Layout-sidebar",
      ".js-header-wrapper", ".AppHeader", ".flash", ".pagehead-actions"
    ]
  },
  "stackoverflow.com": {
    "inclusionSelectors": ["#mainbar", "#question", ".answer"],
    "exclusionSelectors": [
      "header", "nav", "footer", ".left-sidebar",
      ".js-consent-banner", ".js-dismissable-hero", ".s-sidebarwidget", "#sidebar"
    ]
  },
  "_default": {
    "exclusionSelectors": [
      "script", "style", "noscript", "iframe", "link",
      "header nav", "footer", ".advertisement", ".cookie-banner",
      ".ad", ".ads", "[role='banner']", "[role='navigation']"
    ]
  }
};

// This function runs in the context of the page
function extractPageContent() {
  // Get domain config
  const hostname = window.location.hostname;
  const config = DOMAIN_EXCLUSIONS[hostname] || DOMAIN_EXCLUSIONS['_default'];
  const exclusionSelectors = config.exclusionSelectors || [];
  const inclusionSelectors = config.inclusionSelectors || null;

  function htmlToMarkdown(element) {
    let markdown = '';
    const tagName = element.tagName?.toLowerCase();

    if (['script', 'style', 'noscript', 'svg', 'iframe'].includes(tagName)) {
      return '';
    }

    if (element.hidden || element.style?.display === 'none') {
      return '';
    }

    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent?.trim();
      if (text) return text + ' ';
      return '';
    }

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
          return alt ? `[Image: ${alt}]` : '';
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

      if (index === 0) {
        markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      }
    });
    markdown += '\n';

    return markdown;
  }

  // Clone body to avoid modifying the actual page
  const tempDiv = document.createElement('div');

  // Use inclusion selectors if specified, otherwise use whole body
  if (inclusionSelectors && inclusionSelectors.length > 0) {
    inclusionSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        tempDiv.appendChild(el.cloneNode(true));
      });
    });
  } else {
    tempDiv.innerHTML = document.body.innerHTML;
  }

  // Remove excluded elements
  if (exclusionSelectors.length > 0) {
    const combinedSelector = exclusionSelectors.join(',');
    tempDiv.querySelectorAll(combinedSelector).forEach(el => el.remove());
  }

  // Build content
  const title = document.title || '';
  let content = '';
  if (title) {
    content += `# ${title}\n\n`;
  }
  content += `URL: ${window.location.href}\n\n`;
  content += '---\n\n';
  content += htmlToMarkdown(tempDiv);

  // Clean up
  content = content
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n +/g, '\n')
    .trim();

  // Truncate if too long (30KB limit)
  const MAX_LENGTH = 30 * 1024;
  if (content.length > MAX_LENGTH) {
    content = content.slice(0, MAX_LENGTH) + '\n\n[Content truncated...]';
  }

  return content;
}

// ============ Message Handling ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({
      connected: ws && ws.readyState === WebSocket.OPEN,
      apiKey: apiKey ? `${apiKey.slice(0, 10)}...` : null,
      apiUrl,
      processingTask: processingTask ? { id: processingTask.id, url: processingTask.url } : null,
    });
    return true;
  }

  if (message.type === 'SET_CONFIG') {
    saveConfig(message.apiKey, message.apiUrl).then(() => {
      // Disconnect existing connection and reconnect with new config
      disconnect();
      if (message.apiKey) {
        connect();
      }
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CONNECT') {
    connect();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'DISCONNECT') {
    disconnect();
    sendResponse({ success: true });
    return true;
  }
});

// ============ Initialization ============

async function init() {
  await loadConfig();
  if (apiKey) {
    connect();
  }
  console.log('[Skilldex] Scraper initialized');
}

init();
