import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { systemSettings } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth, adminOnly } from '../middleware/auth.js';

export const settingsRoutes = new Hono();

// All routes require admin
settingsRoutes.use('*', jwtAuth);
settingsRoutes.use('*', adminOnly);

// LLM provider configuration
const LLM_PROVIDERS = {
  groq: {
    key: 'llm.groq_api_key',
    name: 'Groq',
    models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.1-8b-instant',
  },
  anthropic: {
    key: 'llm.anthropic_api_key',
    name: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  openai: {
    key: 'llm.openai_api_key',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o',
  },
} as const;

type ProviderId = keyof typeof LLM_PROVIDERS;

// GET /settings/llm - Get LLM configuration
settingsRoutes.get('/llm', async (c) => {
  const settings = await db.select().from(systemSettings);
  const settingsMap = new Map(settings.map(s => [s.key, s]));

  // Build provider status
  const providers = Object.entries(LLM_PROVIDERS).map(([id, config]) => {
    const setting = settingsMap.get(config.key);
    const hasKey = !!setting?.value;

    return {
      id,
      name: config.name,
      configured: hasKey,
      models: config.models,
      defaultModel: config.defaultModel,
      // Show masked key if configured
      apiKeyPreview: hasKey ? maskApiKey(setting!.value) : null,
    };
  });

  // Get current default provider
  const defaultProvider = settingsMap.get('llm.default_provider')?.value || 'groq';
  const defaultModel = settingsMap.get('llm.default_model')?.value || 'llama-3.1-8b-instant';

  return c.json({
    data: {
      providers,
      defaultProvider,
      defaultModel,
    },
  });
});

// PUT /settings/llm/:provider - Set API key for a provider
settingsRoutes.put('/llm/:provider', async (c) => {
  const providerId = c.req.param('provider') as ProviderId;
  const provider = LLM_PROVIDERS[providerId];

  if (!provider) {
    return c.json({ error: { message: 'Unknown provider' } }, 400);
  }

  const body = await c.req.json<{ apiKey: string }>();
  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return c.json({ error: { message: 'API key is required' } }, 400);
  }

  // Validate key format (basic check)
  if (!validateApiKeyFormat(providerId, apiKey)) {
    return c.json({ error: { message: 'Invalid API key format' } }, 400);
  }

  const user = c.get('user');

  // Upsert the setting
  await db.insert(systemSettings)
    .values({
      key: provider.key,
      value: apiKey,
      isSecret: true,
      updatedAt: new Date(),
      updatedBy: user.sub,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: apiKey,
        updatedAt: new Date(),
        updatedBy: user.sub,
      },
    });

  return c.json({
    data: {
      provider: providerId,
      configured: true,
      apiKeyPreview: maskApiKey(apiKey),
    },
  });
});

// DELETE /settings/llm/:provider - Remove API key
settingsRoutes.delete('/llm/:provider', async (c) => {
  const providerId = c.req.param('provider') as ProviderId;
  const provider = LLM_PROVIDERS[providerId];

  if (!provider) {
    return c.json({ error: { message: 'Unknown provider' } }, 400);
  }

  await db.delete(systemSettings).where(eq(systemSettings.key, provider.key));

  return c.json({ data: { success: true } });
});

// PUT /settings/llm/default - Set default provider and model
settingsRoutes.put('/llm/default', async (c) => {
  const body = await c.req.json<{ provider: string; model: string }>();
  const { provider, model } = body;

  if (!provider || !LLM_PROVIDERS[provider as ProviderId]) {
    return c.json({ error: { message: 'Invalid provider' } }, 400);
  }

  const providerConfig = LLM_PROVIDERS[provider as ProviderId];
  if (!providerConfig.models.includes(model as never)) {
    return c.json({ error: { message: 'Invalid model for provider' } }, 400);
  }

  const user = c.get('user');

  // Upsert default provider
  await db.insert(systemSettings)
    .values({
      key: 'llm.default_provider',
      value: provider,
      isSecret: false,
      updatedAt: new Date(),
      updatedBy: user.sub,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: provider,
        updatedAt: new Date(),
        updatedBy: user.sub,
      },
    });

  // Upsert default model
  await db.insert(systemSettings)
    .values({
      key: 'llm.default_model',
      value: model,
      isSecret: false,
      updatedAt: new Date(),
      updatedBy: user.sub,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: model,
        updatedAt: new Date(),
        updatedBy: user.sub,
      },
    });

  return c.json({
    data: {
      defaultProvider: provider,
      defaultModel: model,
    },
  });
});

// Helper: Mask API key for display
function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

// Helper: Validate API key format
function validateApiKeyFormat(provider: ProviderId, key: string): boolean {
  switch (provider) {
    case 'groq':
      return key.startsWith('gsk_') && key.length > 20;
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 20;
    case 'openai':
      return key.startsWith('sk-') && key.length > 20;
    default:
      return key.length > 10;
  }
}
