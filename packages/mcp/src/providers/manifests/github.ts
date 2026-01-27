/**
 * GitHub API Manifest
 *
 * GitHub is a platform for version control and collaboration.
 * Hierarchy: Users/Orgs > Repositories > Issues/PRs/Files
 *
 * @see https://docs.github.com/en/rest
 */

import type { ProviderManifest } from '../types.js';

export const githubManifest: ProviderManifest = {
  provider: 'github',
  displayName: 'GitHub',
  category: 'database',
  baseUrl: 'https://api.github.com',
  apiVersion: '2022-11-28',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 5000, // 5000 requests per hour for authenticated users
    windowSeconds: 3600,
  },

  blocklist: [
    '/admin', // Admin endpoints
    '/authorizations', // OAuth token management
  ],

  operations: [
    // ==================== USER ====================
    {
      id: 'get_authenticated_user',
      method: 'GET',
      path: '/user',
      access: 'read',
      description: 'Get the authenticated user profile.',
      responseHints: ['login', 'id', 'name', 'email', 'avatar_url', 'public_repos'],
    },

    // ==================== REPOSITORIES ====================
    {
      id: 'list_repos',
      method: 'GET',
      path: '/user/repos',
      access: 'read',
      description: 'List repositories for the authenticated user.',
      params: {
        type: {
          type: 'string',
          description: 'Type of repos to list',
          enum: ['all', 'owner', 'public', 'private', 'member'],
          default: 'owner',
        },
        sort: {
          type: 'string',
          description: 'Sort field',
          enum: ['created', 'updated', 'pushed', 'full_name'],
          default: 'updated',
        },
        direction: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
      },
      responseHints: ['id', 'name', 'full_name', 'description', 'html_url', 'private', 'language'],
    },

    {
      id: 'get_repo',
      method: 'GET',
      path: '/repos/{owner}/{repo}',
      access: 'read',
      description: 'Get a specific repository.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or org)',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
      },
      responseHints: ['id', 'name', 'full_name', 'description', 'default_branch', 'open_issues_count'],
    },

    // ==================== ISSUES ====================
    {
      id: 'list_issues',
      method: 'GET',
      path: '/repos/{owner}/{repo}/issues',
      access: 'read',
      description: 'List issues in a repository (includes pull requests by default).',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        state: {
          type: 'string',
          description: 'Issue state',
          enum: ['open', 'closed', 'all'],
          default: 'open',
        },
        labels: {
          type: 'string',
          description: 'Comma-separated label names',
        },
        assignee: {
          type: 'string',
          description: 'Filter by assignee username, "none", or "*"',
        },
        sort: {
          type: 'string',
          description: 'Sort field',
          enum: ['created', 'updated', 'comments'],
          default: 'created',
        },
        direction: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      responseHints: ['id', 'number', 'title', 'state', 'labels', 'assignee', 'created_at', 'html_url'],
    },

    {
      id: 'get_issue',
      method: 'GET',
      path: '/repos/{owner}/{repo}/issues/{issue_number}',
      access: 'read',
      description: 'Get a specific issue.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
          required: true,
        },
      },
      responseHints: ['id', 'number', 'title', 'body', 'state', 'labels', 'assignees', 'comments'],
    },

    {
      id: 'create_issue',
      method: 'POST',
      path: '/repos/{owner}/{repo}/issues',
      access: 'write',
      description: 'Create a new issue.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'Issue title',
          required: true,
        },
        body: {
          type: 'string',
          description: 'Issue body (supports Markdown)',
        },
        labels: {
          type: 'array',
          description: 'Labels to apply',
          items: { type: 'string', description: 'Label name' },
        },
        assignees: {
          type: 'array',
          description: 'Usernames to assign',
          items: { type: 'string', description: 'Username' },
        },
        milestone: {
          type: 'number',
          description: 'Milestone number',
        },
      },
      responseHints: ['id', 'number', 'html_url', 'title'],
    },

    {
      id: 'update_issue',
      method: 'PATCH',
      path: '/repos/{owner}/{repo}/issues/{issue_number}',
      access: 'write',
      description: 'Update an issue (title, body, state, labels, assignees).',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'New title',
        },
        body: {
          type: 'string',
          description: 'New body',
        },
        state: {
          type: 'string',
          description: 'New state',
          enum: ['open', 'closed'],
        },
        labels: {
          type: 'array',
          description: 'Replace all labels',
          items: { type: 'string', description: 'Label name' },
        },
        assignees: {
          type: 'array',
          description: 'Replace all assignees',
          items: { type: 'string', description: 'Username' },
        },
      },
      responseHints: ['id', 'number', 'title', 'state'],
    },

    {
      id: 'create_issue_comment',
      method: 'POST',
      path: '/repos/{owner}/{repo}/issues/{issue_number}/comments',
      access: 'write',
      description: 'Add a comment to an issue.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
          required: true,
        },
      },
      body: {
        body: {
          type: 'string',
          description: 'Comment body (supports Markdown)',
          required: true,
        },
      },
      responseHints: ['id', 'html_url', 'body', 'created_at'],
    },

    // ==================== PULL REQUESTS ====================
    {
      id: 'list_pull_requests',
      method: 'GET',
      path: '/repos/{owner}/{repo}/pulls',
      access: 'read',
      description: 'List pull requests in a repository.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        state: {
          type: 'string',
          description: 'PR state',
          enum: ['open', 'closed', 'all'],
          default: 'open',
        },
        sort: {
          type: 'string',
          description: 'Sort field',
          enum: ['created', 'updated', 'popularity', 'long-running'],
          default: 'created',
        },
        direction: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      responseHints: ['id', 'number', 'title', 'state', 'head', 'base', 'html_url', 'user'],
    },

    {
      id: 'get_pull_request',
      method: 'GET',
      path: '/repos/{owner}/{repo}/pulls/{pull_number}',
      access: 'read',
      description: 'Get a specific pull request.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        pull_number: {
          type: 'number',
          description: 'Pull request number',
          required: true,
        },
      },
      responseHints: ['id', 'number', 'title', 'body', 'state', 'mergeable', 'additions', 'deletions'],
    },

    // ==================== FILES/CONTENTS ====================
    {
      id: 'get_content',
      method: 'GET',
      path: '/repos/{owner}/{repo}/contents/{path}',
      access: 'read',
      description: 'Get file or directory contents. Files are base64-encoded.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        path: {
          type: 'string',
          description: 'Path to file or directory',
          required: true,
        },
        ref: {
          type: 'string',
          description: 'Branch, tag, or commit SHA (defaults to default branch)',
        },
      },
      responseHints: ['name', 'path', 'type', 'content', 'encoding', 'sha'],
    },

    {
      id: 'get_readme',
      method: 'GET',
      path: '/repos/{owner}/{repo}/readme',
      access: 'read',
      description: 'Get the README file for a repository.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        ref: {
          type: 'string',
          description: 'Branch, tag, or commit SHA',
        },
      },
      responseHints: ['name', 'path', 'content', 'encoding', 'html_url'],
    },

    // ==================== LABELS ====================
    {
      id: 'list_labels',
      method: 'GET',
      path: '/repos/{owner}/{repo}/labels',
      access: 'read',
      description: 'List all labels in a repository.',
      params: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      responseHints: ['id', 'name', 'color', 'description'],
    },

    // ==================== SEARCH ====================
    {
      id: 'search_issues',
      method: 'GET',
      path: '/search/issues',
      access: 'read',
      description: 'Search issues and pull requests across repositories.',
      params: {
        q: {
          type: 'string',
          description: 'Search query (e.g., "bug in:title repo:owner/repo is:open")',
          required: true,
        },
        sort: {
          type: 'string',
          description: 'Sort field',
          enum: ['comments', 'reactions', 'created', 'updated'],
        },
        order: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      responseHints: ['total_count', 'items', 'title', 'number', 'state', 'repository_url'],
    },

    {
      id: 'search_repos',
      method: 'GET',
      path: '/search/repositories',
      access: 'read',
      description: 'Search repositories.',
      params: {
        q: {
          type: 'string',
          description: 'Search query (e.g., "tetris language:javascript")',
          required: true,
        },
        sort: {
          type: 'string',
          description: 'Sort field',
          enum: ['stars', 'forks', 'help-wanted-issues', 'updated'],
        },
        order: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      responseHints: ['total_count', 'items', 'full_name', 'description', 'stargazers_count'],
    },
  ],
};
