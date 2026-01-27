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

// Re-export from shared
export type { AccessLevel } from '@skillomatic/shared';

export interface EffectiveAccess {
  ats: import('@skillomatic/shared').AccessLevel;
  email: import('@skillomatic/shared').AccessLevel;
  calendar: import('@skillomatic/shared').AccessLevel;
  database: import('@skillomatic/shared').AccessLevel;
}

export interface CapabilityProfile {
  hasLLM: boolean;
  hasATS: boolean;
  hasCalendar: boolean;
  hasEmail: boolean;
  hasAirtable?: boolean;
  hasGoogleSheets?: boolean;
  hasGoogleDrive?: boolean;
  hasGoogleDocs?: boolean;
  hasGoogleForms?: boolean;
  hasGoogleContacts?: boolean;
  hasGoogleTasks?: boolean;
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
 * Tab derived from Google Sheet (not stored in our DB).
 * All info is parsed from the sheet on each request.
 *
 * Conventions:
 * - Tab name: "TableName | Purpose description" (purpose after |)
 * - Primary key: column header ends with * (e.g., "Email*")
 */
export interface DerivedTab {
  /** Google's numeric sheet ID (for API operations) */
  sheetId: number;
  /** Raw tab name including purpose (e.g., "CRM | Track consulting leads") */
  title: string;
  /** Parsed table name (e.g., "CRM") */
  baseName: string;
  /** Parsed purpose from after | (e.g., "Track consulting leads") */
  purpose?: string;
  /** Column headers (without * suffix) */
  columns: string[];
  /** Column marked with * suffix (e.g., "Email" from "Email*") */
  primaryKey?: string;
}

/** @deprecated Use DerivedTab instead */
export type TabConfig = DerivedTab;

/**
 * Response from listing tabs - derived from sheet on each request.
 */
export interface TabsResponse {
  tabs: DerivedTab[];
  /** User's spreadsheet ID */
  spreadsheetId: string;
  /** URL to the spreadsheet */
  spreadsheetUrl: string;
}

/**
 * Request body for creating a new tab.
 */
export interface CreateTabRequest {
  /** Tab name (e.g., "Contacts", "Jobs") - will be combined with purpose as "Title | Purpose" */
  title: string;
  /** What this tab tracks - will be appended to title with | delimiter */
  purpose?: string;
  /** Column headers to initialize (mark primary key with * suffix, e.g., "Email*") */
  columns: string[];
  /** Column to use as primary key for upsert (will add * suffix in sheet) */
  primaryKey?: string;
}

/**
 * Request body for updating a tab's schema.
 */
export interface UpdateTabSchemaRequest {
  /** New column list (complete, in order) */
  columns?: string[];
  /** Update the purpose (text after |) */
  purpose?: string;
  /** Update the base name (text before |) */
  baseName?: string;
  /** Set or change the primary key column (will update * suffix) */
  primaryKey?: string | null;
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
