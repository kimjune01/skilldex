/**
 * Simple tests for content extractors
 * Run with: node extractors.test.js
 */

const assert = require('assert');

// Mock DOM environment
const { JSDOM } = require('jsdom');

function createDOM(html) {
  const dom = new JSDOM(html, { url: 'https://example.com/page' });
  return dom.window;
}

// Load extractors
const { extractLinkedInContent } = require('./linkedin.js');
const { extractGenericContent } = require('./generic.js');

// Test helpers
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    failed++;
  }
}

// ============ Generic Extractor Tests ============

test('generic: extracts title', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Test Page</title></head>
      <body><main><p>Hello world</p></main></body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractGenericContent();
  assert(result.includes('# Test Page'), 'Should include title as h1');
  assert(result.includes('Hello world'), 'Should include body content');
});

test('generic: converts headings to markdown', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body>
        <main>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractGenericContent();
  assert(result.includes('# Heading 1'), 'Should convert h1');
  assert(result.includes('## Heading 2'), 'Should convert h2');
  assert(result.includes('### Heading 3'), 'Should convert h3');
});

test('generic: converts lists to markdown', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body>
        <main>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <ol>
            <li>First</li>
            <li>Second</li>
          </ol>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractGenericContent();
  assert(result.includes('- Item 1'), 'Should convert ul to markdown');
  assert(result.includes('1. First'), 'Should convert ol to markdown');
});

test('generic: removes script and style tags', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body>
        <main>
          <p>Visible content</p>
          <script>alert('bad')</script>
          <style>.foo { color: red; }</style>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractGenericContent();
  assert(result.includes('Visible content'), 'Should include visible content');
  assert(!result.includes('alert'), 'Should not include script content');
  assert(!result.includes('.foo'), 'Should not include style content');
});

test('generic: converts links to markdown', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body>
        <main>
          <a href="https://example.com">Example Link</a>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractGenericContent();
  assert(result.includes('[Example Link](https://example.com)'), 'Should convert links to markdown');
});

test('generic: includes URL in output', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body><main><p>Content</p></main></body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractGenericContent();
  assert(result.includes('URL: https://example.com/page'), 'Should include page URL');
});

// ============ LinkedIn Extractor Tests ============

test('linkedin: removes " | LinkedIn" from title', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>John Doe | LinkedIn</title></head>
      <body><main><p>Profile content</p></main></body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractLinkedInContent();
  assert(result.includes('# John Doe'), 'Should have clean title');
  assert(!result.includes('| LinkedIn'), 'Should remove LinkedIn suffix');
});

test('linkedin: filters UI noise patterns', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Profile</title></head>
      <body>
        <main>
          <p>Real content here</p>
          <p>Show all 5 experiences</p>
          <p>Show more</p>
          <p>Edit</p>
          <p>Private to you</p>
          <p>500 followers</p>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractLinkedInContent();
  assert(result.includes('Real content here'), 'Should include real content');
  assert(!result.includes('Show all 5'), 'Should filter "Show all X"');
  assert(!result.includes('Show more'), 'Should filter "Show more"');
  assert(!result.includes('Private to you'), 'Should filter "Private to you"');
});

test('linkedin: removes images', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Profile</title></head>
      <body>
        <main>
          <img src="profile.jpg" alt="Profile Photo">
          <p>About me</p>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractLinkedInContent();
  assert(result.includes('About me'), 'Should include text content');
  assert(!result.includes('Profile Photo'), 'Should not include image alt text');
  assert(!result.includes('[Image'), 'Should not include image placeholder');
});

test('linkedin: strips links but keeps text', () => {
  const window = createDOM(`
    <!DOCTYPE html>
    <html>
      <head><title>Profile</title></head>
      <body>
        <main>
          <a href="/company/acme">Acme Corp</a>
        </main>
      </body>
    </html>
  `);
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  const result = extractLinkedInContent();
  assert(result.includes('Acme Corp'), 'Should include link text');
  assert(!result.includes('[Acme Corp]'), 'Should not have markdown link format');
  assert(!result.includes('/company/'), 'Should not include href');
});

// ============ Summary ============

console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40));

process.exit(failed > 0 ? 1 : 0);
