/**
 * Type definitions for the Skillomatic MCP server.
 * These match the Skillomatic API response shapes.
 */

export interface SkillPublic {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  version: string;
  requiredIntegrations: string[];
  requiredScopes: string[];
  intent: string;
  capabilities: string[];
  isEnabled: boolean;
}

export interface RenderedSkill extends SkillPublic {
  rendered: true;
  instructions: string;
}

export interface CapabilityProfile {
  hasLLM: boolean;
  hasATS: boolean;
  hasCalendar: boolean;
  hasEmail: boolean;
  llmProvider?: string;
  atsProvider?: string;
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
