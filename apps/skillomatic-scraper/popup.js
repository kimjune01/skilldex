// Skillomatic Scraper - Popup Script

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

// Error banner elements
const errorBanner = document.getElementById('errorBanner');
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');
const errorHint = document.getElementById('errorHint');
const dismissError = document.getElementById('dismissError');

// Connection details
const connectionDetails = document.getElementById('connectionDetails');
const connectionDetailsText = document.getElementById('connectionDetailsText');

const messageEl = document.getElementById('message');

let currentStatus = null;

// ============ Error Analysis ============

function analyzeError(error, status) {
  // Default values
  let title = 'Connection Error';
  let message = error || 'Unknown error occurred';
  let hint = '';

  const apiUrl = status?.apiUrl || apiUrlInput.value.trim();

  // Check for common issues
  if (error?.includes('Invalid or expired API key')) {
    title = 'Invalid API Key';
    message = 'Your API key was rejected by the server.';
    hint = 'Go to <code>skillomatic.technology</code> → Settings → API Keys to get a valid key. Make sure it starts with <code>sk_live_</code> or <code>sk_test_</code>.';
  } else if (error?.includes('Connection lost unexpectedly') || error?.includes('WebSocket connection error')) {
    title = 'Connection Lost';
    message = 'Could not connect to the Skillomatic server.';

    // Check if they're using the wrong URL
    if (apiUrl && !apiUrl.includes('api.skillomatic.technology') && apiUrl.includes('skillomatic.technology')) {
      hint = '⚠️ <strong>Wrong URL detected!</strong> You\'re connecting to <code>' + apiUrl + '</code> but the API is at <code>https://api.skillomatic.technology</code>. Update your API URL.';
    } else if (apiUrl?.includes('localhost')) {
      hint = 'Make sure your local Skillomatic API server is running on <code>' + apiUrl + '</code>.';
    } else {
      hint = 'Check your internet connection. The API URL should be <code>https://api.skillomatic.technology</code>.';
    }
  } else if (error?.includes('Max reconnection attempts')) {
    title = 'Connection Failed';
    message = 'Could not establish connection after multiple attempts.';
    hint = 'Click "Save & Connect" to try again, or check the API URL is correct: <code>https://api.skillomatic.technology</code>';
  } else if (error?.includes('Failed to fetch') || error?.includes('NetworkError') || error?.includes('net::')) {
    title = 'Network Error';
    message = 'Could not reach the server.';

    if (apiUrl && !apiUrl.includes('api.skillomatic.technology') && apiUrl.includes('skillomatic.technology')) {
      hint = '⚠️ <strong>Wrong URL!</strong> Change <code>' + apiUrl + '</code> to <code>https://api.skillomatic.technology</code>';
    } else {
      hint = 'Check your internet connection and verify the API URL is correct.';
    }
  } else if (error?.includes('not reachable')) {
    title = 'Server Unreachable';
    message = 'The API server could not be reached.';

    if (apiUrl && !apiUrl.includes('api.skillomatic.technology') && apiUrl.includes('skillomatic.technology')) {
      hint = '⚠️ <strong>Wrong URL!</strong> The API is at <code>https://api.skillomatic.technology</code>, not <code>' + apiUrl + '</code>';
    } else {
      hint = 'Verify the API URL and check if the server is online.';
    }
  } else if (error?.includes('HTML') || error?.includes('<!DOCTYPE')) {
    title = 'Wrong Server';
    message = 'Connected to a web page instead of the API.';
    hint = 'You\'re connecting to a website, not the API. Change your URL to <code>https://api.skillomatic.technology</code>';
  }

  return { title, message, hint };
}

// ============ UI Updates ============

