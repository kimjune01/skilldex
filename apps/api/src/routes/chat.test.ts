import { describe, it, expect } from 'vitest';

// We'll test the functions that will be extracted
// For now, let's replicate them here to write tests against the expected behavior

// ============ parseAction ============
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

// ============ executeAction (pure ATS actions) ============
// These tests verify the demo data actions work correctly

describe('executeAction - ATS actions', () => {
  // We'll test with mock demo data generators
  const mockCandidates = [
    {
      id: 'cand-1',
      firstName: 'Alice',
      lastName: 'Smith',
      title: 'Software Engineer',
      company: 'TechCorp',
      skills: ['Python', 'React'],
      status: 'active',
      stage: 'Interview',
    },
    {
      id: 'cand-2',
      firstName: 'Bob',
      lastName: 'Jones',
      title: 'Product Manager',
      company: 'StartupXYZ',
      skills: ['Product', 'Agile'],
      status: 'active',
      stage: 'New',
    },
    {
      id: 'cand-3',
      firstName: 'Charlie',
      lastName: 'Brown',
      title: 'Python Developer',
      company: 'DataCo',
      skills: ['Python', 'Django', 'PostgreSQL'],
      status: 'rejected',
      stage: 'Rejected',
    },
  ];

  // Simplified executeAction for testing ATS logic
  function executeATSAction(
    action: { action: string; [key: string]: unknown },
    candidates = mockCandidates
  ): unknown {
    switch (action.action) {
      case 'search_candidates': {
        let filtered = [...candidates];
        if (action.query) {
          const q = (action.query as string).toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.firstName.toLowerCase().includes(q) ||
              c.lastName.toLowerCase().includes(q) ||
              c.title.toLowerCase().includes(q) ||
              c.company.toLowerCase().includes(q) ||
              c.skills.some((s) => s.toLowerCase().includes(q))
          );
        }
        if (action.status) {
          filtered = filtered.filter((c) => c.status === action.status);
        }
        if (action.stage) {
          filtered = filtered.filter((c) => c.stage === action.stage);
        }
        return { candidates: filtered, total: filtered.length };
      }

      case 'get_candidate': {
        const candidate = candidates.find((c) => c.id === action.id);
        return candidate ? { candidate } : { error: 'Candidate not found' };
      }

      case 'create_candidate': {
        const newCandidate = {
          id: `demo-cand-${Date.now()}`,
          ...(action.data as Record<string, unknown>),
          status: 'active',
          stage: 'New',
        };
        return { candidate: newCandidate, created: true };
      }

      case 'update_candidate': {
        const candidate = candidates.find((c) => c.id === action.id);
        if (!candidate) return { error: 'Candidate not found' };
        const updated = { ...candidate, ...(action.data as Record<string, unknown>) };
        return { candidate: updated, updated: true };
      }

      default:
        return { error: 'Unknown action' };
    }
  }

  describe('search_candidates', () => {
    it('should return all candidates with no filters', () => {
      const result = executeATSAction({ action: 'search_candidates' }) as {
        candidates: unknown[];
        total: number;
      };
      expect(result.total).toBe(3);
      expect(result.candidates).toHaveLength(3);
    });

    it('should filter by query (name)', () => {
      const result = executeATSAction({ action: 'search_candidates', query: 'alice' }) as {
        candidates: unknown[];
        total: number;
      };
      expect(result.total).toBe(1);
    });

    it('should filter by query (skill)', () => {
      const result = executeATSAction({ action: 'search_candidates', query: 'python' }) as {
        candidates: unknown[];
        total: number;
      };
      expect(result.total).toBe(2); // Alice and Charlie have Python
    });

    it('should filter by status', () => {
      const result = executeATSAction({ action: 'search_candidates', status: 'rejected' }) as {
        candidates: unknown[];
        total: number;
      };
      expect(result.total).toBe(1);
    });

    it('should filter by stage', () => {
      const result = executeATSAction({ action: 'search_candidates', stage: 'Interview' }) as {
        candidates: unknown[];
        total: number;
      };
      expect(result.total).toBe(1);
    });

    it('should combine filters', () => {
      const result = executeATSAction({
        action: 'search_candidates',
        query: 'python',
        status: 'active',
      }) as { candidates: unknown[]; total: number };
      expect(result.total).toBe(1); // Only Alice (active with Python)
    });
  });

  describe('get_candidate', () => {
    it('should return candidate by id', () => {
      const result = executeATSAction({ action: 'get_candidate', id: 'cand-1' }) as {
        candidate: { firstName: string };
      };
      expect(result.candidate.firstName).toBe('Alice');
    });

    it('should return error for unknown id', () => {
      const result = executeATSAction({ action: 'get_candidate', id: 'unknown' }) as {
        error: string;
      };
      expect(result.error).toBe('Candidate not found');
    });
  });

  describe('create_candidate', () => {
    it('should create candidate with provided data', () => {
      const result = executeATSAction({
        action: 'create_candidate',
        data: { firstName: 'New', lastName: 'Person', email: 'new@example.com' },
      }) as { candidate: { firstName: string; status: string; stage: string }; created: boolean };

      expect(result.created).toBe(true);
      expect(result.candidate.firstName).toBe('New');
      expect(result.candidate.status).toBe('active');
      expect(result.candidate.stage).toBe('New');
    });
  });

  describe('update_candidate', () => {
    it('should update existing candidate', () => {
      const result = executeATSAction({
        action: 'update_candidate',
        id: 'cand-1',
        data: { stage: 'Offer' },
      }) as { candidate: { stage: string }; updated: boolean };

      expect(result.updated).toBe(true);
      expect(result.candidate.stage).toBe('Offer');
    });

    it('should return error for unknown candidate', () => {
      const result = executeATSAction({
        action: 'update_candidate',
        id: 'unknown',
        data: { stage: 'Offer' },
      }) as { error: string };

      expect(result.error).toBe('Candidate not found');
    });
  });
});

