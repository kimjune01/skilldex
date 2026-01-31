/**
 * Chat Helper Function Tests
 *
 * Tests for utility functions used in chat-related functionality.
 * Note: The action execution tests have been removed as the /chat/action
 * endpoint has been deprecated in favor of:
 * - MCP server for tool execution
 * - Frontend action-executor.ts calling v1 endpoints directly
 */
import { describe, it, expect } from 'vitest';

// ============ parseAction ============
// This function is now in the frontend action-executor.ts
// These tests document the expected parsing behavior
function parseAction(text: string): Record<string, unknown> | null {
  const match = text.match(/```action\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

describe('parseAction', () => {
  it('should parse a valid action block', () => {
    const text = 'Some text\n```action\n{"action": "search_candidates", "query": "engineer"}\n```\nMore text';
    const result = parseAction(text);
    expect(result).toEqual({ action: 'search_candidates', query: 'engineer' });
  });

  it('should return null for text without action block', () => {
    const text = 'Just some regular text without any action';
    expect(parseAction(text)).toBeNull();
  });

  it('should return null for json block (not action block)', () => {
    const text = '```json\n{"action": "search_candidates"}\n```';
    expect(parseAction(text)).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    const text = '```action\n{invalid json}\n```';
    expect(parseAction(text)).toBeNull();
  });

  it('should parse action with multiple parameters', () => {
    const text = '```action\n{"action": "search_candidates", "query": "python", "status": "active", "stage": "Interview"}\n```';
    const result = parseAction(text);
    expect(result).toEqual({
      action: 'search_candidates',
      query: 'python',
      status: 'active',
      stage: 'Interview',
    });
  });

  it('should only parse the first action block', () => {
    const text = '```action\n{"action": "first"}\n```\n```action\n{"action": "second"}\n```';
    const result = parseAction(text);
    expect(result).toEqual({ action: 'first' });
  });
});

// ============ normalizeUrl ============
// This function is in apps/api/src/lib/chat-helpers.ts
function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
  ];
  trackingParams.forEach((param) => url.searchParams.delete(param));
  url.searchParams.sort();
  url.hash = '';
  return url.toString();
}

describe('normalizeUrl', () => {
  it('should lowercase protocol and hostname', () => {
    expect(normalizeUrl('HTTPS://EXAMPLE.COM/path')).toBe('https://example.com/path');
  });

  it('should remove default ports', () => {
    expect(normalizeUrl('https://example.com:443/path')).toBe('https://example.com/path');
    expect(normalizeUrl('http://example.com:80/path')).toBe('http://example.com/path');
  });

  it('should keep non-default ports', () => {
    expect(normalizeUrl('https://example.com:8080/path')).toBe('https://example.com:8080/path');
  });

  it('should remove trailing slash from path', () => {
    expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
  });

  it('should keep root path slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('should remove tracking parameters', () => {
    const url = 'https://example.com/page?utm_source=google&utm_medium=cpc&real_param=value';
    expect(normalizeUrl(url)).toBe('https://example.com/page?real_param=value');
  });

  it('should remove hash', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
  });

  it('should sort query parameters', () => {
    const url = 'https://example.com/page?z=1&a=2&m=3';
    expect(normalizeUrl(url)).toBe('https://example.com/page?a=2&m=3&z=1');
  });

  it('should throw for invalid URL', () => {
    expect(() => normalizeUrl('not-a-url')).toThrow();
  });
});

// ============ parseRecipients ============
// This function is in apps/api/src/lib/chat-helpers.ts
interface EmailAddress {
  email: string;
  name?: string;
}

function parseRecipients(input: unknown): EmailAddress[] {
  if (!input) return [];

  if (typeof input === 'string') {
    return [{ email: input }];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') {
        return { email: item };
      }
      return item as EmailAddress;
    });
  }

  return [];
}

describe('parseRecipients', () => {
  it('should return empty array for null/undefined', () => {
    expect(parseRecipients(null)).toEqual([]);
    expect(parseRecipients(undefined)).toEqual([]);
  });

  it('should parse single email string', () => {
    expect(parseRecipients('test@example.com')).toEqual([{ email: 'test@example.com' }]);
  });

  it('should parse array of email strings', () => {
    expect(parseRecipients(['a@example.com', 'b@example.com'])).toEqual([
      { email: 'a@example.com' },
      { email: 'b@example.com' },
    ]);
  });

  it('should parse array of EmailAddress objects', () => {
    const input = [
      { email: 'a@example.com', name: 'Alice' },
      { email: 'b@example.com', name: 'Bob' },
    ];
    expect(parseRecipients(input)).toEqual(input);
  });

  it('should handle mixed array', () => {
    const input = ['a@example.com', { email: 'b@example.com', name: 'Bob' }];
    expect(parseRecipients(input)).toEqual([
      { email: 'a@example.com' },
      { email: 'b@example.com', name: 'Bob' },
    ]);
  });

  it('should return empty array for non-string/non-array', () => {
    expect(parseRecipients(123)).toEqual([]);
    expect(parseRecipients({ email: 'test@example.com' })).toEqual([]);
  });
});
