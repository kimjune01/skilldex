/**
 * Integration page constants and configuration
 */
import {
  Briefcase,
  Mail,
  Calendar,
  Table2,
  HardDrive,
  FileText,
  ClipboardList,
  Users,
  ListTodo,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { IntegrationProvider, IntegrationCategory } from '@skillomatic/shared';
import { getProviders } from '@skillomatic/shared';

/**
 * Icon mapping for integration providers
 */
export const providerIcons: Partial<Record<IntegrationProvider | string, LucideIcon>> = {
  ats: Briefcase,
  email: Mail,
  calendar: Calendar,
  scheduling: Calendar,
  'time-tracking': Timer,
  clockify: Timer,
  'google-sheets': Table2,
  'google-drive': HardDrive,
  'google-docs': FileText,
  'google-forms': ClipboardList,
  'google-contacts': Users,
  'google-tasks': ListTodo,
};

/**
 * Google Workspace tools configuration
 */
export const GOOGLE_WORKSPACE_TOOLS = [
  { id: 'google-drive', name: 'Drive', description: 'Search and share files' },
  { id: 'google-docs', name: 'Docs', description: 'Draft and edit documents' },
  { id: 'google-forms', name: 'Forms', description: 'Collect responses' },
  { id: 'google-contacts', name: 'Contacts', description: 'Look up contact info' },
  { id: 'google-tasks', name: 'Tasks', description: 'Create and track tasks' },
] as const;

export type GoogleWorkspaceTool = typeof GOOGLE_WORKSPACE_TOOLS[number];

/**
 * Get sub-providers for a category from the registry.
 * Includes devOnly providers when in development mode.
 */
export function getSubProvidersForCategory(category: IntegrationCategory): { id: string; name: string }[] {
  const includeDevOnly = import.meta.env.DEV;
  return getProviders({ category, includeDevOnly }).map((p) => ({
    id: p.id,
    name: p.displayName,
  }));
}

export type ProviderConfig = {
  id: IntegrationProvider;
  name: string;
  description: string;
  subProviders?: { id: string; name: string }[];
};

/**
 * UI configuration for integration providers.
 * Uses registry for sub-providers where applicable.
 */
export function buildProviderConfigs(): {
  essentialProviders: ProviderConfig[];
  otherProviders: ProviderConfig[];
  timeTrackingProviders: ProviderConfig[];
} {
  // Essential integrations - Gmail, Calendar, and Sheets
  const essentialProviders: ProviderConfig[] = [
    {
      id: 'email',
      name: 'Email',
      description: 'Read, draft, and send messages',
      subProviders: getSubProvidersForCategory('email'),
    },
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Schedule meetings and check availability',
      subProviders: getSubProvidersForCategory('calendar'),
    },
    {
      id: 'google-sheets',
      name: 'Sheets',
      description: 'Store and analyze your data',
    },
  ];

  // Other integrations - specialized tools
  const otherProviders: ProviderConfig[] = [
    {
      id: 'scheduling',
      name: 'Scheduling',
      description: 'Let clients book time with you',
      subProviders: [
        { id: 'calendly', name: 'Calendly' },
        { id: 'cal-com', name: 'Cal.com' },
      ],
    },
    {
      id: 'ats',
      name: 'ATS',
      description: 'Connect your Applicant Tracking System',
      subProviders: getSubProvidersForCategory('ats'),
    },
  ];

  // Time tracking integrations
  const timeTrackingProviders: ProviderConfig[] = [
    {
      id: 'clockify',
      name: 'Clockify',
      description: 'Track time on projects and clients',
    },
  ];

  return { essentialProviders, otherProviders, timeTrackingProviders };
}

/**
 * All Google provider IDs for batch operations
 */
export const GOOGLE_PROVIDER_IDS = [
  'email',
  'calendar',
  'google-sheets',
  'google-drive',
  'google-docs',
  'google-forms',
  'google-contacts',
  'google-tasks',
] as const;

/**
 * Essential Google provider IDs
 */
export const ESSENTIAL_GOOGLE_PROVIDER_IDS = ['email', 'calendar', 'google-sheets'] as const;
