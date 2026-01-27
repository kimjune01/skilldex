// Skillomatic Scraper - Background Service Worker
// Polls the API to receive scrape tasks

const DEFAULT_API_URL = 'https://api.skillomatic.technology';
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const THROTTLE_MIN_MS = 150;
const THROTTLE_MAX_MS = 250;
// Security: block sensitive domains where scraping would be inappropriate
const BLOCKED_DOMAINS = [
  'accounts.google.com',
  'login.microsoftonline.com',
  'signin.aws.amazon.com',
  '1password.com',
  'lastpass.com',
  'bitwarden.com',
];

let apiKey = null;
let apiUrl = DEFAULT_API_URL;
let processingTask = null;
let pollIntervalId = null;
let isPolling = false;
let lastError = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

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

// ============ Polling ============

function startPolling() {
  if (pollIntervalId || !apiKey) return;

  console.log('[Poll] Starting polling');
  isPolling = true;
  lastError = null;
  consecutiveErrors = 0;

  // Poll immediately, then at interval
  pollForTasks();
  pollIntervalId = setInterval(pollForTasks, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  isPolling = false;
  console.log('[Poll] Stopped polling');
}

async function pollForTasks() {
  if (!apiKey || processingTask) return;

  try {
    const response = await fetch(`${apiUrl}/v1/scrape/tasks?status=pending&claim=true`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        lastError = 'Invalid or expired API key. Please check your API key in the extension settings.';
        consecutiveErrors++;
      } else if (response.status === 403) {
        lastError = 'Access denied. Your API key may not have permission for scrape tasks.';
        consecutiveErrors++;
      } else {
        lastError = `API error: ${response.status}`;
        consecutiveErrors++;
      }

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        stopPolling();
        lastError = `Stopped polling after ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Last error: ${lastError}`;
      }
      return;
    }

    // Reset error state on success
    consecutiveErrors = 0;
    lastError = null;

    const data = await response.json();

    if (data.task) {
      console.log('[Poll] Claimed task:', data.task.id);
      await handleTaskAssignment(data.task);
    }
  } catch (err) {
    console.error('[Poll] Error:', err);
    consecutiveErrors++;

    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      lastError = `Cannot reach ${apiUrl}. Check your internet connection.`;
    } else {
      lastError = `Polling error: ${err.message}`;
    }

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      stopPolling();
      lastError = `Stopped polling after ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Last error: ${lastError}`;
    }
  }
}

// ============ Helpers ============

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    // Block sensitive domains
    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of BLOCKED_DOMAINS) {
      if (hostname === blocked || hostname.endsWith('.' + blocked)) {
        return false;
      }
    }
    // Allow all other URLs
    return true;
  } catch {
    return false;
  }
}

