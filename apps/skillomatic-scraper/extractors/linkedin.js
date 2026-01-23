/**
 * LinkedIn-specific content extractor
 *
 * This function runs in the context of the page via chrome.scripting.executeScript.
 * IMPORTANT: Must be entirely self-contained - no imports or external references.
 */
function extractLinkedInContent() {
  try {
    const config = {
      inclusionSelectors: ["main"],
      exclusionSelectors: [
        "div[class*='nav']",
        "div[class*='global']",
        ".visually-hidden",
        "footer",
        "div[class*='load']",
        "section.scaffold-layout-toolbar",
        "code",
        "aside",
        "style",
        "noscript",
        "iframe",
        "header",
        "header nav",
        ".advertisement",
        ".cookie-banner",
        ".ad-banner-container",
        ".pv-right-rail__empty-iframe",
        ".artdeco-toast-item",
        ".msg-overlay-list-bubble",
        ".msg-overlay-conversation-bubble",
        ".global-nav"
      ]
    };

    // Clean HTML DOM before conversion
    function cleanHtmlDom(container) {
      // Remove images entirely (logos, profile pics add noise)
      container.querySelectorAll('img').forEach(img => img.remove());

      // Replace anchor tags with just their text content
      container.querySelectorAll('a').forEach(anchor => {
        const textContent = anchor.textContent || '';
        const textNode = document.createTextNode(textContent);
        anchor.parentNode?.replaceChild(textNode, anchor);
      });

      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'noscript', 'iframe', 'link', 'svg',
        'button', 'input', 'textarea', 'select', 'form'
      ];
      unwantedSelectors.forEach(selector => {
        container.querySelectorAll(selector).forEach(el => el.remove());
      });

      // Remove specific UI noise elements (be conservative to avoid removing content)
      const linkedinNoiseSelectors = [
        '.artdeco-dropdown__content',
        '.artdeco-modal',
        '.share-box',
        '.feed-shared-update-v2__description-wrapper'
      ];
      linkedinNoiseSelectors.forEach(selector => {
        try {
          container.querySelectorAll(selector).forEach(el => el.remove());
        } catch (e) { /* ignore invalid selectors */ }
      });

      // Unwrap table elements but keep content
      container.querySelectorAll('table, tr, td, th, tbody, thead, tfoot, caption').forEach(el => {
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.remove();
      });

      // Flatten single-child parents recursively
      function flattenSingleChildParents(element) {
        let child = element.firstElementChild;
        while (
          element.children.length === 1 &&
          element !== container &&
          (!element.textContent || element.textContent.trim() === child?.textContent?.trim())
        ) {
          const parent = element.parentElement;
          if (!parent) break;
          parent.replaceChild(child, element);
          element = child;
          child = element.firstElementChild;
        }
        Array.from(element.children).forEach(flattenSingleChildParents);
      }
      Array.from(container.children).forEach(flattenSingleChildParents);

      // Remove empty elements
      container.querySelectorAll('div, p, span, li, ul, ol, h1, h2, h3, h4, h5, h6, section, article').forEach(el => {
        if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) {
          el.remove();
        }
      });

      return container;
    }

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
            return `\n\n## ${children.trim()}\n\n`;
          case 'h2':
            return `\n\n### ${children.trim()}\n\n`;
          case 'h3':
            return `\n\n#### ${children.trim()}\n\n`;
          case 'h4':
          case 'h5':
          case 'h6':
            return `\n\n**${children.trim()}**\n\n`;
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
          default:
            return children;
        }
      }

      return '';
    }

    // Process markdown - LinkedIn-specific cleanup
    function processMarkdown(markdown) {
      let processed = markdown
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/\*\*\s*\*\*/g, '')
        .replace(/\*\s*\*/g, '');

      // Remove exact duplicate consecutive lines only
      let lines = processed.split('\n');
      lines = lines.filter((line, idx, arr) => {
        if (idx === 0) return true;
        const prevLine = arr[idx - 1].trim();
        const currLine = line.trim();
        // Only remove exact duplicates, not partial matches
        if (prevLine === currLine && currLine !== '') return false;
        return true;
      });

      // Remove sequentially repeated words
      lines = lines.map(line => {
        const words = line.split(/(\s+)/);
        const filtered = words.filter((word, idx, arr) => {
          if (/^\s+$/.test(word)) return true;
          let prevIdx = idx - 1;
          while (prevIdx >= 0 && /^\s+$/.test(arr[prevIdx])) prevIdx--;
          return prevIdx < 0 || word !== arr[prevIdx];
        });
        return filtered.join('');
      });

      // For lines with duplicated halves, keep only the first half
      lines = lines.map(line => {
        if (line.length % 2 === 1) {
          const mid = Math.floor(line.length / 2);
          if (line[mid] === ' ') {
            const front = line.slice(0, mid);
            const back = line.slice(mid + 1);
            if (front === back) return front;
          }
        }
        return line;
      });

      // LinkedIn-specific: filter out UI noise lines
      const noisePatterns = [
        /^Show all \d+/i,
        /^Show (more|less|details|project)$/i,
        /^Edit$/i,
        /^Save$/i,
        /^Saved items$/i,
        /^Send profile in a message$/i,
        /^Save to PDF$/i,
        /^Get started$/i,
        /^Add project$/i,
        /^Contact info$/i,
        /^About this profile$/i,
        /^\d+ profile views?$/i,
        /^\d+ post impressions?$/i,
        /^\d+ search appearances?$/i,
        /^Discover who/i,
        /^Check out who/i,
        /^See how often/i,
        /^Private to you$/i,
        /^Suggested for you/i,
        /^Analytics/i,
        /^Associated with/i,
        /^Show all (companies|groups|schools)$/i,
        /^Create a post$/i,
        /^\d+ followers?$/i,
        /^\d+ members?$/i,
        /^Past \d+ days?$/i,
      ];
      lines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        return !noisePatterns.some(pattern => pattern.test(trimmed));
      });

      return lines.join('\n').trim();
    }

    // Clone and process content
    const tempDiv = document.createElement('div');

    if (config.inclusionSelectors.length > 0) {
      config.inclusionSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          tempDiv.appendChild(el.cloneNode(true));
        });
      });
    } else {
      tempDiv.innerHTML = document.body.innerHTML;
    }

    // Remove excluded elements
    const combinedSelector = config.exclusionSelectors.join(',');
    tempDiv.querySelectorAll(combinedSelector).forEach(el => el.remove());

    // Clean and convert
    cleanHtmlDom(tempDiv);
    let markdown = htmlToMarkdown(tempDiv);
    markdown = processMarkdown(markdown);

    // Build final content
    const title = document.title || '';
    let content = '';
    if (title) {
      content += `# ${title.replace(' | LinkedIn', '')}\n\n`;
    }
    content += `URL: ${window.location.href}\n\n---\n\n`;
    content += markdown;

    // Final cleanup
    content = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

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
  module.exports = { extractLinkedInContent };
}
