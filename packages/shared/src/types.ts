// ============ Onboarding Types ============

/**
 * Onboarding step definitions using floats for future flexibility.
 * New steps can be shimmed between existing steps (e.g., 1.5 between 1 and 2).
 */
export const ONBOARDING_STEPS = {
  /** User just created account, hasn't started onboarding */
  NOT_STARTED: 0,
  /** User has selected individual or organization account type */
  ACCOUNT_TYPE_SELECTED: 0.5,
  /** User has connected their ATS integration */
  ATS_CONNECTED: 1,
  /** User has generated their API key for desktop chat */
  API_KEY_GENERATED: 2,
  /** User has installed the browser extension */
  EXTENSION_INSTALLED: 2.5,
  /** User has configured deployment mode (web UI or desktop) */
  DEPLOYMENT_CONFIGURED: 3,
  /** Onboarding complete */
  COMPLETE: 4,
} as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

/** Get the maximum onboarding step value (used to check completion) */
export const MAX_ONBOARDING_STEP = Math.max(...Object.values(ONBOARDING_STEPS));

/** Check if a user has completed onboarding */
export function isOnboardingComplete(step: number): boolean {
  return step >= MAX_ONBOARDING_STEP;
}

/** Get the next recommended onboarding step */
export function getNextOnboardingStep(currentStep: number): OnboardingStep | null {
  const steps = Object.values(ONBOARDING_STEPS).sort((a, b) => a - b);
  for (const step of steps) {
    if (step > currentStep) return step as OnboardingStep;
  }
  return null;
}

/** Get human-readable name for an onboarding step */
export function getOnboardingStepName(step: number): string {
  if (step >= ONBOARDING_STEPS.COMPLETE) return 'Complete';
  if (step >= ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED) return 'Configure Deployment';
  if (step >= ONBOARDING_STEPS.EXTENSION_INSTALLED) return 'Install Extension';
  if (step >= ONBOARDING_STEPS.API_KEY_GENERATED) return 'Generate API Key';
  if (step >= ONBOARDING_STEPS.ATS_CONNECTED) return 'Connect Integration';
  if (step >= ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED) return 'Select Account Type';
  return 'Get Started';
}

/** Get the route path for an onboarding step */
export function getOnboardingStepRoute(step: number): string | null {
  if (step >= ONBOARDING_STEPS.COMPLETE) return null;
  if (step >= ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED) return '/skills';
  if (step >= ONBOARDING_STEPS.EXTENSION_INSTALLED) return '/skills';
  if (step >= ONBOARDING_STEPS.API_KEY_GENERATED) return '/extension';
  if (step >= ONBOARDING_STEPS.ATS_CONNECTED) return '/desktop-chat';
  if (step >= ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED) return '/integrations';
  return '/onboarding/account-type';
}

/** Get the element ID for an onboarding step (for in-page badge highlighting) */
export function getOnboardingStepElementId(step: number): string | null {
  if (step >= ONBOARDING_STEPS.COMPLETE) return null;
  // ATS connect button on integrations page
  if (step < ONBOARDING_STEPS.ATS_CONNECTED) return 'ats-connect';
  return null;
}

/** Get the step name key for advancing to the next step */
export function getNextOnboardingStepKey(currentStep: number): keyof typeof ONBOARDING_STEPS | null {
  if (currentStep < ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED) return 'ACCOUNT_TYPE_SELECTED';
  if (currentStep < ONBOARDING_STEPS.ATS_CONNECTED) return 'ATS_CONNECTED';
  if (currentStep < ONBOARDING_STEPS.API_KEY_GENERATED) return 'API_KEY_GENERATED';
  if (currentStep < ONBOARDING_STEPS.EXTENSION_INSTALLED) return 'EXTENSION_INSTALLED';
  if (currentStep < ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED) return 'DEPLOYMENT_CONFIGURED';
  if (currentStep < ONBOARDING_STEPS.COMPLETE) return 'COMPLETE';
  return null;
}

export interface OnboardingStatus {
  currentStep: number;
  isComplete: boolean;
  nextStep: OnboardingStep | null;
  nextStepName: string | null;
}

// ============ LLM Provider Constants ============

export type LLMProvider = 'anthropic' | 'openai' | 'groq';

/**
 * Default models for each LLM provider.
 * Single source of truth - import this wherever model defaults are needed.
 */
export const LLM_DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-opus-4-5-20251101',
  openai: 'gpt-5.2',
  groq: 'llama-3.1-8b-instant',
} as const;

/**
 * Available models for each provider (for UI selection)
 */
export const LLM_AVAILABLE_MODELS: Record<LLMProvider, readonly string[]> = {
  anthropic: ['claude-opus-4-5-20251101', 'claude-sonnet-4-5-20241022'],
  openai: ['gpt-5.2', 'gpt-5.1', 'gpt-5', 'gpt-4.1', 'gpt-4.1-mini'],
  groq: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
} as const;

