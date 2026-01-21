// Skilldex Scraper - Popup Script

// Views
const connectedView = document.getElementById('connectedView');
const configView = document.getElementById('configView');

// Connected view elements
const connectedDot = document.getElementById('connectedDot');
const connectedText = document.getElementById('connectedText');
const serverUrl = document.getElementById('serverUrl');
const processingInfo = document.getElementById('processingInfo');
const processingUrl = document.getElementById('processingUrl');
const disconnectBtn = document.getElementById('disconnectBtn');

// Config view elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const readFromPageBtn = document.getElementById('readFromPageBtn');

const messageEl = document.getElementById('message');

let currentStatus = null;

// ============ UI Updates ============

function updateUI(status) {
  currentStatus = status;

  if (status.connected && status.apiKey) {
    // Show connected view
    connectedView.style.display = 'block';
    configView.style.display = 'none';

    // Update server URL display
    if (status.apiUrl) {
      try {
        const url = new URL(status.apiUrl);
        serverUrl.textContent = url.host;
      } catch {
        serverUrl.textContent = status.apiUrl;
      }
    }

    // Update connected view
    if (status.processingTask) {
      connectedDot.className = 'status-dot processing';
      connectedText.textContent = 'Processing';
      processingInfo.style.display = 'block';
      processingUrl.textContent = status.processingTask.url;
    } else {
      connectedDot.className = 'status-dot active';
      connectedText.textContent = 'Connected';
      processingInfo.style.display = 'none';
    }
  } else {
    // Show config view
    connectedView.style.display = 'none';
    configView.style.display = 'block';

    // Update config view status
    if (status.apiKey) {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Disconnected';
      apiKeyStatus.textContent = status.apiKey;
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Not configured';
      apiKeyStatus.textContent = 'Not configured';
    }
  }
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

// ============ Actions ============

async function loadStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    updateUI(status);

    // Load saved values into inputs
    const stored = await chrome.storage.local.get(['apiKey', 'apiUrl']);
    if (stored.apiUrl) {
      apiUrlInput.value = stored.apiUrl;
    }
    if (stored.apiKey) {
      apiKeyInput.value = stored.apiKey;
    }
  } catch (err) {
    console.error('Failed to load status:', err);
    showMessage('Failed to connect to extension', 'error');
  }
}

async function saveConfig() {
  const apiUrl = apiUrlInput.value.trim() || 'http://localhost:3000';
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showMessage('API key is required', 'error');
    return;
  }

  // Validate API key format
  if (!apiKey.startsWith('sk_')) {
    showMessage('Invalid API key format (should start with sk_)', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // Test the API connection first
    const testResponse = await fetch(`${apiUrl}/api/v1/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!testResponse.ok) {
      throw new Error('Invalid API key or API not reachable');
    }

    // Save config
    await chrome.runtime.sendMessage({
      type: 'SET_CONFIG',
      apiKey,
      apiUrl,
    });

    showMessage('Connected successfully!', 'success');
    await loadStatus();
  } catch (err) {
    console.error('Failed to save config:', err);
    showMessage(err.message || 'Failed to connect', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save & Connect';
  }
}

async function disconnect() {
  await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
  await loadStatus();
}

async function getConfigFromPage() {
  // Get the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return null;
  }

  // Inject script to read config from the page
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const pageText = document.body.innerText;

      // Match API key pattern: sk_live_... or sk_test_...
      const apiKeyMatch = pageText.match(/sk_(live|test)_[a-f0-9]{64}/);

      // Get the API URL
      let apiUrl = window.location.origin;

      // Check for explicit API URL in page meta or data attribute
      const apiUrlMeta = document.querySelector('meta[name="skilldex-api-url"]');
      const apiUrlData = document.querySelector('[data-api-url]');

      if (apiUrlMeta) {
        apiUrl = apiUrlMeta.content;
      } else if (apiUrlData) {
        apiUrl = apiUrlData.dataset.apiUrl;
      } else if (apiUrl.includes(':5173')) {
        // Dev environment: web is on 5173, API is on 3000
        apiUrl = apiUrl.replace(':5173', ':3000');
      }

      // Check if this looks like a Skilldex page
      const isSkilldex = document.title.includes('Skilldex') ||
                        pageText.includes('SKILLDEX_API_KEY') ||
                        document.querySelector('[data-skilldex]');

      if (!isSkilldex || !apiKeyMatch) {
        return null;
      }

      return {
        apiKey: apiKeyMatch[0],
        apiUrl: apiUrl
      };
    }
  });

  return results[0]?.result || null;
}

async function autoConfigureFromPage() {
  try {
    const config = await getConfigFromPage();

    if (!config) {
      return; // Silently fail - user might not be on Skilldex page
    }

    // Test and save the config
    const testResponse = await fetch(`${config.apiUrl}/api/v1/me`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    });

    if (!testResponse.ok) {
      return;
    }

    // Save config
    await chrome.runtime.sendMessage({
      type: 'SET_CONFIG',
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    });

    // Update UI
    apiUrlInput.value = config.apiUrl;
    apiKeyInput.value = config.apiKey;
    showMessage('Auto-connected from Skilldex page!', 'success');
    await loadStatus();
  } catch (err) {
    // Silently fail
    console.error('Auto-configure failed:', err);
  }
}

async function readFromPage() {
  readFromPageBtn.disabled = true;
  readFromPageBtn.textContent = 'Reading...';

  try {
    const config = await getConfigFromPage();

    if (!config) {
      throw new Error('No Skilldex config found. Go to your Skilldex dashboard first.');
    }

    // Fill in the form
    apiUrlInput.value = config.apiUrl;
    apiKeyInput.value = config.apiKey;

    showMessage('Config loaded! Click Save & Connect.', 'success');
  } catch (err) {
    console.error('Failed to read from page:', err);
    showMessage(err.message || 'Failed to read from page', 'error');
  } finally {
    readFromPageBtn.disabled = false;
    readFromPageBtn.textContent = 'Read from Skilldex Page';
  }
}

// ============ Event Listeners ============

saveBtn.addEventListener('click', saveConfig);
readFromPageBtn.addEventListener('click', readFromPage);
disconnectBtn.addEventListener('click', disconnect);

// Handle enter key in inputs
apiKeyInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveConfig();
});

apiUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveConfig();
});

// Help link
document.getElementById('helpLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://skilldex.yourcompany.com/docs/extension' });
});

// ============ Initialization ============

// Poll for status updates while popup is open
let statusInterval;

document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();

  // Auto-configure from page if not configured yet
  const stored = await chrome.storage.local.get(['apiKey']);
  if (!stored.apiKey) {
    await autoConfigureFromPage();
  }

  statusInterval = setInterval(loadStatus, 2000);
});

// Clean up interval when popup closes
window.addEventListener('unload', () => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});
