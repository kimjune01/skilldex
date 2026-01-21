import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAtsTools } from '../tools/ats.js';
import type { SkillomaticClient, Candidate } from '../api-client.js';

describe('registerAtsTools', () => {
  let mockServer: {
    tool: ReturnType<typeof vi.fn>;
  };
  let mockClient: Partial<SkillomaticClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      tool: vi.fn(),
    };
    mockClient = {
      searchCandidates: vi.fn(),
      getCandidate: vi.fn(),
      createCandidate: vi.fn(),
      updateCandidate: vi.fn(),
    };
  });

  describe('tool registration', () => {
    it('should register search_ats_candidates tool', () => {
      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const searchCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'search_ats_candidates'
      );

      expect(searchCall).toBeDefined();
      expect(searchCall![1]).toBe('Search for candidates in the connected ATS system');
    });

    it('should register get_ats_candidate tool', () => {
      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_ats_candidate'
      );

      expect(getCall).toBeDefined();
      expect(getCall![1]).toBe('Get detailed information about a specific candidate');
    });

    it('should register create_ats_candidate tool', () => {
      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const createCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'create_ats_candidate'
      );

      expect(createCall).toBeDefined();
      expect(createCall![1]).toBe('Add a new candidate to the ATS system');
    });

    it('should register update_ats_candidate tool', () => {
      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const updateCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'update_ats_candidate'
      );

      expect(updateCall).toBeDefined();
      expect(updateCall![1]).toBe('Update an existing candidate in the ATS system');
    });
  });

  describe('search_ats_candidates handler', () => {
    it('should search with provided params', async () => {
      const mockResult = {
        candidates: [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        ],
        total: 1,
      };
      (mockClient.searchCandidates as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResult
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const searchCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'search_ats_candidates'
      );
      const handler = searchCall![3];

      const result = await handler({ query: 'engineer', tags: 'frontend', limit: 10 });

      expect(mockClient.searchCandidates).toHaveBeenCalledWith({
        q: 'engineer',
        tags: 'frontend',
        limit: 10,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.candidates).toHaveLength(1);
      expect(parsed.total).toBe(1);
      expect(parsed.query).toBe('engineer');
    });

    it('should show (all) when no query provided', async () => {
      const mockResult = { candidates: [], total: 0 };
      (mockClient.searchCandidates as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResult
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const searchCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'search_ats_candidates'
      );
      const handler = searchCall![3];

      const result = await handler({});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.query).toBe('(all)');
    });

    it('should handle errors', async () => {
      (mockClient.searchCandidates as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('ATS connection failed')
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const searchCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'search_ats_candidates'
      );
      const handler = searchCall![3];

      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching candidates');
    });
  });

  describe('get_ats_candidate handler', () => {
    it('should get candidate by id', async () => {
      const mockCandidate: Candidate = {
        id: 'cand-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        source: 'sourced',
        tags: ['frontend', 'react'],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };
      (mockClient.getCandidate as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCandidate
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_ats_candidate'
      );
      const handler = getCall![3];

      const result = await handler({ id: 'cand-123' });

      expect(mockClient.getCandidate).toHaveBeenCalledWith('cand-123');

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.firstName).toBe('Jane');
      expect(parsed.lastName).toBe('Smith');
    });

    it('should handle errors', async () => {
      (mockClient.getCandidate as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Candidate not found')
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_ats_candidate'
      );
      const handler = getCall![3];

      const result = await handler({ id: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching candidate');
    });
  });

  describe('create_ats_candidate handler', () => {
    it('should create candidate with provided data', async () => {
      const mockCandidate: Candidate = {
        id: 'new-123',
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob@example.com',
        source: 'applied',
        tags: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      (mockClient.createCandidate as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCandidate
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const createCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'create_ats_candidate'
      );
      const handler = createCall![3];

      const result = await handler({
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob@example.com',
        source: 'applied',
      });

      expect(mockClient.createCandidate).toHaveBeenCalledWith({
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob@example.com',
        phone: undefined,
        headline: undefined,
        summary: undefined,
        source: 'applied',
        tags: undefined,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain('Bob Wilson');
    });

    it('should handle errors', async () => {
      (mockClient.createCandidate as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Email already exists')
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const createCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'create_ats_candidate'
      );
      const handler = createCall![3];

      const result = await handler({
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'existing@example.com',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating candidate');
    });
  });

  describe('update_ats_candidate handler', () => {
    it('should update candidate with provided data', async () => {
      const mockCandidate: Candidate = {
        id: 'cand-123',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        headline: 'Senior Engineer',
        source: 'sourced',
        tags: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };
      (mockClient.updateCandidate as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCandidate
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const updateCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'update_ats_candidate'
      );
      const handler = updateCall![3];

      const result = await handler({
        id: 'cand-123',
        lastName: 'Doe',
        headline: 'Senior Engineer',
      });

      expect(mockClient.updateCandidate).toHaveBeenCalledWith('cand-123', {
        lastName: 'Doe',
        headline: 'Senior Engineer',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toContain('Jane Doe');
    });

    it('should handle errors', async () => {
      (mockClient.updateCandidate as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Candidate not found')
      );

      registerAtsTools(mockServer as any, mockClient as SkillomaticClient);

      const updateCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'update_ats_candidate'
      );
      const handler = updateCall![3];

      const result = await handler({ id: 'nonexistent', firstName: 'Test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating candidate');
    });
  });
});
