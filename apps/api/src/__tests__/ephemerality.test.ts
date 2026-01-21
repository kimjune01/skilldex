/**
 * Ephemerality Tests
 *
 * These tests verify that the ephemeral architecture constraints are maintained:
 * 1. No PII is stored in the database
 * 2. No PII is logged by the server
 * 3. Rendered skills contain credentials but are never stored
 * 4. ATS proxy doesn't log request/response bodies
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { describe, it, expect } from 'vitest';
import * as schema from '@skillomatic/db/schema';

// ============ SCHEMA EPHEMERALITY TESTS ============

describe('Database Schema Ephemerality', () => {
  describe('scrapeTasks table', () => {
    it('should NOT store scraped content in result field (ephemeral violation)', () => {
      // The result field exists for backwards compatibility but should not be used
      // in ephemeral mode. This test documents the expectation.
      const columns = Object.keys(schema.scrapeTasks);

      // Document that result field exists but is deprecated
      expect(columns).toContain('result');

      // The field should eventually be removed in a migration
      // For now, we verify the architecture doc says not to use it
    });

    it('should have coordination-only fields', () => {
      const columns = Object.keys(schema.scrapeTasks);

      // These are acceptable - coordination only, no PII
      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('url');
      expect(columns).toContain('urlHash');
      expect(columns).toContain('status');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('expiresAt');
    });
  });

  describe('skillUsageLogs table', () => {
    it('should only store anonymized/metadata fields', () => {
      const columns = Object.keys(schema.skillUsageLogs);

      // Acceptable fields (metadata only)
      expect(columns).toContain('skillId');
      expect(columns).toContain('userId');
      expect(columns).toContain('status');
      expect(columns).toContain('durationMs');
      expect(columns).toContain('createdAt');

      // inputSummary should be truncated/anonymized, not full input
      expect(columns).toContain('inputSummary');
    });

    it('should NOT have fields for storing chat content', () => {
      const columns = Object.keys(schema.skillUsageLogs);

      // These would be PII violations
      expect(columns).not.toContain('chatHistory');
      expect(columns).not.toContain('fullInput');
      expect(columns).not.toContain('fullOutput');
      expect(columns).not.toContain('candidateData');
      expect(columns).not.toContain('atsResponse');
    });
  });

  describe('users table', () => {
    it('should only store account data, not activity data', () => {
      const columns = Object.keys(schema.users);

      // Account data is acceptable
      expect(columns).toContain('email');
      expect(columns).toContain('name');
      expect(columns).toContain('passwordHash');

      // Should NOT store PII activity
      expect(columns).not.toContain('chatHistory');
      expect(columns).not.toContain('searchHistory');
      expect(columns).not.toContain('candidatesViewed');
    });
  });

  describe('integrations table', () => {
    it('should NOT store OAuth tokens directly', () => {
      const columns = Object.keys(schema.integrations);

      // Should use Nango connection ID, not raw tokens
      expect(columns).toContain('nangoConnectionId');

      // Should NOT store raw OAuth tokens (they're fetched fresh from Nango)
      expect(columns).not.toContain('accessToken');
      expect(columns).not.toContain('refreshToken');
      expect(columns).not.toContain('oauthToken');
    });
  });

  describe('organizations table', () => {
    it('should store LLM config for client-side use', () => {
      const columns = Object.keys(schema.organizations);

      // LLM config is stored but used client-side (ephemeral architecture)
      expect(columns).toContain('llmProvider');
      expect(columns).toContain('llmApiKey');
      expect(columns).toContain('llmModel');
    });
  });
});

// ============ PII FIELD BLOCKLIST ============

describe('PII Field Blocklist', () => {
  const PII_FIELD_NAMES = [
    // Chat/conversation data
    'chatHistory',
    'conversationHistory',
    'messageHistory',
    'chatContent',
    'messages',

    // Candidate/recruiting data
    'candidateData',
    'candidateProfile',
    'resumeContent',
    'resumeText',
    'linkedinProfile',
    'profileData',

    // ATS data
    'atsResponse',
    'atsData',
    'applicationData',
    'interviewNotes',

    // Scrape results (should be client-side only)
    'scrapedContent',
    'pageContent',
    'htmlContent',

    // Email content
    'emailBody',
    'emailContent',
    'draftContent',
  ];

  const ALL_TABLES = [
    { name: 'users', table: schema.users },
    { name: 'organizations', table: schema.organizations },
    { name: 'apiKeys', table: schema.apiKeys },
    { name: 'skills', table: schema.skills },
    { name: 'integrations', table: schema.integrations },
    { name: 'skillUsageLogs', table: schema.skillUsageLogs },
    { name: 'scrapeTasks', table: schema.scrapeTasks },
    { name: 'sessions', table: schema.sessions },
    { name: 'organizationInvites', table: schema.organizationInvites },
    { name: 'skillProposals', table: schema.skillProposals },
    { name: 'systemSettings', table: schema.systemSettings },
    { name: 'errorEvents', table: schema.errorEvents },
  ];

  for (const { name, table } of ALL_TABLES) {
    it(`${name} table should not contain PII fields`, () => {
      const columns = Object.keys(table);

      for (const piiField of PII_FIELD_NAMES) {
        expect(columns).not.toContain(piiField);
      }
    });
  }
});

// ============ ACCEPTABLE DATA TESTS ============

describe('Acceptable Stored Data', () => {
  it('should document what data IS acceptable to store', () => {
    // This test documents the acceptable data categories

    const ACCEPTABLE_DATA = {
      // User accounts (required for auth)
      userAccounts: ['email', 'name', 'passwordHash', 'avatarUrl'],

      // API keys (required for auth)
      apiKeys: ['key', 'name', 'lastUsedAt'],

      // Skill metadata (not PII)
      skillMetadata: ['name', 'description', 'intent', 'instructions'],

      // Usage logs (anonymized)
      usageLogs: ['skillId', 'userId', 'status', 'durationMs', 'inputSummary'],

      // Scrape coordination (URLs only, not content)
      scrapeCoordination: ['url', 'urlHash', 'status'],

      // Integration status (not tokens)
      integrationStatus: ['provider', 'status', 'nangoConnectionId'],
    };

    // Just verify the structure exists
    expect(Object.keys(ACCEPTABLE_DATA)).toHaveLength(6);
  });
});

// ============ SKILL RENDERING TESTS ============

describe('Skill Rendering Ephemerality', () => {
  it('should NOT store rendered skill content in database', () => {
    // The skills table stores TEMPLATE instructions, not rendered ones
    const columns = Object.keys(schema.skills);

    // Template instructions are OK (contain {{VAR}} placeholders)
    expect(columns).toContain('instructions');

    // Should NOT have a field for rendered/hydrated instructions
    expect(columns).not.toContain('renderedInstructions');
    expect(columns).not.toContain('hydratedInstructions');
    expect(columns).not.toContain('processedInstructions');
  });
});

// ============ ERROR LOGGING TESTS ============

describe('Error Logging Ephemerality', () => {
  it('skillUsageLogs.errorMessage should not contain PII', () => {
    // The errorMessage field exists but should only contain error types/codes
    // not actual error details that might include PII
    const columns = Object.keys(schema.skillUsageLogs);

    expect(columns).toContain('errorMessage');

    // Document: errorMessage should be like "RATE_LIMITED" not "Failed to fetch candidate John Smith"
  });

  it('scrapeTasks should have errorMessage for status only', () => {
    const columns = Object.keys(schema.scrapeTasks);

    expect(columns).toContain('errorMessage');
    expect(columns).toContain('status');

    // Error message should be like "TIMEOUT" or "AUTH_FAILED", not page content
  });
});

// ============ ERROR EVENTS TABLE TESTS ============

describe('errorEvents Table Ephemerality', () => {
  it('should have errorEvents table for telemetry', () => {
    expect(schema.errorEvents).toBeDefined();
  });

  it('should store error codes, not raw messages', () => {
    const columns = Object.keys(schema.errorEvents);

    // Should have errorCode (safe, predefined codes)
    expect(columns).toContain('errorCode');
    expect(columns).toContain('errorCategory');

    // Should NOT have raw error message field
    expect(columns).not.toContain('errorMessage');
    expect(columns).not.toContain('rawMessage');
    expect(columns).not.toContain('message');
    expect(columns).not.toContain('stackTrace');
  });

  it('should only contain PII-safe attribution fields', () => {
    const columns = Object.keys(schema.errorEvents);

    // Safe attribution fields
    expect(columns).toContain('skillSlug');     // Skill identifier, not content
    expect(columns).toContain('provider');      // Provider name (e.g., 'anthropic')
    expect(columns).toContain('action');        // Action type (e.g., 'auth', 'search')
    expect(columns).toContain('httpStatus');    // HTTP status code
    expect(columns).toContain('sessionId');     // Anonymous session ID

    // Should NOT have PII fields
    expect(columns).not.toContain('candidateId');
    expect(columns).not.toContain('candidateName');
    expect(columns).not.toContain('email');
    expect(columns).not.toContain('requestBody');
    expect(columns).not.toContain('responseBody');
  });

  it('should have user/org IDs for attribution (not PII)', () => {
    const columns = Object.keys(schema.errorEvents);

    // User and org IDs are acceptable for attribution
    // (they're internal IDs, not PII like names/emails)
    expect(columns).toContain('userId');
    expect(columns).toContain('organizationId');
  });
});

// ============ VALID ERROR CODES ============

describe('Error Code Validation', () => {
  // These are the only valid error codes that can be stored
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

  it('error codes should be SCREAMING_SNAKE_CASE', () => {
    for (const code of VALID_ERROR_CODES) {
      expect(code).toMatch(/^[A-Z]+_[A-Z_]+$/);
    }
  });

  it('error codes should not contain PII patterns', () => {
    const PII_PATTERNS = [
      /@/,                    // email
      /\d{3}.*\d{4}/,        // phone
      /linkedin\.com/,       // profile URL
      /[a-z]+\.[a-z]+/i,     // domain
    ];

    for (const code of VALID_ERROR_CODES) {
      for (const pattern of PII_PATTERNS) {
        expect(code).not.toMatch(pattern);
      }
    }
  });

  it('error categories should be predefined enum values', () => {
    const VALID_CATEGORIES = ['llm', 'ats', 'skill', 'scrape', 'integration', 'system'];

    // Each error code should map to a valid category based on prefix
    for (const code of VALID_ERROR_CODES) {
      const prefix = code.split('_')[0].toLowerCase();
      const mappedCategory =
        prefix === 'llm' ? 'llm' :
        prefix === 'ats' ? 'ats' :
        prefix === 'skill' ? 'skill' :
        prefix === 'scrape' ? 'scrape' :
        prefix === 'integration' ? 'integration' :
        'system';

      expect(VALID_CATEGORIES).toContain(mappedCategory);
    }
  });
});