function randomThrottle() {
  const delay = Math.floor(Math.random() * (THROTTLE_MAX_MS - THROTTLE_MIN_MS + 1)) + THROTTLE_MIN_MS;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ============ Task Handling ============

async function handleTaskAssignment(task) {
  if (processingTask) {
    console.log('[Task] Already processing a task, ignoring new assignment');
    return;
  }

  // Validate URL is not blocked
  if (!isAllowedUrl(task.url)) {
    console.log(`[Task] Rejected task ${task.id}: URL blocked (${task.url})`);
    await updateTask(task.id, 'failed', null, 'URL blocked - this domain is not allowed for scraping');
    return;
  }

  console.log(`[Task] Received task ${task.id}: ${task.url}`);
  await processTask(task);
}

async function processTask(task) {
  processingTask = task;

  try {
    // Random throttle before scraping (150-250ms)
    await randomThrottle();

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

    const response = await fetch(`${apiUrl}/v1/scrape/tasks/${taskId}`, {
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
          // Determine which extractor to use based on URL
          const isLinkedIn = url.includes('linkedin.com');

          // Wait for dynamic content to load (LinkedIn is a heavy SPA)
          await new Promise(r => setTimeout(r, isLinkedIn ? 3000 : 1000));

          // Execute the appropriate content extractor
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: isLinkedIn ? extractLinkedInContent : extractGenericContent,
          });

          cleanup();

          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            // Provide more detail on what failed
            const detail = results ? `results[0]=${JSON.stringify(results[0])}` : 'no results';
            reject(new Error(`Failed to extract page content: ${detail}`));
          }
        } catch (err) {
          cleanup();
          reject(new Error(`Script execution failed: ${err.message}`));
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

// ============ Content Extractors ============
// These functions run in the context of the page via chrome.scripting.executeScript.
// IMPORTANT: Must be entirely self-contained - no imports or external references.
// See extractors/*.js for the source files.

/**
 * LinkedIn-specific content extractor
 */
function extractLinkedInContent() {
  try {
    const config = {
      inclusionSelectors: ["main"],
      exclusionSelectors: [
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
    };

    function cleanHtmlDom(container) {
      container.querySelectorAll('img').forEach(img => img.remove());
      container.querySelectorAll('a').forEach(anchor => {
        const textContent = anchor.textContent || '';
        const textNode = document.createTextNode(textContent);
        anchor.parentNode?.replaceChild(textNode, anchor);
      });
      const unwantedSelectors = [
        'script', 'style', 'noscript', 'iframe', 'link', 'svg',
        'button', 'input', 'textarea', 'select', 'form'
      ];
      unwantedSelectors.forEach(selector => {
        container.querySelectorAll(selector).forEach(el => el.remove());
      });
      // Remove specific UI noise elements (be conservative to avoid removing content)
      const linkedinNoiseSelectors = [
        '.artdeco-dropdown__content',
        '.artdeco-modal',
        '.share-box',
        '.feed-shared-update-v2__description-wrapper'
      ];
      linkedinNoiseSelectors.forEach(selector => {
        try {
          container.querySelectorAll(selector).forEach(el => el.remove());
        } catch (e) { /* ignore */ }
      });
      container.querySelectorAll('table, tr, td, th, tbody, thead, tfoot, caption').forEach(el => {
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.remove();
      });
      function flattenSingleChildParents(element) {
        let child = element.firstElementChild;
        while (
          element.children.length === 1 &&
          element !== container &&
          (!element.textContent || element.textContent.trim() === child?.textContent?.trim())
        ) {
          const parent = element.parentElement;
          if (!parent) break;
          parent.replaceChild(child, element);
          element = child;
          child = element.firstElementChild;
        }
        Array.from(element.children).forEach(flattenSingleChildParents);
      }
      Array.from(container.children).forEach(flattenSingleChildParents);
      container.querySelectorAll('div, p, span, li, ul, ol, h1, h2, h3, h4, h5, h6, section, article').forEach(el => {
        if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) {
          el.remove();
        }
      });
      return container;
    }

    function htmlToMarkdown(element) {
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'svg', 'iframe'].includes(tagName)) return '';
      if (element.hidden || element.style?.display === 'none') return '';
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim();
        if (text) return text + ' ';
        return '';
      }
      if (element.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(element.childNodes).map(child => htmlToMarkdown(child)).join('');
        switch (tagName) {
          case 'h1': return `\n\n## ${children.trim()}\n\n`;
          case 'h2': return `\n\n### ${children.trim()}\n\n`;
          case 'h3': return `\n\n#### ${children.trim()}\n\n`;
          case 'h4': case 'h5': case 'h6': return `\n\n**${children.trim()}**\n\n`;
          case 'p': const trimmed = children.trim(); return trimmed ? `\n${trimmed}\n` : '';
          case 'br': return '\n';
          case 'hr': return '\n---\n';
          case 'strong': case 'b': return `**${children.trim()}**`;
          case 'em': case 'i': return `*${children.trim()}*`;
          case 'ul': return `\n${Array.from(element.children).map(li => `- ${htmlToMarkdown(li).trim()}`).filter(line => line !== '- ').join('\n')}\n`;
          case 'ol': return `\n${Array.from(element.children).map((li, i) => `${i + 1}. ${htmlToMarkdown(li).trim()}`).filter(line => !line.match(/^\d+\. $/)).join('\n')}\n`;
          case 'li': return children;
          default: return children;
        }
      }
      return '';
    }

    function processMarkdown(markdown) {
      let processed = markdown.replace(/\n{3,}/g, '\n\n').replace(/\n\s*\n\s*\n/g, '\n\n').replace(/\*\*\s*\*\*/g, '').replace(/\*\s*\*/g, '');
      let lines = processed.split('\n');
      // Remove exact duplicate consecutive lines only
      lines = lines.filter((line, idx, arr) => {
        if (idx === 0) return true;
        const prevLine = arr[idx - 1].trim();
        const currLine = line.trim();
        // Only remove exact duplicates, not partial matches
        if (prevLine === currLine && currLine !== '') return false;
        return true;
      });
      lines = lines.map(line => {
        const words = line.split(/(\s+)/);
        const filtered = words.filter((word, idx, arr) => {
          if (/^\s+$/.test(word)) return true;
          let prevIdx = idx - 1;
          while (prevIdx >= 0 && /^\s+$/.test(arr[prevIdx])) prevIdx--;
          return prevIdx < 0 || word !== arr[prevIdx];
        });
        return filtered.join('');
      });
      lines = lines.map(line => {
        if (line.length % 2 === 1) {
          const mid = Math.floor(line.length / 2);
          if (line[mid] === ' ') {
            const front = line.slice(0, mid);
            const back = line.slice(mid + 1);
            if (front === back) return front;
          }
        }
        return line;
      });
      const noisePatterns = [
        /^Show all \d+/i, /^Show (more|less|details|project)$/i, /^Edit$/i, /^Save$/i,
        /^Saved items$/i, /^Send profile in a message$/i, /^Save to PDF$/i, /^Get started$/i,
        /^Add project$/i, /^Contact info$/i, /^About this profile$/i, /^\d+ profile views?$/i,
        /^\d+ post impressions?$/i, /^\d+ search appearances?$/i, /^Discover who/i,
        /^Check out who/i, /^See how often/i, /^Private to you$/i, /^Suggested for you/i,
        /^Analytics/i, /^Associated with/i, /^Show all (companies|groups|schools)$/i,
        /^Create a post$/i, /^\d+ followers?$/i, /^\d+ members?$/i, /^Past \d+ days?$/i,
      ];
      lines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        return !noisePatterns.some(pattern => pattern.test(trimmed));
      });
      return lines.join('\n').trim();
    }

    const tempDiv = document.createElement('div');
    if (config.inclusionSelectors.length > 0) {
      config.inclusionSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          tempDiv.appendChild(el.cloneNode(true));
        });
      });
    } else {
      tempDiv.innerHTML = document.body.innerHTML;
    }
    const combinedSelector = config.exclusionSelectors.join(',');
    tempDiv.querySelectorAll(combinedSelector).forEach(el => el.remove());
    cleanHtmlDom(tempDiv);
    let markdown = htmlToMarkdown(tempDiv);
    markdown = processMarkdown(markdown);

    const title = document.title || '';
    let content = '';
    if (title) content += `# ${title.replace(' | LinkedIn', '')}\n\n`;
    content += `URL: ${window.location.href}\n\n---\n\n`;
    content += markdown;
    content = content.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();

    const MAX_LENGTH = 30 * 1024;
    if (content.length > MAX_LENGTH) {
      content = content.slice(0, MAX_LENGTH) + '\n\n[Content truncated...]';
    }
    return content;
  } catch (err) {
    return `ERROR: ${err.message}\nStack: ${err.stack}`;
  }
}