// ============ web_search action ============
describe('executeAction - web_search', () => {
  // Mock Tavily client for testing
  const mockTavilyResponse = {
    answer: 'AI hiring is growing rapidly in 2025...',
    results: [
      {
        title: 'AI Hiring Trends 2025',
        url: 'https://example.com/ai-hiring',
        content: 'The AI job market continues to expand...',
        score: 0.95,
      },
      {
        title: 'Tech Recruitment Report',
        url: 'https://example.com/tech-report',
        content: 'Companies are increasingly seeking AI talent...',
        score: 0.87,
      },
    ],
  };

  function executeWebSearch(
    action: { action: 'web_search'; query: string; maxResults?: number; topic?: string; includeAnswer?: boolean },
    apiKey: string | undefined,
    mockSearch: typeof mockTavilyResponse | Error
  ): unknown {
    if (!apiKey) {
      return { error: 'Web search is not configured. Missing TAVILY_API_KEY.' };
    }

    if (mockSearch instanceof Error) {
      return { error: mockSearch.message };
    }

    return {
      success: true,
      query: action.query,
      answer: mockSearch.answer,
      results: mockSearch.results.slice(0, action.maxResults || 5).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
      total: Math.min(mockSearch.results.length, action.maxResults || 5),
    };
  }

  it('should return error when API key is missing', () => {
    const result = executeWebSearch(
      { action: 'web_search', query: 'test' },
      undefined,
      mockTavilyResponse
    ) as { error: string };

    expect(result.error).toContain('Missing TAVILY_API_KEY');
  });

  it('should return search results with answer', () => {
    const result = executeWebSearch(
      { action: 'web_search', query: 'AI hiring trends' },
      'test-api-key',
      mockTavilyResponse
    ) as { success: boolean; answer: string; results: unknown[]; total: number };

    expect(result.success).toBe(true);
    expect(result.answer).toBe('AI hiring is growing rapidly in 2025...');
    expect(result.results).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should respect maxResults parameter', () => {
    const result = executeWebSearch(
      { action: 'web_search', query: 'test', maxResults: 1 },
      'test-api-key',
      mockTavilyResponse
    ) as { results: unknown[]; total: number };

    expect(result.results).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should handle search errors', () => {
    const result = executeWebSearch(
      { action: 'web_search', query: 'test' },
      'test-api-key',
      new Error('Rate limit exceeded')
    ) as { error: string };

    expect(result.error).toBe('Rate limit exceeded');
  });
});

// ============ buildSystemPrompt ============
describe('buildSystemPrompt', () => {
  // Simplified version to test the structure
  function buildSystemPrompt(options: {
    hasEmail?: boolean;
    canSendEmail?: boolean;
    emailAddress?: string;
  }): string {
    let emailSection = '';
    if (options.hasEmail) {
      emailSection = `
### Email Actions
${options.canSendEmail ? '- draft_email\n- send_email' : ''}
- search_emails
Connected: ${options.emailAddress || 'unknown'}
`;
    }

    return `You are a recruiting assistant.

## Available Actions
- search_candidates
- get_candidate
- create_candidate
- list_jobs
- web_search
${emailSection}
## Guidelines
- Use action blocks`;
  }

  it('should include email actions when email is connected', () => {
    const prompt = buildSystemPrompt({ hasEmail: true, canSendEmail: true, emailAddress: 'test@example.com' });
    expect(prompt).toContain('Email Actions');
    expect(prompt).toContain('draft_email');
    expect(prompt).toContain('send_email');
    expect(prompt).toContain('search_emails');
    expect(prompt).toContain('test@example.com');
  });

  it('should exclude send actions when canSendEmail is false', () => {
    const prompt = buildSystemPrompt({ hasEmail: true, canSendEmail: false });
    expect(prompt).toContain('search_emails');
    expect(prompt).not.toContain('send_email');
  });

  it('should exclude email section when no email connected', () => {
    const prompt = buildSystemPrompt({ hasEmail: false });
    expect(prompt).not.toContain('Email Actions');
  });

  it('should always include web_search', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('web_search');
  });

  it('should include action block guidelines', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('action blocks');
  });
});
