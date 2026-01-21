import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerScrapeTools } from '../tools/scrape.js';
import type { SkillomaticClient, ScrapeTask } from '../api-client.js';

describe('registerScrapeTools', () => {
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
      createScrapeTask: vi.fn(),
      getScrapeTask: vi.fn(),
      waitForScrapeResult: vi.fn(),
    };
  });

  describe('tool registration', () => {
    it('should register create_scrape_task tool', () => {
      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const createCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'create_scrape_task'
      );

      expect(createCall).toBeDefined();
      expect(createCall![1]).toContain('scrape task');
    });

    it('should register get_scrape_task tool', () => {
      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_scrape_task'
      );

      expect(getCall).toBeDefined();
      expect(getCall![1]).toContain('status');
    });

    it('should register scrape_url tool', () => {
      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const scrapeCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'scrape_url'
      );

      expect(scrapeCall).toBeDefined();
      expect(scrapeCall![1]).toContain('Scrape a URL');
    });
  });

  describe('create_scrape_task handler', () => {
    it('should create scrape task with URL', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      };
      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTask
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const createCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'create_scrape_task'
      );
      const handler = createCall![3];

      const result = await handler({ url: 'https://linkedin.com/in/johndoe' });

      expect(mockClient.createScrapeTask).toHaveBeenCalledWith(
        'https://linkedin.com/in/johndoe'
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.task.id).toBe('task-123');
      expect(parsed.task.status).toBe('pending');
    });

    it('should handle errors', async () => {
      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Invalid URL')
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const createCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'create_scrape_task'
      );
      const handler = createCall![3];

      const result = await handler({ url: 'invalid' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating scrape task');
    });
  });

  describe('get_scrape_task handler', () => {
    it('should return completed task with result', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'completed',
        result: 'John Doe - Software Engineer at Example Corp',
        createdAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:01:00Z',
      };
      (mockClient.getScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(mockTask);

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_scrape_task'
      );
      const handler = getCall![3];

      const result = await handler({ id: 'task-123' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('completed');
      expect(parsed.result).toBe('John Doe - Software Engineer at Example Corp');
      expect(parsed.completedAt).toBeDefined();
    });

    it('should return failed task with error', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'failed',
        errorMessage: 'Page not found',
        suggestion: 'Check if the URL is correct',
        createdAt: '2024-01-01T00:00:00Z',
      };
      (mockClient.getScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(mockTask);

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_scrape_task'
      );
      const handler = getCall![3];

      const result = await handler({ id: 'task-123' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('failed');
      expect(parsed.error).toBe('Page not found');
      expect(parsed.suggestion).toBe('Check if the URL is correct');
    });

    it('should return pending task without result', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      };
      (mockClient.getScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(mockTask);

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_scrape_task'
      );
      const handler = getCall![3];

      const result = await handler({ id: 'task-123' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('pending');
      expect(parsed.result).toBeUndefined();
    });

    it('should handle errors', async () => {
      (mockClient.getScrapeTask as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Task not found')
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const getCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_scrape_task'
      );
      const handler = getCall![3];

      const result = await handler({ id: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching scrape task');
    });
  });

  describe('scrape_url handler', () => {
    it('should scrape and return completed result', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const mockCompletedTask: ScrapeTask = {
        ...mockTask,
        status: 'completed',
        result: 'Scraped content here',
        completedAt: '2024-01-01T00:01:00Z',
      };

      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTask
      );
      (mockClient.waitForScrapeResult as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompletedTask
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const scrapeCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'scrape_url'
      );
      const handler = scrapeCall![3];

      const result = await handler({
        url: 'https://linkedin.com/in/johndoe',
        timeout: 30000,
      });

      expect(mockClient.createScrapeTask).toHaveBeenCalledWith(
        'https://linkedin.com/in/johndoe'
      );
      expect(mockClient.waitForScrapeResult).toHaveBeenCalledWith('task-123', {
        timeout: 30000,
      });

      expect(result.content[0].text).toBe('Scraped content here');
    });

    it('should return error for failed task', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const mockFailedTask: ScrapeTask = {
        ...mockTask,
        status: 'failed',
        errorMessage: 'Page blocked',
        suggestion: 'Try again later',
      };

      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTask
      );
      (mockClient.waitForScrapeResult as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockFailedTask
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const scrapeCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'scrape_url'
      );
      const handler = scrapeCall![3];

      const result = await handler({ url: 'https://linkedin.com/in/johndoe' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Page blocked');
      expect(result.content[0].text).toContain('Try again later');
    });

    it('should return error for pending task (extension not running)', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTask
      );
      (mockClient.waitForScrapeResult as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTask
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const scrapeCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'scrape_url'
      );
      const handler = scrapeCall![3];

      const result = await handler({ url: 'https://linkedin.com/in/johndoe' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('browser extension');
    });

    it('should handle empty result', async () => {
      const mockTask: ScrapeTask = {
        id: 'task-123',
        url: 'https://linkedin.com/in/johndoe',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const mockCompletedTask: ScrapeTask = {
        ...mockTask,
        status: 'completed',
        result: '',
        completedAt: '2024-01-01T00:01:00Z',
      };

      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTask
      );
      (mockClient.waitForScrapeResult as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompletedTask
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const scrapeCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'scrape_url'
      );
      const handler = scrapeCall![3];

      const result = await handler({ url: 'https://linkedin.com/in/johndoe' });

      expect(result.content[0].text).toContain('no content returned');
    });

    it('should handle API errors', async () => {
      (mockClient.createScrapeTask as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      registerScrapeTools(mockServer as any, mockClient as SkillomaticClient);

      const scrapeCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'scrape_url'
      );
      const handler = scrapeCall![3];

      const result = await handler({ url: 'https://linkedin.com/in/johndoe' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error scraping URL');
    });
  });
});
