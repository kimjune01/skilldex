/**
 * Provider Manifests Index
 *
 * Central registry for all provider manifests.
 */

import type { ProviderManifest } from '../types.js';
// ATS providers
import { greenhouseManifest } from './greenhouse.js';
import { zohoRecruitManifest } from './zoho-recruit.js';
import { mockAtsManifest } from './mock-ats.js';
// Calendar providers
import { calendlyManifest } from './calendly.js';
// Data providers - Airtable
import { airtableManifest } from './airtable.js';
// Data providers - Google stack (from shared)
import {
  googleSheetsManifest,
  googleDriveManifest,
  googleDocsManifest,
  googleFormsManifest,
  googleContactsManifest,
  googleTasksManifest,
} from '@skillomatic/shared';
// Data providers - Third party (free tier)
import { notionManifest } from './notion.js';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * All available provider manifests keyed by provider ID
 * Note: mock-ats is only available in development mode
 */
export const manifests: Record<string, ProviderManifest> = {
  // ATS providers
  greenhouse: greenhouseManifest,
  'zoho-recruit': zohoRecruitManifest,
  // Only include mock-ats in development
  ...(isDev ? { 'mock-ats': mockAtsManifest } : {}),
  // Calendar providers
  calendly: calendlyManifest,
  // Data providers - Google stack
  airtable: airtableManifest,
  'google-sheets': googleSheetsManifest,
  'google-drive': googleDriveManifest,
  'google-docs': googleDocsManifest,
  'google-forms': googleFormsManifest,
  'google-contacts': googleContactsManifest,
  'google-tasks': googleTasksManifest,
  // Data providers - Third party (free tier)
  notion: notionManifest,
};

/**
 * Get a manifest by provider ID
 */
export function getManifest(provider: string): ProviderManifest | undefined {
  return manifests[provider];
}

/**
 * Get all available provider IDs
 */
export function getAvailableProviders(): string[] {
  return Object.keys(manifests);
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(provider: string): boolean {
  return provider in manifests;
}

export {
  greenhouseManifest,
  zohoRecruitManifest,
  mockAtsManifest,
  calendlyManifest,
  airtableManifest,
  googleSheetsManifest,
  googleDriveManifest,
  googleDocsManifest,
  googleFormsManifest,
  googleContactsManifest,
  googleTasksManifest,
  notionManifest,
};
