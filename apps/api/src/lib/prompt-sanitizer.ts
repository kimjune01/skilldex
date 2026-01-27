/**
 * Prompt Injection Protection
 *
 * Sanitizes user-controlled content before embedding in LLM prompts.
 * Prevents injection attacks via specially crafted email addresses,
 * skill descriptions, or external API responses.
 */

// Common prompt injection patterns to detect
const INJECTION_PATTERNS = [
  /\n\s*#{1,6}\s/,           // Markdown headers that could override sections
  /\n\s*---+\s*\n/,          // Horizontal rules (section breaks)
  /<!--[\s\S]*?-->/,         // HTML comments (hidden instructions)
  /\[SYSTEM[:\]]/i,          // Fake system messages
  /\[INST[:\]]/i,            // Instruction markers
  /<<\s*SYS\s*>>/i,          // Llama-style system tags
  /\n\s*```/,                // Code blocks that could contain action blocks
  /IGNORE\s+(ALL\s+)?(PREVIOUS|ABOVE)/i,  // Override attempts
  /DISREGARD\s+(ALL\s+)?(PREVIOUS|ABOVE)/i,
  /NEW\s+INSTRUCTIONS?:/i,
  /OVERRIDE:/i,
  /IMPORTANT\s*:/i,          // Urgency markers
  /CRITICAL\s*:/i,
] as const;

/**
 * Check if content contains potential injection patterns
 */
export function containsInjectionPatterns(content: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Sanitize content for safe embedding in prompts
 * - Escapes markdown formatting that could break prompt structure
 * - Wraps content to prevent it from being interpreted as instructions
 */
export function sanitizeForPrompt(content: string): string {
  if (!content) return '';

  // Replace characters that could break prompt structure
  let sanitized = content
    // Escape markdown headers
    .replace(/^(#{1,6})\s/gm, '\\$1 ')
    // Escape horizontal rules
    .replace(/^---+$/gm, '\\-\\-\\-')
    // Remove HTML comments entirely
    .replace(/<!--[\s\S]*?-->/g, '')
    // Escape code block markers
    .replace(/```/g, '\\`\\`\\`')
    // Neutralize fake system/instruction markers
    .replace(/\[SYSTEM[:\]]/gi, '[system]')
    .replace(/\[INST[:\]]/gi, '[inst]')
    .replace(/<<\s*SYS\s*>>/gi, '<<sys>>')
    // Neutralize override attempts (lowercase them)
    .replace(/IGNORE\s+(ALL\s+)?(PREVIOUS|ABOVE)/gi, (match) => match.toLowerCase())
    .replace(/DISREGARD\s+(ALL\s+)?(PREVIOUS|ABOVE)/gi, (match) => match.toLowerCase())
    .replace(/NEW\s+INSTRUCTIONS?:/gi, 'new instructions:')
    .replace(/OVERRIDE:/gi, 'override:');

  return sanitized;
}

/**
 * Sanitize email address for embedding in prompts
 * Email addresses can contain + and other special chars that could be exploited
 */
export function sanitizeEmail(email: string): string {
  if (!email) return 'unknown';

  // Basic email validation - if it doesn't look like an email, return placeholder
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'invalid-email';
  }

  // Check for injection patterns in email
  if (containsInjectionPatterns(email)) {
    // Return just the sanitized version without the malicious parts
    return sanitizeForPrompt(email);
  }

  // Truncate overly long emails (likely malicious)
  if (email.length > 254) {
    return email.slice(0, 254);
  }

  return email;
}

/**
 * Sanitize skill metadata fields for embedding in system prompt
 */
export function sanitizeSkillMetadata(metadata: {
  description: string;
  intent?: string | null;
  capabilities?: string[];
}): {
  description: string;
  intent?: string;
  capabilities?: string[];
} {
  const result: {
    description: string;
    intent?: string;
    capabilities?: string[];
  } = {
    description: sanitizeForPrompt(metadata.description),
  };

  if (metadata.intent) {
    result.intent = sanitizeForPrompt(metadata.intent);
  }

  if (metadata.capabilities && metadata.capabilities.length > 0) {
    result.capabilities = metadata.capabilities.map((cap) => sanitizeForPrompt(cap));
  }

  return result;
}

/**
 * Wrap external API response for safe embedding in follow-up messages
 * Uses code block format to prevent content from being interpreted as instructions
 */
export function wrapExternalResponse(actionName: string, result: unknown): string {
  const jsonStr = JSON.stringify(result, null, 2);

  // For very large responses, truncate to prevent context overflow
  const maxLength = 10000;
  const truncated = jsonStr.length > maxLength ? jsonStr.slice(0, maxLength) + '\n... (truncated)' : jsonStr;

  // Wrap in code block to prevent interpretation as instructions
  return `Action "${actionName}" completed. Result:
\`\`\`json
${truncated}
\`\`\``;
}