function updateUI(status) {
  currentStatus = status;

  // Show error banner if present
  if (status.lastError) {
    const { title, message, hint } = analyzeError(status.lastError, status);
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorHint.innerHTML = hint;
    errorHint.style.display = hint ? 'block' : 'none';
    errorBanner.classList.add('visible');
  } else {
    errorBanner.classList.remove('visible');
  }

  // Update connection details for debugging
  updateConnectionDetails(status);

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
  } else if (status.connecting) {
    // Show connecting state
    connectedView.style.display = 'none';
    configView.style.display = 'block';

    statusDot.className = 'status-dot connecting';
    statusText.textContent = 'Connecting...';
    apiKeyStatus.textContent = status.apiKey || 'Not configured';
  } else {
    // Show config view
    connectedView.style.display = 'none';
    configView.style.display = 'block';

    // Update config view status
    if (status.apiKey) {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = status.lastError ? 'Error' : 'Disconnected';
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
  let apiUrl = apiUrlInput.value.trim() || 'https://api.skillomatic.technology';
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

  // Auto-correct common URL mistakes
  if (apiUrl.includes('skillomatic.technology') && !apiUrl.includes('api.skillomatic.technology')) {
    const correctedUrl = apiUrl.replace('skillomatic.technology', 'api.skillomatic.technology');
    console.log(`[Config] Auto-correcting URL from ${apiUrl} to ${correctedUrl}`);
    apiUrl = correctedUrl;
    apiUrlInput.value = correctedUrl;
    showMessage('URL auto-corrected to api.skillomatic.technology', 'success');
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Testing connection...';

  try {
    // Test the API connection first
    let testResponse;
    try {
      testResponse = await fetch(`${apiUrl}/v1/me`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
    } catch (fetchError) {
      // Network error - provide helpful message
      if (apiUrl.includes('localhost')) {
        throw new Error(`Cannot reach ${apiUrl}. Is your local API server running?`);
      } else {
        throw new Error(`Cannot reach ${apiUrl}. Check your internet connection.`);
      }
    }

    if (!testResponse.ok) {
      // Check response content type to detect wrong server
      const contentType = testResponse.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error(`${apiUrl} returned HTML instead of JSON. You may be connecting to the wrong server.`);
      }

      if (testResponse.status === 401) {
        throw new Error('Invalid API key. Check that it starts with sk_live_ or sk_test_');
      } else if (testResponse.status === 403) {
        throw new Error('API key is valid but access is forbidden. Contact support.');
      } else if (testResponse.status === 404) {
        throw new Error(`API endpoint not found at ${apiUrl}. Is this the correct API URL?`);
      } else {
        throw new Error(`API returned error ${testResponse.status}. Check your configuration.`);
      }
    }

    // Save config
    await chrome.runtime.sendMessage({
      type: 'SET_CONFIG',
      apiKey,
      apiUrl,
    });

    // Clear any previous errors
    errorBanner.classList.remove('visible');
    showMessage('Connected successfully!', 'success');
    await loadStatus();
  } catch (err) {
    console.error('Failed to save config:', err);
    showMessage(err.message || 'Failed to connect', 'error');

    // Also show in the error banner for persistence
    errorTitle.textContent = 'Connection Test Failed';
    errorMessage.textContent = err.message;
    errorHint.innerHTML = apiUrl.includes('skillomatic.technology') && !apiUrl.includes('api.skillomatic.technology')
      ? 'Try using <code>https://api.skillomatic.technology</code> as your API URL.'
      : 'Double-check your API URL and API key.';
    errorHint.style.display = 'block';
    errorBanner.classList.add('visible');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save & Connect';
  }
}

async function reconnect() {
  disconnectBtn.disabled = true;
  disconnectBtn.textContent = 'Reconnecting...';

  try {
    // Get saved config
    const stored = await chrome.storage.local.get(['apiKey', 'apiUrl']);

    if (!stored.apiKey || !stored.apiUrl) {
      throw new Error('No saved configuration');
    }

    // Disconnect first
    await chrome.runtime.sendMessage({ type: 'DISCONNECT' });

    // Test the API connection
    const testResponse = await fetch(`${stored.apiUrl}/v1/me`, {
      headers: {
        'Authorization': `Bearer ${stored.apiKey}`,
      },
    });

    if (!testResponse.ok) {
      throw new Error('Failed to connect to API');
    }

    // Reconnect with saved config
    await chrome.runtime.sendMessage({
      type: 'SET_CONFIG',
      apiKey: stored.apiKey,
      apiUrl: stored.apiUrl,
    });

    showMessage('Reconnected successfully!', 'success');
    await loadStatus();
  } catch (err) {
    console.error('Failed to reconnect:', err);
    showMessage(err.message || 'Failed to reconnect', 'error');
    await loadStatus();
  } finally {
    disconnectBtn.disabled = false;
    disconnectBtn.textContent = 'Reconnect';
  }
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
      // First, check for the hidden extension config element (works on any authenticated page)
      const configElement = document.getElementById('skillomatic-extension-config');
      if (configElement && configElement.dataset.apiKey && configElement.dataset.apiUrl) {
        return {
          apiKey: configElement.dataset.apiKey,
          apiUrl: configElement.dataset.apiUrl,
          redirectUrl: configElement.dataset.redirectUrl || null
        };
      }

      // Fallback: scan page text for API key (for /keys page or MCP config display)
      const pageText = document.body.innerText;

      // Match API key pattern: sk_live_... or sk_test_...
      const apiKeyMatch = pageText.match(/sk_(live|test)_[a-zA-Z0-9_]+/);

      // Get the API URL
      let apiUrl = window.location.origin;

      // Check for explicit API URL in page meta or data attribute
      const apiUrlMeta = document.querySelector('meta[name="skillomatic-api-url"]');
      const apiUrlData = document.querySelector('[data-api-url]');

      if (apiUrlMeta) {
        apiUrl = apiUrlMeta.content;
      } else if (apiUrlData) {
        apiUrl = apiUrlData.dataset.apiUrl;
      } else if (apiUrl.includes(':5173')) {
        // Dev environment: web is on 5173, API is on 3000
        apiUrl = apiUrl.replace(':5173', ':3000');
      }

      // Check if this looks like a Skillomatic page
      const isSkillomatic = document.title.includes('Skillomatic') ||
                        pageText.includes('SKILLOMATIC_API_KEY') ||
                        document.querySelector('[data-skillomatic]');

      if (!isSkillomatic || !apiKeyMatch) {
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
      return; // Silently fail - user might not be on Skillomatic page
    }

    // Test and save the config
    const testResponse = await fetch(`${config.apiUrl}/v1/me`, {
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
    showMessage('Auto-connected! Redirecting...', 'success');

    // Redirect the page if specified (e.g., from /extension to /home)
    // Do this before loadStatus to avoid showing brief "disconnected" state
    if (config.redirectUrl) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const currentUrl = new URL(tab.url);
        const redirectUrl = new URL(config.redirectUrl, currentUrl.origin);
        // Small delay to let user see success message
        setTimeout(() => {
          chrome.tabs.update(tab.id, { url: redirectUrl.href });
        }, 500);
        return; // Don't load status since we're redirecting
      }
    }

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
      throw new Error('No Skillomatic config found. Go to your Skillomatic dashboard first.');
    }

    // Fill in the form
    apiUrlInput.value = config.apiUrl;
    apiKeyInput.value = config.apiKey;

    // Auto-save and connect
    await saveConfig();
  } catch (err) {
    console.error('Failed to read from page:', err);
    showMessage(err.message || 'Failed to read from page', 'error');
  } finally {
    readFromPageBtn.disabled = false;
    readFromPageBtn.textContent = 'Read from Skillomatic Page';
  }
}