/**
 * Generic content extractor for non-LinkedIn pages
 */
function extractGenericContent() {
  try {
    function htmlToMarkdown(element) {
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'svg', 'iframe'].includes(tagName)) return '';
      if (element.hidden || element.style?.display === 'none') return '';
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim();
        if (text) return text + ' ';
        return '';
      }
      if (element.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(element.childNodes).map(child => htmlToMarkdown(child)).join('');
        switch (tagName) {
          case 'h1': return `\n\n# ${children.trim()}\n\n`;
          case 'h2': return `\n\n## ${children.trim()}\n\n`;
          case 'h3': return `\n\n### ${children.trim()}\n\n`;
          case 'h4': return `\n\n#### ${children.trim()}\n\n`;
          case 'h5': return `\n\n##### ${children.trim()}\n\n`;
          case 'h6': return `\n\n###### ${children.trim()}\n\n`;
          case 'p': const trimmed = children.trim(); return trimmed ? `\n${trimmed}\n` : '';
          case 'br': return '\n';
          case 'hr': return '\n---\n';
          case 'strong': case 'b': return `**${children.trim()}**`;
          case 'em': case 'i': return `*${children.trim()}*`;
          case 'code': return `\`${children.trim()}\``;
          case 'pre': return `\n\`\`\`\n${children.trim()}\n\`\`\`\n`;
          case 'blockquote': return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n`;
          case 'a':
            const href = element.getAttribute('href');
            const text = children.trim();
            if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
              const absoluteHref = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
              return `[${text}](${absoluteHref})`;
            }
            return text;
          case 'img':
            const alt = element.getAttribute('alt') || '';
            return alt ? `[Image: ${alt}]` : '';
          case 'ul': return `\n${Array.from(element.children).map(li => `- ${htmlToMarkdown(li).trim()}`).filter(line => line !== '- ').join('\n')}\n`;
          case 'ol': return `\n${Array.from(element.children).map((li, i) => `${i + 1}. ${htmlToMarkdown(li).trim()}`).filter(line => !line.match(/^\d+\. $/)).join('\n')}\n`;
          case 'li': return children;
          case 'table': return convertTable(element);
          default: return children;
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
        if (index === 0) markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      });
      markdown += '\n';
      return markdown;
    }

    const tempDiv = document.createElement('div');
    const mainContent = document.querySelector('main') ||
                        document.querySelector('article') ||
                        document.querySelector('[role="main"]') ||
                        document.body;
    tempDiv.innerHTML = mainContent.innerHTML;

    const unwantedSelectors = [
      'script', 'style', 'noscript', 'iframe', 'link', 'svg',
      'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ad', '[class*="cookie"]', '[class*="banner"]',
      '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
      'button', 'input', 'textarea', 'select', 'form'
    ];
    unwantedSelectors.forEach(selector => {
      try { tempDiv.querySelectorAll(selector).forEach(el => el.remove()); } catch (e) { /* ignore */ }
    });
    tempDiv.querySelectorAll('div, p, span, li, ul, ol, section, article').forEach(el => {
      if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) el.remove();
    });

    let markdown = htmlToMarkdown(tempDiv);
    markdown = markdown.replace(/\n{3,}/g, '\n\n').replace(/\n\s*\n\s*\n/g, '\n\n').replace(/\*\*\s*\*\*/g, '').replace(/\*\s*\*/g, '').replace(/[ \t]+/g, ' ').trim();

    const title = document.title || '';
    let content = '';
    if (title) content += `# ${title}\n\n`;
    content += `URL: ${window.location.href}\n\n---\n\n`;
    content += markdown;

    const MAX_LENGTH = 30 * 1024;
    if (content.length > MAX_LENGTH) {
      content = content.slice(0, MAX_LENGTH) + '\n\n[Content truncated...]';
    }
    return content;
  } catch (err) {
    return `ERROR: ${err.message}\nStack: ${err.stack}`;
  }
}

// ============ Message Handling ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({
      connected: isPolling && !lastError,
      connecting: false,
      apiKey: apiKey ? `${apiKey.slice(0, 10)}...` : null,
      apiUrl,
      processingTask: processingTask ? { id: processingTask.id, url: processingTask.url } : null,
      lastError,
      isPolling,
    });
    return true;
  }

  if (message.type === 'SET_CONFIG') {
    saveConfig(message.apiKey, message.apiUrl).then(() => {
      // Reset error state
      lastError = null;
      consecutiveErrors = 0;
      // Stop existing polling and restart with new config
      stopPolling();
      if (message.apiKey) {
        startPolling();
      }
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CLEAR_ERROR') {
    lastError = null;
    consecutiveErrors = 0;
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'CONNECT') {
    startPolling();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'DISCONNECT') {
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
  console.log('[Skillomatic] Scraper initialized (polling mode)');
}

init();
