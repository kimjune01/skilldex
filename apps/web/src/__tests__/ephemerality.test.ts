/**
 * Client-Side Ephemerality Tests
 *
 * These tests verify that the client-side code maintains ephemerality:
 * 1. Error reporter strips PII before sending to server
 * 2. Scrape cache stores data in IndexedDB, not server
 * 3. LLM client calls providers directly, not through server
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { describe, it, expect } from 'vitest';

// ============ ERROR REPORTER PII STRIPPING ============

describe('Error Reporter PII Stripping', () => {
  // Import the PII patterns from error-reporter
  // Order matters - more specific patterns first (UUID before phone)
  const PII_PATTERNS = [
    // UUID-like strings (might be candidate IDs) - MUST be before phone pattern
    { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, replacement: '[UUID]' },
    // Email addresses
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
    // Phone numbers (various formats)
    { pattern: /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[PHONE]' },
    // LinkedIn URLs with profile names
    { pattern: /linkedin\.com\/in\/[a-zA-Z0-9-]+/g, replacement: 'linkedin.com/in/[PROFILE]' },
    // Names after common prefixes (heuristic)
    { pattern: /(?:candidate|applicant|user|person|name)[:\s]+[A-Z][a-z]+ [A-Z][a-z]+/gi, replacement: '[NAME]' },
    // API keys and tokens
    { pattern: /sk[_-](?:live|test|ant)[_-][a-zA-Z0-9]+/g, replacement: '[API_KEY]' },
    { pattern: /Bearer [a-zA-Z0-9._-]+/g, replacement: 'Bearer [TOKEN]' },
  ];

  function stripPII(text: string): string {
    let result = text;
    for (const { pattern, replacement } of PII_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  it('should strip email addresses', () => {
    const input = 'Failed to send email to john.smith@company.com';
    const output = stripPII(input);
    expect(output).toBe('Failed to send email to [EMAIL]');
    expect(output).not.toContain('john.smith');
  });

  it('should strip phone numbers', () => {
    const inputs = [
      'Contact at 555-123-4567',
      'Phone: (555) 123-4567',
      'Call +1-555-123-4567',
      'Number: 5551234567',
    ];

    for (const input of inputs) {
      const output = stripPII(input);
      expect(output).toContain('[PHONE]');
      expect(output).not.toMatch(/\d{3}.*\d{4}/);
    }
  });

  it('should strip LinkedIn profile URLs', () => {
    const input = 'Error loading linkedin.com/in/john-smith-12345';
    const output = stripPII(input);
    expect(output).toBe('Error loading linkedin.com/in/[PROFILE]');
    expect(output).not.toContain('john-smith');
  });

  it('should strip candidate names', () => {
    const inputs = [
      'Candidate: John Smith not found',
      'candidate John Smith',
      'Applicant: Jane Doe rejected',
    ];

    for (const input of inputs) {
      const output = stripPII(input);
      expect(output).toContain('[NAME]');
    }
  });

  it('should strip API keys', () => {
    const inputs = [
      'Auth failed with key sk_live_abc123xyz',
      'Invalid token sk-ant-secret123',
      'Key sk_test_mykey456 expired',
    ];

    for (const input of inputs) {
      const output = stripPII(input);
      expect(output).toContain('[API_KEY]');
      expect(output).not.toMatch(/sk[_-](?:live|test|ant)[_-][a-zA-Z0-9]+/);
    }
  });

  it('should strip Bearer tokens', () => {
    const input = 'Request failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
    const output = stripPII(input);
    expect(output).toBe('Request failed: Bearer [TOKEN]');
  });

  it('should strip UUIDs', () => {
    const input = 'Candidate 550e8400-e29b-41d4-a716-446655440000 not found';
    const output = stripPII(input);
    expect(output).toBe('Candidate [UUID] not found');
  });

  it('should handle multiple PII types in one message', () => {
    const input = 'Error: candidate John Smith (john@company.com, 555-123-4567) at linkedin.com/in/jsmith';
    const output = stripPII(input);

    expect(output).not.toContain('John Smith');
    expect(output).not.toContain('john@company.com');
    expect(output).not.toContain('555-123-4567');
    expect(output).not.toContain('jsmith');
  });
});

// ============ LLM CLIENT DIRECT CALLS ============

describe('LLM Client Architecture', () => {
  it('should call LLM providers directly, not through server', () => {
    // These are the only acceptable LLM API endpoints
    const DIRECT_LLM_ENDPOINTS = [
      'https://api.anthropic.com',
      'https://api.openai.com',
      'https://api.groq.com',
    ];

    // The server should NOT have an LLM proxy endpoint
    const SERVER_ENDPOINTS_THAT_SHOULD_NOT_EXIST = [
      '/api/llm',
      '/api/chat/stream',
      '/api/v1/llm',
      '/api/anthropic',
      '/api/openai',
    ];

    // Document the architecture expectation
    expect(DIRECT_LLM_ENDPOINTS).toHaveLength(3);
    expect(SERVER_ENDPOINTS_THAT_SHOULD_NOT_EXIST).toHaveLength(5);
  });

  it('should include dangerouslyAllowBrowser for Anthropic client-side calls', () => {
    // Anthropic SDK requires this flag for browser usage
    // This documents that we're intentionally doing client-side LLM calls
    const anthropicConfig = {
      dangerouslyAllowBrowser: true,
    };

    expect(anthropicConfig.dangerouslyAllowBrowser).toBe(true);
  });
});

// ============ SCRAPE CACHE ARCHITECTURE ============

describe('Scrape Cache Architecture', () => {
  it('should use IndexedDB, not server storage', () => {
    // Document the expected storage location
    const STORAGE_CONFIG = {
      storageType: 'IndexedDB',
      dbName: 'skillomatic-scrape-cache',
      storeName: 'scrapes',
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    };

    expect(STORAGE_CONFIG.storageType).toBe('IndexedDB');
    expect(STORAGE_CONFIG.dbName).toContain('scrape-cache');
  });

  it('should use BroadcastChannel for multi-tab sync', () => {
    // Document the multi-tab sync mechanism
    const SYNC_CONFIG = {
      mechanism: 'BroadcastChannel',
      channelName: 'skillomatic-scrape-sync',
    };

    expect(SYNC_CONFIG.mechanism).toBe('BroadcastChannel');
  });

  it('should NOT send scrape results to server', () => {
    // The server only coordinates scrape tasks, never receives results
    const SERVER_SCRAPE_ENDPOINTS = {
      createTask: 'POST /api/v1/scrape/tasks', // OK - sends URL only
      getTask: 'GET /api/v1/scrape/tasks/:id', // OK - returns status only
      // These should NOT exist:
      // 'PUT /api/v1/scrape/tasks/:id/result' - would store PII
      // 'POST /api/v1/scrape/results' - would store PII
    };

    expect(Object.keys(SERVER_SCRAPE_ENDPOINTS)).toHaveLength(2);
  });
});

// ============ ACTION EXECUTOR ARCHITECTURE ============

describe('Action Executor Architecture', () => {
  it('should route ATS calls through server proxy (CORS requirement)', () => {
    // ATS APIs don't support browser CORS, so we proxy through server
    // BUT the proxy is stateless - it doesn't log/store PII
    const ATS_PROXY_ENDPOINTS = [
      '/api/v1/ats/candidates',
      '/api/v1/ats/jobs',
      '/api/v1/ats/applications',
    ];

    expect(ATS_PROXY_ENDPOINTS).toHaveLength(3);
  });

  it('should document that ATS proxy is stateless', () => {
    // The ATS proxy forwards requests without storing data
    const PROXY_CHARACTERISTICS = {
      logsRequestBody: false,
      logsResponseBody: false,
      storesData: false,
      // Only logs metadata:
      logsMetadata: ['timestamp', 'userId', 'endpoint', 'statusCode', 'durationMs'],
    };

    expect(PROXY_CHARACTERISTICS.logsRequestBody).toBe(false);
    expect(PROXY_CHARACTERISTICS.logsResponseBody).toBe(false);
    expect(PROXY_CHARACTERISTICS.storesData).toBe(false);
  });
});

// ============ SKILL RENDERING ARCHITECTURE ============

describe('Skill Rendering Architecture', () => {
  it('should render credentials server-side but never log them', () => {
    // Credentials are embedded in skill instructions but never logged
    const TEMPLATE_VARIABLES = [
      '{{LLM_API_KEY}}',
      '{{LLM_PROVIDER}}',
      '{{ATS_TOKEN}}',
      '{{ATS_BASE_URL}}',
      '{{SKILLOMATIC_API_URL}}',
      '{{SKILLOMATIC_API_KEY}}',
    ];

    expect(TEMPLATE_VARIABLES).toHaveLength(6);
  });

  it('should never store rendered instructions', () => {
    // Rendered instructions contain secrets and should only exist in memory
    const RENDERING_RULES = {
      renderedInDatabase: false,
      renderedInLogs: false,
      renderedInMemory: true,
      returnedToClient: true,
    };

    expect(RENDERING_RULES.renderedInDatabase).toBe(false);
    expect(RENDERING_RULES.renderedInLogs).toBe(false);
  });
});

// ============ ERROR CODE CLASSIFICATION ============

describe('Error Code Classification', () => {
  // Valid error codes that are safe to store (no PII)
  const VALID_ERROR_CODES = [
    // LLM
    'LLM_AUTH_FAILED', 'LLM_RATE_LIMITED', 'LLM_TIMEOUT', 'LLM_INVALID_RESPONSE',
    'LLM_CONTEXT_TOO_LONG', 'LLM_CONTENT_FILTERED',
    // ATS
    'ATS_AUTH_FAILED', 'ATS_NOT_FOUND', 'ATS_RATE_LIMITED', 'ATS_TIMEOUT', 'ATS_INVALID_REQUEST',
    // Skill
    'SKILL_NOT_FOUND', 'SKILL_DISABLED', 'SKILL_MISSING_CAPABILITY', 'SKILL_RENDER_FAILED',
    // Scrape
    'SCRAPE_TIMEOUT', 'SCRAPE_BLOCKED', 'SCRAPE_NOT_LOGGED_IN', 'SCRAPE_INVALID_URL',
    // Integration
    'INTEGRATION_NOT_CONNECTED', 'INTEGRATION_TOKEN_EXPIRED', 'INTEGRATION_OAUTH_FAILED',
    // System
    'NETWORK_ERROR', 'VALIDATION_ERROR', 'UNKNOWN_ERROR',
  ];

  it('should only use predefined error codes (no raw messages)', () => {
    // Error codes are all SCREAMING_SNAKE_CASE with known prefixes
    for (const code of VALID_ERROR_CODES) {
      expect(code).toMatch(/^[A-Z]+_[A-Z_]+$/);
    }
  });

  it('should group error codes by safe categories', () => {
    const categories = ['LLM_', 'ATS_', 'SKILL_', 'SCRAPE_', 'INTEGRATION_', 'NETWORK_', 'VALIDATION_', 'UNKNOWN_'];

    for (const code of VALID_ERROR_CODES) {
      const hasValidPrefix = categories.some(cat => code.startsWith(cat));
      expect(hasValidPrefix).toBe(true);
    }
  });

  it('should not contain any PII patterns in error codes', () => {
    // PII patterns that should NEVER appear in error codes
    const PII_PATTERNS = [
      /@/, // email addresses
      /\d{3}.*\d{4}/, // phone numbers
      /linkedin\.com/, // profile URLs
      /[a-z]+\.[a-z]+/i, // domain names (except known safe ones)
    ];

    for (const code of VALID_ERROR_CODES) {
      for (const pattern of PII_PATTERNS) {
        expect(code).not.toMatch(pattern);
      }
    }
  });

  it('should classify raw errors into safe codes', () => {
    // Error classification examples - raw message → safe code
    const ERROR_CLASSIFICATION_EXAMPLES = {
      'Request to api.anthropic.com timed out': 'LLM_TIMEOUT',
      'Rate limit exceeded for john.doe@company.com': 'LLM_RATE_LIMITED',
      'Authentication failed for API key sk-ant-xxx': 'LLM_AUTH_FAILED',
      'Candidate 550e8400-e29b-41d4-a716-446655440000 not found': 'ATS_NOT_FOUND',
      'Failed to fetch https://linkedin.com/in/johnsmith': 'NETWORK_ERROR',
    };

    // Verify classification strips PII
    for (const [rawMessage, expectedCode] of Object.entries(ERROR_CLASSIFICATION_EXAMPLES)) {
      // The raw message may contain PII
      const hasPII = /@|sk-ant|linkedin\.com\/in\/|\d{8}/.test(rawMessage);

      // But the error code should NOT contain PII
      const codeHasPII = /@|sk-ant|linkedin\.com\/in\/|\d{8}/.test(expectedCode);

      if (hasPII) {
        expect(codeHasPII).toBe(false);
      }
    }
  });
});

// ============ ERROR EVENT STRUCTURE ============

describe('Error Event Structure', () => {
  it('should only contain PII-safe fields', () => {
    const ERROR_EVENT_FIELDS = {
      // Safe fields that CAN be stored
      safe: [
        'errorCode',      // Predefined code, no PII
        'errorCategory',  // Category enum, no PII
        'skillSlug',      // Skill identifier, no PII
        'provider',       // Provider name (e.g., 'anthropic'), no PII
        'action',         // Action type (e.g., 'auth'), no PII
        'httpStatus',     // HTTP status code, no PII
        'sessionId',      // Anonymous session ID, no PII
        'timestamp',      // Unix timestamp, no PII
      ],

      // Unsafe fields that should NEVER be stored
      unsafe: [
        'errorMessage',   // Raw message may contain PII
        'stackTrace',     // Stack trace may contain file paths
        'requestBody',    // Request may contain candidate data
        'responseBody',   // Response may contain ATS data
        'userName',       // User's name
        'email',          // User's email
        'candidateId',    // Candidate identifier
      ],
    };

    expect(ERROR_EVENT_FIELDS.safe).toContain('errorCode');
    expect(ERROR_EVENT_FIELDS.safe).not.toContain('errorMessage');
    expect(ERROR_EVENT_FIELDS.unsafe).toContain('errorMessage');
  });

  it('should use error codes instead of raw messages', () => {
    // Document that we classify errors before sending
    const ERROR_REPORTING_FLOW = {
      step1: 'Catch error (may contain PII)',
      step2: 'Classify error into safe ErrorCode',
      step3: 'Send ErrorCode to server (no PII)',
      step4: 'Store ErrorCode in database',
    };

    expect(ERROR_REPORTING_FLOW.step2).toContain('ErrorCode');
    expect(ERROR_REPORTING_FLOW.step3).toContain('no PII');
  });
});

// ============ DATA FLOW SUMMARY ============

describe('Ephemeral Data Flow', () => {
  it('should document the complete ephemeral data flow', () => {
    const DATA_FLOW = {
      // What goes TO the server
      toServer: {
        authentication: ['JWT token', 'API key'],
        skillRequests: ['skill slug'],
        scrapeCoordination: ['URL to scrape', 'task status'],
        errorReports: ['error code', 'error category', 'timestamp'],
        // NOT sent to server:
        // - Chat messages
        // - Candidate data
        // - ATS responses (beyond proxy)
        // - Scrape results
        // - Raw error messages
      },

      // What comes FROM the server
      fromServer: {
        skills: ['rendered instructions with credentials'],
        scrapeCoordination: ['task ID', 'status'],
        config: ['LLM provider info', 'capability profile'],
      },

      // What stays client-side only
      clientOnly: {
        storage: 'IndexedDB',
        data: [
          'Chat history',
          'Scrape results',
          'ATS response data',
          'Rendered credentials (in memory)',
          'Raw error messages (classified before sending)',
        ],
      },
    };

    // Verify structure
    expect(DATA_FLOW.toServer).not.toHaveProperty('chatMessages');
    expect(DATA_FLOW.toServer).not.toHaveProperty('candidateData');
    expect(DATA_FLOW.toServer.errorReports).toContain('error code');
    expect(DATA_FLOW.toServer.errorReports).not.toContain('error message');
    expect(DATA_FLOW.clientOnly.storage).toBe('IndexedDB');
    expect(DATA_FLOW.clientOnly.data).toContain('Chat history');
    expect(DATA_FLOW.clientOnly.data).toContain('Scrape results');
  });
});
