/**
 * OpenAPI 3.1 Specification for Skillomatic API
 *
 * This spec is served statically for chatbot/AI consumption at /api/docs/openapi.json
 * Human-readable docs available at /api/docs (Swagger UI) or /api/docs/redoc (ReDoc)
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Skillomatic API',
    version: '1.0.0',
    description: `
Skillomatic is a platform for managing AI skills for recruiting workflows.

## Authentication

All protected endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

Admin-only endpoints additionally require the user to have \`isAdmin: true\`.

## Response Format

All responses follow a consistent format:
\`\`\`json
{
  "data": { ... }  // Success response
}
\`\`\`

or on error:
\`\`\`json
{
  "error": { "message": "Error description" }
}
\`\`\`
    `.trim(),
    contact: {
      name: 'Skillomatic Support',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management (admin only)' },
    { name: 'Skills', description: 'Skill catalog and downloads' },
    { name: 'Analytics', description: 'Usage analytics' },
    { name: 'Settings', description: 'System settings (admin only)' },
    { name: 'Proposals', description: 'Skill proposals' },
    { name: 'API Keys', description: 'API key management' },
  ],
  paths: {
    // Auth
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', description: 'JWT token' },
                        user: { $ref: '#/components/schemas/UserPublic' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user info',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // Users (Admin)
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/UserPublic' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                  isAdmin: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/UserPublic' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'User deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { message: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // Skills
    '/skills': {
      get: {
        tags: ['Skills'],
        summary: 'List all skills',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of skills',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Skill' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/skills/{slug}': {
      get: {
        tags: ['Skills'],
        summary: 'Get skill by slug',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Skill details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Skill' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/skills/{slug}/download': {
      get: {
        tags: ['Skills'],
        summary: 'Download skill markdown file (public)',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Skill markdown content',
            content: {
              'text/markdown': {
                schema: { type: 'string' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/skills/install.sh': {
      get: {
        tags: ['Skills'],
        summary: 'Download install script for all skills (public)',
        responses: {
          '200': {
            description: 'Bash install script',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },

    // Analytics
    '/analytics/usage': {
      get: {
        tags: ['Analytics'],
        summary: 'Get current user usage stats',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Number of days to look back' },
        ],
        responses: {
          '200': {
            description: 'User usage analytics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/UsageAnalytics' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/analytics/admin': {
      get: {
        tags: ['Analytics'],
        summary: 'Get platform-wide analytics (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Number of days to look back' },
        ],
        responses: {
          '200': {
            description: 'Platform-wide analytics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/AdminAnalytics' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // Settings (Admin)
    '/settings/llm': {
      get: {
        tags: ['Settings'],
        summary: 'Get LLM configuration (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'LLM settings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/LLMSettings' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/settings/llm/{provider}': {
      put: {
        tags: ['Settings'],
        summary: 'Set API key for LLM provider (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['groq', 'anthropic', 'openai'] } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['apiKey'],
                properties: {
                  apiKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'API key set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        provider: { type: 'string' },
                        configured: { type: 'boolean' },
                        apiKeyPreview: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      delete: {
        tags: ['Settings'],
        summary: 'Remove API key for LLM provider (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['groq', 'anthropic', 'openai'] } },
        ],
        responses: {
          '200': {
            description: 'API key removed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', properties: { success: { type: 'boolean' } } },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/settings/llm/default': {
      put: {
        tags: ['Settings'],
        summary: 'Set default LLM provider and model (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['provider', 'model'],
                properties: {
                  provider: { type: 'string', enum: ['groq', 'anthropic', 'openai'] },
                  model: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Default set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        defaultProvider: { type: 'string' },
                        defaultModel: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // Proposals
    '/proposals': {
      get: {
        tags: ['Proposals'],
        summary: 'List skill proposals (user sees own, admin sees all)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'denied'] } },
        ],
        responses: {
          '200': {
            description: 'List of proposals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Proposal' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Proposals'],
        summary: 'Create a new skill proposal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  useCases: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Proposal created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/proposals/{id}': {
      get: {
        tags: ['Proposals'],
        summary: 'Get proposal by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Proposal details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Proposals'],
        summary: 'Update proposal (owner only, pending status only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  useCases: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Proposal updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      delete: {
        tags: ['Proposals'],
        summary: 'Delete proposal',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Proposal deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', properties: { success: { type: 'boolean' } } },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/proposals/{id}/review': {
      post: {
        tags: ['Proposals'],
        summary: 'Review proposal (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['approved', 'denied'] },
                  feedback: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Proposal reviewed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Proposal' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          isAdmin: { type: 'boolean' },
        },
      },
      Skill: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['sourcing', 'outreach', 'ats', 'analytics', 'other'] },
          version: { type: 'string' },
          requiredIntegrations: { type: 'array', items: { type: 'string' } },
          requiredScopes: { type: 'array', items: { type: 'string' } },
          intent: { type: 'string' },
          capabilities: { type: 'array', items: { type: 'string' } },
          isEnabled: { type: 'boolean' },
        },
      },
      Proposal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          useCases: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['pending', 'approved', 'denied'] },
          reviewFeedback: { type: 'string', nullable: true },
          reviewedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid', description: 'Only included for admins' },
          userName: { type: 'string', description: 'Only included for admins' },
          userEmail: { type: 'string', description: 'Only included for admins' },
        },
      },
      UsageAnalytics: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              totalExecutions: { type: 'integer' },
              successCount: { type: 'integer' },
              errorCount: { type: 'integer' },
              successRate: { type: 'string' },
              avgDurationMs: { type: 'integer' },
            },
          },
          bySkill: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skillSlug: { type: 'string' },
                skillName: { type: 'string' },
                count: { type: 'integer' },
              },
            },
          },
          daily: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                count: { type: 'integer' },
              },
            },
          },
          recentLogs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                skillSlug: { type: 'string' },
                skillName: { type: 'string' },
                status: { type: 'string' },
                durationMs: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      AdminAnalytics: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              totalExecutions: { type: 'integer' },
              successCount: { type: 'integer' },
              errorCount: { type: 'integer' },
              successRate: { type: 'string' },
              avgDurationMs: { type: 'integer' },
              uniqueUsers: { type: 'integer' },
            },
          },
          bySkill: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skillSlug: { type: 'string' },
                skillName: { type: 'string' },
                category: { type: 'string' },
                count: { type: 'integer' },
                uniqueUsers: { type: 'integer' },
              },
            },
          },
          topUsers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                userName: { type: 'string' },
                userEmail: { type: 'string' },
                count: { type: 'integer' },
              },
            },
          },
          daily: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                count: { type: 'integer' },
                uniqueUsers: { type: 'integer' },
              },
            },
          },
          recentErrors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skillSlug: { type: 'string' },
                skillName: { type: 'string' },
                errorMessage: { type: 'string', nullable: true },
                count: { type: 'integer' },
              },
            },
          },
        },
      },
      LLMSettings: {
        type: 'object',
        properties: {
          providers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: ['groq', 'anthropic', 'openai'] },
                name: { type: 'string' },
                configured: { type: 'boolean' },
                models: { type: 'array', items: { type: 'string' } },
                defaultModel: { type: 'string' },
                apiKeyPreview: { type: 'string', nullable: true },
              },
            },
          },
          defaultProvider: { type: 'string' },
          defaultModel: { type: 'string' },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - invalid or missing JWT token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - admin access required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
};