/**
 * Get the default model for a provider
 */
export function getDefaultLLMModel(provider: LLMProvider): string {
  return LLM_DEFAULT_MODELS[provider] ?? LLM_DEFAULT_MODELS.anthropic;
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ============ Auth Types ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserPublic;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  organizationId?: string;
  organizationName?: string;
  /** User's onboarding progress (see ONBOARDING_STEPS) */
  onboardingStep: number;
  /** Whether user has completed account type selection (individual vs organization) */
  accountTypeSelected: boolean;
  /** Org that the user can join based on their email domain (for individual users) */
  availableOrg?: { id: string; name: string };
}

// ============ Organization Types ============

export interface OrganizationPublic {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationInvitePublic {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  organizationId: string;
  organizationName: string;
  expiresAt: string;
  createdAt: string;
}

// ============ API Key Types ============

export interface ApiKeyPublic {
  id: string;
  name: string;
  key: string; // Full key, always visible
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface ApiKeyCreateResponse {
  id: string;
  name: string;
  key: string; // Full key
  createdAt: Date;
}

// ============ Skill Types ============

/** Skill visibility level */
export type SkillVisibility = 'private' | 'organization';

/** Skill source type - how the skill was created */
export type SkillSourceType = 'filesystem' | 'user-generated';

/** Skill access status */
export type SkillAccessStatus = 'available' | 'limited' | 'disabled';

/** Access level for an integration category */
export type SkillAccessLevel = 'read-write' | 'read-only' | 'disabled' | 'none';

/** Skill access debug info */
export interface SkillAccessInfo {
  status: SkillAccessStatus;
  limitations?: string[];
  guidance?: string;
  requirements?: {
    ats?: SkillAccessLevel;
    email?: SkillAccessLevel;
    calendar?: SkillAccessLevel;
  };
  effectiveAccess?: {
    ats: SkillAccessLevel;
    email: SkillAccessLevel;
    calendar: SkillAccessLevel;
  };
  orgPermissions?: {
    ats: SkillAccessLevel;
    email: SkillAccessLevel;
    calendar: SkillAccessLevel;
  };
  disabledByAdmin?: boolean;
}

export interface SkillPublic {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  requiredIntegrations: string[];
  requiredScopes: string[];
  intent: string;
  capabilities: string[];
  isEnabled: boolean;
  /** Visibility level: private (creator only) or organization (all org members) */
  visibility: SkillVisibility;
  /** How the skill was created: filesystem (seeded) or user-generated */
  sourceType: SkillSourceType;
  /** Whether this is a system-wide global skill */
  isGlobal?: boolean;
  /** Creator's user ID (null for system skills) */
  creatorId?: string;
  /** Creator's display name (included when available) */
  creatorName?: string;
  /** True if the current user is the creator of this skill */
  isOwner?: boolean;
  /** True if the current user can edit this skill */
  canEdit?: boolean;
  /** True if there's a pending visibility request */
  hasPendingVisibilityRequest?: boolean;
  /** Access status info (included when requested) */
  accessInfo?: SkillAccessInfo;
}

export type SkillCategory = 'sourcing' | 'ats' | 'communication' | 'scheduling' | 'productivity' | 'system';

export interface SkillMetadata {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  requiredIntegrations: string[];
  requiredScopes: string[];
  intent: string;
  capabilities: string[];
  triggers?: string[];
  configuration?: Record<string, unknown>;
}

/** Request body for creating a new skill - accepts raw markdown with YAML frontmatter */
export interface SkillCreateRequest {
  /** Raw markdown content with YAML frontmatter containing name, description, etc. */
  content: string;
  /** Category for the skill (extracted from frontmatter if present) */
  category?: SkillCategory;
  /** Visibility: 'private' (default) or 'organization' */
  visibility?: SkillVisibility;
}

/** Request body for updating a skill */
export interface SkillUpdateRequest {
  /** Raw markdown content with YAML frontmatter (replaces entire skill content) */
  content?: string;
  /** Individual field updates (when not using content) */
  name?: string;
  description?: string;
  category?: SkillCategory;
  intent?: string;
  capabilities?: string[];
  /** Toggle skill enabled/disabled (admin only) */
  isEnabled?: boolean;
}

/** Request body for requesting visibility change */
export interface SkillVisibilityRequest {
  visibility: 'organization';
  reason?: string;
}

// ============ Integration Types ============

export interface IntegrationPublic {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncAt?: Date;
  createdAt: Date;
  accessLevel?: IntegrationAccessLevel;
}

export type IntegrationProvider = 'linkedin' | 'ats' | 'email' | 'calendar' | 'granola' | 'airtable' | 'google-sheets';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';
export type IntegrationAccessLevel = 'read-write' | 'read-only';

// ============ ATS Types (for Mock ATS and Skills) ============

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  headline?: string;
  summary?: string;
  location?: CandidateLocation;
  source: CandidateSource;
  sourceDetail?: string;
  attachments: Attachment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateLocation {
  city: string;
  state?: string;
  country: string;
}

export type CandidateSource = 'applied' | 'sourced' | 'referral' | 'agency';

export interface Attachment {
  id: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'other';
  filename: string;
  url: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requirements: string[];
  niceToHave: string[];
  salary?: Salary;
  status: JobStatus;
  hiringManagerId: string;
  recruiterId: string;
  openDate: string;
  closeDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export type JobStatus = 'open' | 'closed' | 'on-hold' | 'filled';

export interface Salary {
  min: number;
  max: number;
  currency: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  stage: string;
  stageHistory: StageTransition[];
  appliedAt: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface StageTransition {
  fromStage: string;
  toStage: string;
  movedAt: string;
  movedBy: string;
}

// ============ Interview Notes ============

export interface InterviewNote {
  id: string;
  candidateId: string;
  applicationId?: string;
  jobId?: string;
  type: InterviewNoteType;
  title: string;
  interviewers: string[];
  interviewDate: string;
  duration?: number; // minutes
  summary?: string;
  transcript?: string;
  rating?: InterviewRating;
  recommendation?: InterviewRecommendation;
  highlights?: string[];
  concerns?: string[];
  source?: InterviewNoteSource;
  createdAt: string;
  updatedAt: string;
}

export type InterviewNoteType =
  | 'phone_screen'
  | 'technical'
  | 'behavioral'
  | 'hiring_manager'
  | 'culture_fit'
  | 'panel'
  | 'debrief'
  | 'other';

export type InterviewRating = 1 | 2 | 3 | 4 | 5;

export type InterviewRecommendation =
  | 'strong_hire'
  | 'hire'
  | 'no_hire'
  | 'strong_no_hire';

export type InterviewNoteSource =
  | 'manual'
  | 'brighthire'
  | 'metaview'
  | 'otter'
  | 'fireflies'
  | 'zoom'
  | 'google_meet'
  | 'teams';

// ============ Pagination ============

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============ Skill Usage ============

export interface SkillUsage {
  id: string;
  skillSlug: string;
  skillName: string;
  status: 'success' | 'error' | 'partial';
  durationMs?: number;
  createdAt: string;
}

// ============ Skill Proposals ============

export interface SkillProposalPublic {
  id: string;
  title: string;
  description: string;
  useCases?: string[];
  status: SkillProposalStatus;
  reviewFeedback?: string;
  createdAt: string;
  updatedAt: string;
  // For admin view
  userId?: string;
  userName?: string;
  reviewedAt?: string;
  reviewedByName?: string;
}

export type SkillProposalStatus = 'pending' | 'approved' | 'denied';

export interface SkillProposalCreateRequest {
  title: string;
  description: string;
  useCases?: string[];
}

export interface SkillProposalReviewRequest {
  status: 'approved' | 'denied';
  feedback?: string;
}

// ============ Chat Types ============

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  skillSuggestion?: ChatSkillSuggestion;
  actionResult?: {
    action: string;
    result: unknown;
  };
  timestamp: number;
  /** Internal flag for tool results - not displayed as separate messages */
  isToolResult?: boolean;
}

export interface ChatSkillSuggestion {
  skill: SkillPublic;
  executionType: 'api' | 'claude-desktop';
  status?: 'pending' | 'executing' | 'completed' | 'error';
  result?: unknown;
}

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export type ChatEventType = 'text' | 'skill_suggestion' | 'skill_result' | 'error' | 'done';

export interface ChatTextEvent {
  type: 'text';
  content: string;
}

export interface ChatSkillSuggestionEvent {
  type: 'skill_suggestion';
  skill: SkillPublic;
  executionType: 'api' | 'claude-desktop';
}

export interface ChatSkillResultEvent {
  type: 'skill_result';
  success: boolean;
  data: unknown;
}

export interface ChatActionResultEvent {
  type: 'action_result';
  action: string;
  result: unknown;
}

export interface ChatErrorEvent {
  type: 'error';
  message: string;
}

export interface ChatDoneEvent {
  type: 'done';
}

export type ChatEvent =
  | ChatTextEvent
  | ChatSkillSuggestionEvent
  | ChatSkillResultEvent
  | ChatActionResultEvent
  | ChatErrorEvent
  | ChatDoneEvent;

// ============ Scrape Task Types ============

export type ScrapeTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export interface ScrapeTaskPublic {
  id: string;
  url: string;
  status: ScrapeTaskStatus;
  result?: string; // Markdown content when completed
  errorMessage?: string; // Error description when failed
  suggestion?: string; // Actionable guidance when task fails or stalls
  cached?: boolean; // True if result was returned from cache
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
}

export interface CreateScrapeTaskRequest {
  url: string;
}

export interface CreateScrapeTaskResponse {
  id: string;
  url: string;
  status: 'pending';
  createdAt: string;
}

export interface UpdateScrapeTaskRequest {
  status: 'completed' | 'failed';
  result?: string;
  errorMessage?: string;
}

// ============ Error Attribution Types ============

/**
 * Standardized error codes for telemetry.
 * These codes are safe to store (no PII) and enable easy error attribution.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */
export type ErrorCode =
  // LLM errors
  | 'LLM_AUTH_FAILED'
  | 'LLM_RATE_LIMITED'
  | 'LLM_TIMEOUT'
  | 'LLM_INVALID_RESPONSE'
  | 'LLM_CONTEXT_TOO_LONG'
  | 'LLM_CONTENT_FILTERED'
  // ATS errors
  | 'ATS_AUTH_FAILED'
  | 'ATS_NOT_FOUND'
  | 'ATS_RATE_LIMITED'
  | 'ATS_TIMEOUT'
  | 'ATS_INVALID_REQUEST'
  // Skill errors
  | 'SKILL_NOT_FOUND'
  | 'SKILL_DISABLED'
  | 'SKILL_MISSING_CAPABILITY'
  | 'SKILL_RENDER_FAILED'
  // Scrape errors
  | 'SCRAPE_TIMEOUT'
  | 'SCRAPE_BLOCKED'
  | 'SCRAPE_NOT_LOGGED_IN'
  | 'SCRAPE_INVALID_URL'
  // Integration errors
  | 'INTEGRATION_NOT_CONNECTED'
  | 'INTEGRATION_TOKEN_EXPIRED'
  | 'INTEGRATION_OAUTH_FAILED'
  // System errors
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export type ErrorCategory = 'llm' | 'ats' | 'skill' | 'scrape' | 'integration' | 'system';

/**
 * Error event for telemetry reporting.
 * All fields are PII-safe.
 */
export interface ErrorEventReport {
  errorCode: ErrorCode;
  errorCategory: ErrorCategory;

