/**
 * Chat Prompt Utilities
 *
 * Contains helper functions for chat-related functionality.
 * Note: The buildSystemPrompt function was removed as the streaming
 * chat endpoint has been deprecated in favor of client-side LLM calls.
 */

/** Threshold for considering extension "active" - if polled within this time */
const EXTENSION_ACTIVE_THRESHOLD_MS = 15 * 1000; // 15 seconds

/**
 * Check if user's extension was recently active (polled within threshold)
 */
export function isExtensionActive(lastPollAt: Date | null): boolean {
  if (!lastPollAt) return false;
  const timeSinceLastPoll = Date.now() - lastPollAt.getTime();
  return timeSinceLastPoll < EXTENSION_ACTIVE_THRESHOLD_MS;
}
