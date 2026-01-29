/**
 * Email Utilities
 *
 * Helper functions for processing and cleaning email content.
 */

/**
 * Clean up email body for readable markdown output.
 *
 * Handles:
 * - Normalizing line endings (\r\n → \n)
 * - Converting email quote markers (>) to markdown blockquotes
 * - Removing excessive whitespace
 * - Separating the latest reply from the quoted thread
 * - Stripping "On ... wrote:" reply headers
 *
 * @param rawBody - Raw email body text
 * @returns Cleaned markdown-formatted email body
 */
export function cleanupEmailBody(rawBody: string): string {
  if (!rawBody) return '';

  // Normalize line endings
  let body = rawBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines for processing
  const lines = body.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a "On ... wrote:" header (marks start of quoted content)
    const isWriteHeader = /^On .+wrote:$/i.test(line.trim()) ||
                          /^On .+, .+ wrote:$/i.test(line.trim());

    if (isWriteHeader) {
      // Add a separator before quoted content
      if (cleanedLines.length > 0) {
        cleanedLines.push('');
        cleanedLines.push('---');
        cleanedLines.push('**Previous messages:**');
        cleanedLines.push('');
      }
      continue;
    }

    // Handle quoted lines (starting with >)
    if (line.startsWith('>')) {
      // Remove quote markers and clean up
      const unquotedLine = line.replace(/^>+\s?/g, '').trim();

      // Skip empty quoted lines or repeated "On ... wrote:" in quotes
      if (!unquotedLine || /^On .+wrote:$/i.test(unquotedLine)) {
        continue;
      }

      // Add as blockquote
      cleanedLines.push('> ' + unquotedLine);
    } else {
      // Regular line - clean up excessive whitespace
      const trimmed = line.trim();

      // Skip signature delimiters
      if (trimmed === '--' || trimmed === '-- ') {
        // Everything after this is likely a signature, but we'll include it
        cleanedLines.push('');
        cleanedLines.push('---');
        continue;
      }

      cleanedLines.push(trimmed);
    }
  }

  // Join and clean up multiple consecutive blank lines
  let result = cleanedLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  return result.trim();
}
