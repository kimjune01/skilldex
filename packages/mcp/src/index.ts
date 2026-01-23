#!/usr/bin/env node
/**
 * Skillomatic MCP Server
 *
 * Provides recruiting workflow tools for ATS operations, web scraping, and more.
 * Skills are discovered via get_skill_catalog and fetched via get_skill tools.
 *
 * Required environment variables:
 * - SKILLOMATIC_API_KEY: Your Skillomatic API key (sk_live_...)
 *
 * Optional environment variables:
 * - SKILLOMATIC_API_URL: API base URL (default: http://localhost:3000)
 * - DEBUG: Enable debug logging
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRequire } from 'module';
import { SkillomaticClient } from './api-client.js';
import { registerTools } from './tools/index.js';
import { log } from './logger.js';

// Read version from package.json
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

async function main(): Promise<void> {
  // Get configuration from environment
  const apiKey = process.env.SKILLOMATIC_API_KEY;
  const apiUrl = process.env.SKILLOMATIC_API_URL || 'http://localhost:3000';

  // Validate required config
  if (!apiKey) {
    log.error('SKILLOMATIC_API_KEY environment variable is required');
    log.error('Get your API key from your Skillomatic dashboard: Desktop Chat > Generate Key');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk_')) {
    log.error('Invalid API key format. Key should start with "sk_live_" or "sk_test_"');
    process.exit(1);
  }

  log.info(`Connecting to Skillomatic at ${apiUrl}`);

  // Create API client
  const client = new SkillomaticClient({ baseUrl: apiUrl, apiKey });

  // Verify authentication
  let userName: string;
  try {
    const user = await client.verifyAuth();
    userName = user.name || user.email;
    log.info(`Authenticated as: ${userName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Authentication failed: ${message}`);
    log.error('Please check your SKILLOMATIC_API_KEY is valid and not revoked.');
    process.exit(1);
  }

  // Get user's capabilities
  let capabilities;
  try {
    const config = await client.getCapabilities();
    capabilities = config.profile;
    log.info(`Capabilities: ATS=${capabilities.hasATS}, Email=${capabilities.hasEmail}, Calendar=${capabilities.hasCalendar}`);

    // Warn about missing capabilities that limit functionality
    const warnings: string[] = [];
    if (!capabilities.hasATS) {
      warnings.push('No ATS connected - ATS tools will not be available');
    }
    if (!capabilities.hasEmail) {
      warnings.push('No email integration - email tools will not be available');
    }
    if (!capabilities.hasCalendar) {
      warnings.push('No calendar integration - calendar tools will not be available');
    }
    if (warnings.length > 0) {
      log.info('');
      log.info('=== Missing Integrations ===');
      warnings.forEach((w) => log.info(`  - ${w}`));
      log.info('Connect integrations at your Skillomatic dashboard to enable more tools.');
      log.info('');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Failed to fetch capabilities: ${message}`);
    log.error('Some tools may be unavailable. Check your network connection and API key.');
    // Continue with empty capabilities
    capabilities = {
      hasLLM: false,
      hasATS: false,
      hasCalendar: false,
      hasEmail: false,
    };
  }

  // Create MCP server
  const server = new McpServer(
    {
      name: 'skillomatic',
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools (based on user capabilities)
  await registerTools(server, client, capabilities);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log.info(`Skillomatic MCP server v${version} ready`);

  // Graceful shutdown handling
  const shutdown = async () => {
    log.info('Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Run the server
main().catch((error) => {
  console.error('[skillomatic:fatal]', error);
  process.exit(1);
});
