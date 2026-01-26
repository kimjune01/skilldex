import { describe, it, expect } from 'vitest';
import { app } from '../app.js';

describe('GET /status', () => {
  it('should return status response with correct structure', async () => {
    const res = await app.request('/status');
    expect(res.status).toBe(200);

    const data = await res.json();

    // Check top-level structure
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('updatedAt');
    expect(data).toHaveProperty('services');
    expect(data).toHaveProperty('deploy');

    // Check status values are valid
    expect(['operational', 'degraded', 'outage']).toContain(data.status);

    // Check services structure
    expect(data.services).toHaveProperty('api');
    expect(data.services).toHaveProperty('database');
    expect(data.services).toHaveProperty('integrations');

    // Check deploy structure
    expect(data.deploy).toHaveProperty('gitHash');
    expect(typeof data.deploy.gitHash).toBe('string');
  });

  it('should always show API as operational if responding', async () => {
    const res = await app.request('/status');
    const data = await res.json();

    // If we get a response, API must be operational
    expect(data.services.api).toBe('operational');

    // Overall status should be valid
    expect(['operational', 'degraded', 'outage']).toContain(data.status);
  });

  it('should not require authentication', async () => {
    // No Authorization header
    const res = await app.request('/status');
    expect(res.status).toBe(200);
  });

  it('should return valid ISO timestamp', async () => {
    const res = await app.request('/status');
    const data = await res.json();

    const timestamp = new Date(data.updatedAt);
    expect(timestamp.toISOString()).toBe(data.updatedAt);
  });
});
