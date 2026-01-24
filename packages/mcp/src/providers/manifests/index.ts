/**
 * Provider Manifests Index
 *
 * Central registry for all provider manifests.
 */

import type { ProviderManifest } from '../types.js';
import { greenhouseManifest } from './greenhouse.js';
import { zohoRecruitManifest } from './zoho-recruit.js';
import { mockAtsManifest } from './mock-ats.js';
import { calendlyManifest } from './calendly.js';
import { airtableManifest } from './airtable.js';
import { googleSheetsManifest } from './google-sheets.js';

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
  // Data providers
  airtable: airtableManifest,
  'google-sheets': googleSheetsManifest,
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

export { greenhouseManifest, zohoRecruitManifest, mockAtsManifest, calendlyManifest, airtableManifest, googleSheetsManifest };
