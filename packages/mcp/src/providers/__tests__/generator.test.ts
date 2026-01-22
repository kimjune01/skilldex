import { describe, it, expect } from 'vitest';
import {
  generateToolsFromManifest,
  getToolSummary,
  interpolatePath,
  categorizeParams,
} from '../generator.js';
import type { ProviderManifest, ProviderOperation } from '../types.js';
import { filterOperationsByAccess } from '../types.js';

// Minimal test manifest
const testManifest: ProviderManifest = {
  provider: 'test-provider',
  displayName: 'Test Provider',
  category: 'ats',
  baseUrl: 'https://api.test.com/v1',
  apiVersion: 'v1',
  auth: { type: 'bearer' },
  operations: [
    {
      id: 'list_items',
      method: 'GET',
      path: '/items',
      access: 'read',
      description: 'List all items',
      params: {
        limit: { type: 'number', description: 'Max items', default: 20 },
        search: { type: 'string', description: 'Search query' },
      },
    },
    {
      id: 'get_item',
      method: 'GET',
      path: '/items/{id}',
      access: 'read',
      description: 'Get item by ID',
      params: {
        id: { type: 'string', description: 'Item ID', required: true },
      },
    },
    {
      id: 'create_item',
      method: 'POST',
      path: '/items',
      access: 'write',
      description: 'Create a new item',
      body: {
        name: { type: 'string', description: 'Item name', required: true },
        tags: { type: 'array', description: 'Tags', items: { type: 'string', description: 'Tag' } },
      },
    },
    {
      id: 'update_item',
      method: 'PUT',
      path: '/items/{id}',
      access: 'write',
      description: 'Update an item',
      params: {
        id: { type: 'string', description: 'Item ID', required: true },
      },
      body: {
        name: { type: 'string', description: 'Item name' },
      },
    },
    {
      id: 'delete_item',
      method: 'DELETE',
      path: '/items/{id}',
      access: 'delete',
      description: 'Delete an item',
      params: {
        id: { type: 'string', description: 'Item ID', required: true },
      },
    },
    {
      id: 'bulk_delete',
      method: 'DELETE',
      path: '/items/bulk',
      access: 'dangerous',
      description: 'Bulk delete items - DANGEROUS',
      body: {
        ids: { type: 'array', description: 'IDs to delete', items: { type: 'string', description: 'ID' } },
      },
    },
  ],
};

describe('filterOperationsByAccess', () => {
  it('returns empty array for "none" access', () => {
    const result = filterOperationsByAccess(testManifest.operations, 'none');
    expect(result).toEqual([]);
  });

  it('returns empty array for "disabled" access', () => {
    const result = filterOperationsByAccess(testManifest.operations, 'disabled');
    expect(result).toEqual([]);
  });

  it('returns only read operations for "read-only" access', () => {
    const result = filterOperationsByAccess(testManifest.operations, 'read-only');
    expect(result.length).toBe(2);
    expect(result.every((op) => op.access === 'read')).toBe(true);
    expect(result.map((op) => op.id)).toEqual(['list_items', 'get_item']);
  });

  it('returns read and write operations for "read-write" access (excludes dangerous)', () => {
    const result = filterOperationsByAccess(testManifest.operations, 'read-write');
    // read (2) + write (2) + delete (1) = 5, excludes dangerous (1)
    expect(result.length).toBe(5);
    expect(result.every((op) => op.access !== 'dangerous')).toBe(true);
  });
});

describe('generateToolsFromManifest', () => {
  it('generates tools with correct names (replaces hyphens with underscores)', () => {
    const tools = generateToolsFromManifest(testManifest, 'read-write');
    expect(tools[0].name).toBe('test_provider_list_items');
    expect(tools[1].name).toBe('test_provider_get_item');
  });

  it('generates tools with description prefixed by provider name', () => {
    const tools = generateToolsFromManifest(testManifest, 'read-write');
    expect(tools[0].description).toBe('[Test Provider] List all items');
  });

  it('generates correct metadata for tools', () => {
    const tools = generateToolsFromManifest(testManifest, 'read-write');
    const listTool = tools.find((t) => t.name === 'test_provider_list_items');
    expect(listTool?.meta).toEqual({
      provider: 'test-provider',
      method: 'GET',
      path: '/items',
      category: 'ats',
      requiresOnBehalfOf: undefined,
      wrapInData: undefined,
    });
  });

  it('generates Zod schema for params', () => {
    const tools = generateToolsFromManifest(testManifest, 'read-write');
    const listTool = tools.find((t) => t.name === 'test_provider_list_items');
    expect(listTool?.inputSchema).toBeDefined();
    expect(listTool?.inputSchema.limit).toBeDefined();
    expect(listTool?.inputSchema.search).toBeDefined();
  });

  it('generates Zod schema for body params', () => {
    const tools = generateToolsFromManifest(testManifest, 'read-write');
    const createTool = tools.find((t) => t.name === 'test_provider_create_item');
    expect(createTool?.inputSchema).toBeDefined();
    expect(createTool?.inputSchema.name).toBeDefined();
    expect(createTool?.inputSchema.tags).toBeDefined();
  });

  it('respects access level filtering', () => {
    const readOnlyTools = generateToolsFromManifest(testManifest, 'read-only');
    expect(readOnlyTools.length).toBe(2);

    const readWriteTools = generateToolsFromManifest(testManifest, 'read-write');
    expect(readWriteTools.length).toBe(5);

    const noAccessTools = generateToolsFromManifest(testManifest, 'none');
    expect(noAccessTools.length).toBe(0);
  });
});

