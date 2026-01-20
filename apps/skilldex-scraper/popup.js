// Skilldex Scraper - Popup Script

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const processingInfo = document.getElementById('processingInfo');
const processingUrl = document.getElementById('processingUrl');
const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const toggleBtn = document.getElementById('toggleBtn');
const messageEl = document.getElementById('message');

let currentStatus = null;

// ============ UI Updates ============

function updateUI(status) {
  currentStatus = status;

  // Update status indicator
  if (status.processingTask) {
    statusDot.className = 'status-dot processing';
    statusText.textContent = 'Processing';
    processingInfo.style.display = 'block';
    processingUrl.textContent = status.processingTask.url;
  } else if (status.isPolling && status.apiKey) {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'Polling';
    processingInfo.style.display = 'none';
  } else {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = status.apiKey ? 'Paused' : 'Not connected';
    processingInfo.style.display = 'none';
  }

  // Update API key status
  if (status.apiKey) {
    apiKeyStatus.textContent = status.apiKey;
  } else {
    apiKeyStatus.textContent = 'Not configured';
  }

  // Update toggle button
  if (status.isPolling) {
    toggleBtn.textContent = 'Stop Polling';
  } else {
    toggleBtn.textContent = 'Start Polling';
  }

  // Enable/disable toggle button
  toggleBtn.disabled = !status.apiKey;
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

async function togglePolling() {
  const messageType = currentStatus?.isPolling ? 'STOP_POLLING' : 'START_POLLING';
  await chrome.runtime.sendMessage({ type: messageType });
  await loadStatus();
}

// ============ Event Listeners ============

saveBtn.addEventListener('click', saveConfig);
toggleBtn.addEventListener('click', togglePolling);

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

document.addEventListener('DOMContentLoaded', () => {
  loadStatus();
  statusInterval = setInterval(loadStatus, 2000);
});

// Clean up interval when popup closes
window.addEventListener('unload', () => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});
