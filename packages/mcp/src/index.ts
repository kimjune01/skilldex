/**
 * Skillomatic MCP Server
 *
 * Provides automation tools for business workflows - spreadsheets, databases, web scraping, and more.
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
import { wrapWithTracing } from './traced-server.js';
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
    if (message.includes('Cannot connect')) {
      log.error(`Start the API server with: pnpm dev`);
    } else if (message.includes('Cannot resolve')) {
      log.error(`Check SKILLOMATIC_API_URL is correct`);
    } else {
      log.error(`Check your API key is valid and not revoked`);
    }
    process.exit(1);
  }

  // Get user's capabilities
  let capabilities;
  try {
    const config = await client.getCapabilities();
    capabilities = config.profile;
    log.info(`Capabilities: ATS=${capabilities.hasATS}, Email=${capabilities.hasEmail}, Calendar=${capabilities.hasCalendar}`);
    log.info(`Google Workspace: Sheets=${capabilities.hasGoogleSheets}, Drive=${capabilities.hasGoogleDrive}, Docs=${capabilities.hasGoogleDocs}, Forms=${capabilities.hasGoogleForms}, Contacts=${capabilities.hasGoogleContacts}, Tasks=${capabilities.hasGoogleTasks}`);

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
    // Only warn about Sheets since it's the most commonly used Google Workspace tool
    if (!capabilities.hasGoogleSheets) {
      warnings.push('No Google Sheets connected - Sheets tools will not be available');
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
    // Continue with empty capabilities
    capabilities = {
      hasLLM: false,
      hasATS: false,
      hasCalendar: false,
      hasEmail: false,
      hasGoogleSheets: false,
      hasGoogleDrive: false,
      hasGoogleDocs: false,
      hasGoogleForms: false,
      hasGoogleContacts: false,
      hasGoogleTasks: false,
    };
  }

  // Create MCP server with automatic tracing for all tool calls
  const mcpServer = new McpServer(
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
  const server = wrapWithTracing(mcpServer);

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
