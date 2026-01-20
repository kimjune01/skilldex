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

// ============ Integration Types ============

export interface IntegrationPublic {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncAt?: Date;
  createdAt: Date;
}

export type IntegrationProvider = 'linkedin' | 'ats' | 'email' | 'calendar' | 'granola';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

// ============ ATS Types (for Mock ATS and Skills) ============

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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
