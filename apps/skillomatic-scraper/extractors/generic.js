/**
 * Generic content extractor for non-LinkedIn pages
 *
 * This function runs in the context of the page via chrome.scripting.executeScript.
 * IMPORTANT: Must be entirely self-contained - no imports or external references.
 */
function extractGenericContent() {
  try {
    // Convert HTML element to markdown
    function htmlToMarkdown(element) {
      const tagName = element.tagName?.toLowerCase();

      if (['script', 'style', 'noscript', 'svg', 'iframe'].includes(tagName)) {
        return '';
      }

      if (element.hidden || element.style?.display === 'none') {
        return '';
      }

      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent?.trim();
        if (text) return text + ' ';
        return '';
      }

      if (element.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(element.childNodes)
          .map(child => htmlToMarkdown(child))
          .join('');

        switch (tagName) {
          case 'h1':
            return `\n\n# ${children.trim()}\n\n`;
          case 'h2':
            return `\n\n## ${children.trim()}\n\n`;
          case 'h3':
            return `\n\n### ${children.trim()}\n\n`;
          case 'h4':
            return `\n\n#### ${children.trim()}\n\n`;
          case 'h5':
            return `\n\n##### ${children.trim()}\n\n`;
          case 'h6':
            return `\n\n###### ${children.trim()}\n\n`;
          case 'p':
            const trimmed = children.trim();
            return trimmed ? `\n${trimmed}\n` : '';
          case 'br':
            return '\n';
          case 'hr':
            return '\n---\n';
          case 'strong':
          case 'b':
            return `**${children.trim()}**`;
          case 'em':
          case 'i':
            return `*${children.trim()}*`;
          case 'code':
            return `\`${children.trim()}\``;
          case 'pre':
            return `\n\`\`\`\n${children.trim()}\n\`\`\`\n`;
          case 'blockquote':
            return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n`;
          case 'a':
            const href = element.getAttribute('href');
            const text = children.trim();
            if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
              // Make relative URLs absolute
              const absoluteHref = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
              return `[${text}](${absoluteHref})`;
            }
            return text;
          case 'img':
            const alt = element.getAttribute('alt') || '';
            return alt ? `[Image: ${alt}]` : '';
          case 'ul':
            return `\n${Array.from(element.children)
              .map(li => `- ${htmlToMarkdown(li).trim()}`)
              .filter(line => line !== '- ')
              .join('\n')}\n`;
          case 'ol':
            return `\n${Array.from(element.children)
              .map((li, i) => `${i + 1}. ${htmlToMarkdown(li).trim()}`)
              .filter(line => !line.match(/^\d+\. $/))
              .join('\n')}\n`;
          case 'li':
            return children;
          case 'table':
            return convertTable(element);
          default:
            return children;
        }
      }

      return '';
    }

    function convertTable(table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return '';

      let markdown = '\n';
      rows.forEach((row, index) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const rowContent = cells.map(cell => cell.textContent?.trim() || '').join(' | ');
        markdown += `| ${rowContent} |\n`;

        if (index === 0) {
          markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
        }
      });
      markdown += '\n';

      return markdown;
    }

    // Clean the DOM
    const tempDiv = document.createElement('div');

    // Try to get main content, fall back to body
    const mainContent = document.querySelector('main') ||
                        document.querySelector('article') ||
                        document.querySelector('[role="main"]') ||
                        document.body;

    tempDiv.innerHTML = mainContent.innerHTML;

    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'noscript', 'iframe', 'link', 'svg',
      'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ad', '[class*="cookie"]', '[class*="banner"]',
      '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
      'button', 'input', 'textarea', 'select', 'form'
    ];
    unwantedSelectors.forEach(selector => {
      try {
        tempDiv.querySelectorAll(selector).forEach(el => el.remove());
      } catch (e) { /* ignore */ }
    });

    // Remove empty elements
    tempDiv.querySelectorAll('div, p, span, li, ul, ol, section, article').forEach(el => {
      if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) {
        el.remove();
      }
    });

    // Convert to markdown
    let markdown = htmlToMarkdown(tempDiv);

    // Clean up
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\*\*\s*\*\*/g, '')
      .replace(/\*\s*\*/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Build final content
    const title = document.title || '';
    let content = '';
    if (title) {
      content += `# ${title}\n\n`;
    }
    content += `URL: ${window.location.href}\n\n---\n\n`;
    content += markdown;

    // Truncate if too long (30KB limit)
    const MAX_LENGTH = 30 * 1024;
    if (content.length > MAX_LENGTH) {
      content = content.slice(0, MAX_LENGTH) + '\n\n[Content truncated...]';
    }

    return content;
  } catch (err) {
    return `ERROR: ${err.message}\nStack: ${err.stack}`;
  }
}

// Export for use in background.js
if (typeof module !== 'undefined') {
  module.exports = { extractGenericContent };
}
