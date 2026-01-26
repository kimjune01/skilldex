/**
 * Type definitions for the Skillomatic MCP server.
 * These match the Skillomatic API response shapes.
 */

export type SkillAccessLevel = 'read-write' | 'read-only' | 'disabled' | 'none';

export interface SkillPublic {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  version: string;
  /** Required integrations with access levels: {"ats": "read-write", "email": "read-only"} */
  requiredIntegrations: Record<string, SkillAccessLevel>;
  requiredScopes: string[];
  intent: string;
  capabilities: string[];
  isEnabled: boolean;
}

export interface RenderedSkill extends SkillPublic {
  rendered: true;
  instructions: string;
}

// Re-export from providers to avoid duplication
export type { AccessLevel } from './providers/permissions.js';

export interface EffectiveAccess {
  ats: import('./providers/permissions.js').AccessLevel;
  email: import('./providers/permissions.js').AccessLevel;
  calendar: import('./providers/permissions.js').AccessLevel;
  database: import('./providers/permissions.js').AccessLevel;
}

export interface CapabilityProfile {
  hasLLM: boolean;
  hasATS: boolean;
  hasCalendar: boolean;
  hasEmail: boolean;
  hasAirtable?: boolean;
  hasGoogleSheets?: boolean;
  isSuperAdmin?: boolean;
  llmProvider?: string;
  atsProvider?: string;
  calendarProvider?: string;
  emailProvider?: string;
  airtableProvider?: string;
  googleSheetsProvider?: string;
  effectiveAccess?: EffectiveAccess;
}

export interface ConfigResponse {
  slug: string;
  name: string;
  rendered: boolean;
  instructions: string;
  profile: CapabilityProfile;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  headline?: string;
  summary?: string;
  location?: {
    city: string;
    state?: string;
    country: string;
  };
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScrapeTask {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  result?: string;
  errorMessage?: string;
  suggestion?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Email types
export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
}

export interface EmailDraft {
  draftId: string;
  messageId: string;
  threadId?: string;
}

export interface SentEmail {
  messageId: string;
  threadId?: string;
}

export interface EmailSearchResult {
  emails: EmailMessage[];
  total: number;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
}

// ============ Google Sheets Tab Types ============

/**
 * Configuration for a single tab (sheet) in the user's Skillomatic spreadsheet.
 * Each tab represents a different data type (Contacts, Jobs, etc.).
 */
export interface TabConfig {
  /** Google's numeric sheet ID (for API operations) */
  sheetId: number;
  /** Tab name (used for tool names, e.g., "Contacts" → contacts_add) */
  title: string;
  /** Description for LLM context (what this tab is used for) */
  purpose: string;
  /** Column headers (all treated as strings) */
  columns: string[];
  /** Optional: column to use as primary key for upsert operations */
  primaryKey?: string;
  /** ISO timestamp when tab was created */
  createdAt: string;
}

/**
 * Response from listing tabs - includes version for tool regeneration detection.
 */
export interface TabsResponse {
  tabs: TabConfig[];
  /** Incremented on any tab/schema change - used to detect when tools need regeneration */
  version: number;
  /** User's spreadsheet ID */
  spreadsheetId: string;
  /** URL to the spreadsheet */
  spreadsheetUrl: string;
}

/**
 * Request body for creating a new tab.
 */
export interface CreateTabRequest {
  /** Tab name (e.g., "Contacts", "Jobs") */
  title: string;
  /** What this tab tracks */
  purpose: string;
  /** Column headers to initialize */
  columns: string[];
  /** Optional: column to use as primary key for upsert (e.g., "Email") */
  primaryKey?: string;
}

/**
 * Request body for updating a tab's schema.
 */
export interface UpdateTabSchemaRequest {
  /** New column list (complete, in order) */
  columns: string[];
  /** Optional: update the purpose */
  purpose?: string;
  /** Optional: set or change the primary key column */
  primaryKey?: string;
}

/**
 * Row data for tab operations.
 */
export interface TabRow {
  /** 1-indexed row number (excluding header) */
  rowNumber: number;
  /** Column values as key-value pairs */
  data: Record<string, string>;
}
