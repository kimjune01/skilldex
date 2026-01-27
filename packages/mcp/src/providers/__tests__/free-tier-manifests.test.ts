/**
 * Free Tier Provider Manifest Tests
 *
 * Tests for the new free tier provider manifests:
 * - Notion, GitHub (third-party)
 * - Google Drive, Contacts, Tasks (expanded Google stack)
 */

import { describe, it, expect } from 'vitest';
import { notionManifest } from '../manifests/notion.js';
import { googleDriveManifest } from '../manifests/google-drive.js';
import { googleContactsManifest } from '../manifests/google-contacts.js';
import { googleTasksManifest } from '../manifests/google-tasks.js';

describe('Notion Manifest', () => {
  it('has correct provider metadata', () => {
    expect(notionManifest.provider).toBe('notion');
    expect(notionManifest.displayName).toBe('Notion');
    expect(notionManifest.category).toBe('database');
    expect(notionManifest.baseUrl).toBe('https://api.notion.com/v1');
  });

  it('uses bearer auth', () => {
    expect(notionManifest.auth.type).toBe('bearer');
  });

  it('has required operations', () => {
    const operationIds = notionManifest.operations.map((op) => op.id);
    expect(operationIds).toContain('search');
    expect(operationIds).toContain('query_database');
    expect(operationIds).toContain('get_page');
    expect(operationIds).toContain('create_page');
  });

  it('all operations have required fields', () => {
    for (const op of notionManifest.operations) {
      expect(op.id).toBeDefined();
      expect(op.method).toMatch(/^(GET|POST|PATCH|DELETE)$/);
      expect(op.path).toBeDefined();
      expect(op.access).toMatch(/^(read|write|delete)$/);
      expect(op.description).toBeDefined();
    }
  });

  it('has rate limit configured', () => {
    expect(notionManifest.rateLimit).toBeDefined();
    expect(notionManifest.rateLimit?.requests).toBe(3);
    expect(notionManifest.rateLimit?.windowSeconds).toBe(1);
  });
});

describe('Google Drive Manifest', () => {
  it('has correct provider metadata', () => {
    expect(googleDriveManifest.provider).toBe('google-drive');
    expect(googleDriveManifest.displayName).toBe('Google Drive');
    expect(googleDriveManifest.category).toBe('database');
    expect(googleDriveManifest.baseUrl).toBe('https://www.googleapis.com/drive/v3');
  });

  it('uses bearer auth', () => {
    expect(googleDriveManifest.auth.type).toBe('bearer');
  });

  it('has required operations', () => {
    const operationIds = googleDriveManifest.operations.map((op) => op.id);
    expect(operationIds).toContain('list_files');
    expect(operationIds).toContain('get_file');
    expect(operationIds).toContain('search_files');
    expect(operationIds).toContain('export_file');
  });

  it('is read-only (no write/delete operations)', () => {
    const accessLevels = googleDriveManifest.operations.map((op) => op.access);
    expect(accessLevels.every((a) => a === 'read')).toBe(true);
  });

  it('has blocklist for sensitive endpoints', () => {
    expect(googleDriveManifest.blocklist).toBeDefined();
    expect(googleDriveManifest.blocklist).toContain('/changes/watch');
    expect(googleDriveManifest.blocklist).toContain('/files/trash');
  });
});

describe('Google Contacts Manifest', () => {
  it('has correct provider metadata', () => {
    expect(googleContactsManifest.provider).toBe('google-contacts');
    expect(googleContactsManifest.displayName).toBe('Google Contacts');
    expect(googleContactsManifest.category).toBe('database');
    expect(googleContactsManifest.baseUrl).toBe('https://people.googleapis.com/v1');
  });

  it('uses bearer auth', () => {
    expect(googleContactsManifest.auth.type).toBe('bearer');
  });

  it('has required operations', () => {
    const operationIds = googleContactsManifest.operations.map((op) => op.id);
    expect(operationIds).toContain('list_contacts');
    expect(operationIds).toContain('search_contacts');
    expect(operationIds).toContain('get_contact');
  });

  it('is read-only (no write/delete operations)', () => {
    const accessLevels = googleContactsManifest.operations.map((op) => op.access);
    expect(accessLevels.every((a) => a === 'read')).toBe(true);
  });
});

describe('Google Tasks Manifest', () => {
  it('has correct provider metadata', () => {
    expect(googleTasksManifest.provider).toBe('google-tasks');
    expect(googleTasksManifest.displayName).toBe('Google Tasks');
    expect(googleTasksManifest.category).toBe('database');
    expect(googleTasksManifest.baseUrl).toBe('https://tasks.googleapis.com/tasks/v1');
  });

  it('uses bearer auth', () => {
    expect(googleTasksManifest.auth.type).toBe('bearer');
  });

  it('has required operations for tasks', () => {
    const operationIds = googleTasksManifest.operations.map((op) => op.id);
    expect(operationIds).toContain('list_tasks');
    expect(operationIds).toContain('get_task');
    expect(operationIds).toContain('create_task');
    expect(operationIds).toContain('update_task');
    expect(operationIds).toContain('complete_task');
    expect(operationIds).toContain('delete_task');
  });

  it('has full read/write/delete access (unlike Drive/Contacts)', () => {
    const accessLevels = new Set(googleTasksManifest.operations.map((op) => op.access));
    expect(accessLevels.has('read')).toBe(true);
    expect(accessLevels.has('write')).toBe(true);
    expect(accessLevels.has('delete')).toBe(true);
  });
});

describe('All Free Tier Manifests', () => {
  const manifests = [
    notionManifest,
    googleDriveManifest,
    googleContactsManifest,
    googleTasksManifest,
  ];

  it.each(manifests.map((m) => [m.provider, m]))(
    '%s manifest has valid structure',
    (_, manifest) => {
      // Required top-level fields
      expect(manifest.provider).toBeDefined();
      expect(manifest.displayName).toBeDefined();
      expect(manifest.category).toBeDefined();
      expect(manifest.baseUrl).toBeDefined();
      expect(manifest.auth).toBeDefined();
      expect(manifest.operations).toBeDefined();
      expect(manifest.operations.length).toBeGreaterThan(0);
    }
  );

  it.each(manifests.map((m) => [m.provider, m]))(
    '%s manifest operations have responseHints',
    (_, manifest) => {
      for (const op of manifest.operations) {
        expect(op.responseHints).toBeDefined();
        expect(Array.isArray(op.responseHints)).toBe(true);
      }
    }
  );
});
