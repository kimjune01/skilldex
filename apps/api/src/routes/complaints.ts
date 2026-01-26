/**
 * Complaints route - creates GitHub issues for bug reports
 *
 * Users can submit complaints via the UI, which creates a GitHub issue
 * with the complaint message and auto-captured context (URL, browser info).
 */
import { Hono } from 'hono';
import { jwtAuth, superAdminOnly } from '../middleware/auth.js';
import type { ComplaintCreateRequest } from '@skillomatic/shared';

export const complaintsRoutes = new Hono();

// All routes require JWT auth
complaintsRoutes.use('*', jwtAuth);

// GitHub config - uses skillomatic repo
const GITHUB_OWNER = 'junekim-rippling';
const GITHUB_REPO = 'skillomatic';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues?q=is%3Aissue+is%3Aopen+label%3Auser-reported`;

// GET /complaints/count - Get count of open user-reported issues (superadmin only)
complaintsRoutes.get('/count', superAdminOnly, async (c) => {
  if (!GITHUB_TOKEN) {
    return c.json({ data: { count: 0, url: GITHUB_ISSUES_URL } });
  }

  try {
    // Search for open issues with user-reported label
    const searchQuery = `repo:${GITHUB_OWNER}/${GITHUB_REPO} is:issue is:open label:user-reported`;
    const response = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', response.status);
      return c.json({ data: { count: 0, url: GITHUB_ISSUES_URL } });
    }

    const data = await response.json();
    return c.json({
      data: {
        count: data.total_count || 0,
        url: GITHUB_ISSUES_URL,
      },
    });
  } catch (error) {
    console.error('Error fetching GitHub issues:', error);
    return c.json({ data: { count: 0, url: GITHUB_ISSUES_URL } });
  }
});

// POST /complaints - Create a GitHub issue
complaintsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<ComplaintCreateRequest>();

  if (!body.message || body.message.trim().length === 0) {
    return c.json({ error: { message: 'Message is required' } }, 400);
  }

  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN not configured');
    return c.json({ error: { message: 'Bug reporting is not configured' } }, 500);
  }

  // Build issue body with context
  const issueBody = `## Bug Report

**User ID:** \`${user.id}\`
**Email:** ${user.email}
**Organization:** ${user.organizationId ? `\`${user.organizationId}\`` : 'Individual user'}

### Description
${body.message.trim()}

### Context
- **Page URL:** ${body.pageUrl || 'Not provided'}
- **Screen Size:** ${body.screenSize || 'Not provided'}
- **User Agent:** ${body.userAgent || 'Not provided'}
- **Submitted:** ${new Date().toISOString()}

---
*Submitted via Complain button*`;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[Bug] ${body.message.trim().slice(0, 60)}${body.message.length > 60 ? '...' : ''}`,
        body: issueBody,
        labels: ['bug', 'user-reported'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return c.json({ error: { message: 'Failed to submit bug report' } }, 500);
    }

    const issue = await response.json();

    return c.json({
      data: {
        success: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      },
    }, 201);
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return c.json({ error: { message: 'Failed to submit bug report' } }, 500);
  }
});