  // Attribution context (no PII)
  skillSlug?: string;
  provider?: string;
  action?: string;
  httpStatus?: number;

  // Correlation
  sessionId: string;

  timestamp: number;
}

/**
 * Helper to extract error category from error code.
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  if (code.startsWith('LLM_')) return 'llm';
  if (code.startsWith('ATS_')) return 'ats';
  if (code.startsWith('SKILL_')) return 'skill';
  if (code.startsWith('SCRAPE_')) return 'scrape';
  if (code.startsWith('INTEGRATION_')) return 'integration';
  return 'system';
}

// ============ Account Type Types ============

/** Account type: individual (free) or organization (paid) */
export type AccountType = 'individual' | 'organization';

/**
 * Personal email domains that default to individual accounts.
 * Users with these domains are encouraged to use individual accounts.
 * They can still create an organization if they want.
 */
export const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'hotmail.com',
  'live.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'me.com',
  'mac.com',
  'ymail.com',
  'googlemail.com',
  'msn.com',
] as const;

/**
 * Check if an email address uses a personal email domain.
 */
export function isPersonalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return PERSONAL_EMAIL_DOMAINS.includes(domain as typeof PERSONAL_EMAIL_DOMAINS[number]);
}

/**
 * Extract domain from email address.
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

/**
 * Account type info returned by the API for the onboarding flow.
 */
export interface AccountTypeInfo {
  /** Suggested account type based on email domain */
  suggestedType: AccountType;
  /** User's email domain */
  emailDomain: string;
  /** Whether the email is a personal domain (gmail, etc.) */
  isPersonalEmail: boolean;
  /** Existing org that the user can join (if their domain matches an org's allowedDomains) */
  existingOrg?: { id: string; name: string } | null;
  /** Whether the user can create an org (always true, but messaging differs for personal emails) */
  canCreateOrg: boolean;
}

/**
 * Response when selecting individual account type.
 */
export interface SelectIndividualResponse {
  success: boolean;
  user: UserPublic;
}

/**
 * Request to create an organization.
 */
export interface CreateOrgRequest {
  name: string;
}

/**
 * Response when creating an organization.
 */
export interface CreateOrgResponse {
  success: boolean;
  organization: OrganizationPublic;
  user: UserPublic;
}

/**
 * Request to join an existing organization.
 */
export interface JoinOrgRequest {
  orgId: string;
}

/**
 * Response when joining an organization.
 */
export interface JoinOrgResponse {
  success: boolean;
  organization: OrganizationPublic;
  user: UserPublic;
}