// ============ Connection Details (for debugging) ============

function updateConnectionDetails(status) {
  if (!status) {
    connectionDetails.style.display = 'none';
    return;
  }

  // Show connection details when there's an error or when disconnected with config
  const shouldShow = status.lastError || (!status.connected && status.apiKey);

  if (shouldShow) {
    connectionDetails.style.display = 'block';
    const wsUrl = status.apiUrl ?
      `${status.apiUrl.replace('https:', 'wss:').replace('http:', 'ws:')}/ws/scrape` :
      'Not configured';

    connectionDetailsText.textContent = [
      `API URL: ${status.apiUrl || 'Not set'}`,
      `WebSocket: ${wsUrl}`,
      `API Key: ${status.apiKey || 'Not set'}`,
      `Status: ${status.connected ? 'Connected' : status.connecting ? 'Connecting...' : 'Disconnected'}`,
      `Reconnect attempts: ${status.reconnectAttempts || 0}`,
      status.lastError ? `Last error: ${status.lastError}` : null
    ].filter(Boolean).join('\n');
  } else {
    connectionDetails.style.display = 'none';
  }
}

// ============ Event Listeners ============

saveBtn.addEventListener('click', saveConfig);
readFromPageBtn.addEventListener('click', readFromPage);
disconnectBtn.addEventListener('click', reconnect);

// Dismiss error banner
dismissError.addEventListener('click', async () => {
  errorBanner.classList.remove('visible');
  // Clear the error in background script
  await chrome.runtime.sendMessage({ type: 'CLEAR_ERROR' });
});

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
  chrome.tabs.create({ url: 'https://skillomatic.technology/extension' });
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