describe('getToolSummary', () => {
  it('returns correct counts for read-write access', () => {
    const summary = getToolSummary(testManifest, 'read-write');
    expect(summary.total).toBe(6);
    expect(summary.read).toBe(2);
    expect(summary.write).toBe(2);
    expect(summary.filtered).toBe(1); // dangerous operation filtered out
  });

  it('returns correct counts for read-only access', () => {
    const summary = getToolSummary(testManifest, 'read-only');
    expect(summary.total).toBe(6);
    expect(summary.read).toBe(2);
    expect(summary.write).toBe(0);
    expect(summary.filtered).toBe(4); // write + delete + dangerous filtered
  });

  it('returns all filtered for none access', () => {
    const summary = getToolSummary(testManifest, 'none');
    expect(summary.total).toBe(6);
    expect(summary.read).toBe(0);
    expect(summary.write).toBe(0);
    expect(summary.filtered).toBe(6);
  });
});

describe('interpolatePath', () => {
  it('replaces single path parameter', () => {
    const result = interpolatePath('/items/{id}', { id: '123' });
    expect(result.path).toBe('/items/123');
    expect(result.unusedParams).toEqual({});
  });

  it('replaces multiple path parameters', () => {
    const result = interpolatePath('/jobs/{jobId}/candidates/{candidateId}', {
      jobId: 'job-1',
      candidateId: 'cand-2',
    });
    expect(result.path).toBe('/jobs/job-1/candidates/cand-2');
    expect(result.unusedParams).toEqual({});
  });

  it('returns unused params that are not in path', () => {
    const result = interpolatePath('/items/{id}', { id: '123', limit: 10, search: 'test' });
    expect(result.path).toBe('/items/123');
    expect(result.unusedParams).toEqual({ limit: 10, search: 'test' });
  });

  it('leaves unmatched placeholders intact', () => {
    const result = interpolatePath('/items/{id}/sub/{subId}', { id: '123' });
    expect(result.path).toBe('/items/123/sub/{subId}');
  });

  it('URL-encodes values', () => {
    const result = interpolatePath('/items/{id}', { id: 'hello world' });
    expect(result.path).toBe('/items/hello%20world');
  });

  it('handles numeric values', () => {
    const result = interpolatePath('/items/{id}', { id: 42 });
    expect(result.path).toBe('/items/42');
  });

  it('handles path with no parameters', () => {
    const result = interpolatePath('/items', { limit: 10 });
    expect(result.path).toBe('/items');
    expect(result.unusedParams).toEqual({ limit: 10 });
  });
});

describe('categorizeParams', () => {
  const getItemOp: ProviderOperation = {
    id: 'get_item',
    method: 'GET',
    path: '/items/{id}',
    access: 'read',
    description: 'Get item',
    params: {
      id: { type: 'string', description: 'Item ID', required: true },
      include: { type: 'string', description: 'Include related' },
    },
  };

  const updateItemOp: ProviderOperation = {
    id: 'update_item',
    method: 'PUT',
    path: '/items/{id}',
    access: 'write',
    description: 'Update item',
    params: {
      id: { type: 'string', description: 'Item ID', required: true },
    },
    body: {
      name: { type: 'string', description: 'Name' },
      status: { type: 'string', description: 'Status' },
    },
  };

  it('categorizes path params correctly', () => {
    const result = categorizeParams(getItemOp, { id: '123', include: 'tags' });
    expect(result.pathParams).toEqual({ id: '123' });
    expect(result.queryParams).toEqual({ include: 'tags' });
    expect(result.bodyParams).toEqual({});
  });

  it('categorizes body params correctly', () => {
    const result = categorizeParams(updateItemOp, { id: '123', name: 'New Name', status: 'active' });
    expect(result.pathParams).toEqual({ id: '123' });
    expect(result.queryParams).toEqual({});
    expect(result.bodyParams).toEqual({ name: 'New Name', status: 'active' });
  });

  it('handles undefined values (skips them)', () => {
    const result = categorizeParams(updateItemOp, { id: '123', name: undefined, status: 'active' });
    expect(result.bodyParams).toEqual({ status: 'active' });
  });

  it('ignores unknown params', () => {
    const result = categorizeParams(getItemOp, { id: '123', unknown: 'value' });
    expect(result.pathParams).toEqual({ id: '123' });
    expect(result.queryParams).toEqual({});
    expect(result.bodyParams).toEqual({});
  });
});
