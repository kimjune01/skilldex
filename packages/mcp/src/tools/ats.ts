/**
 * ATS (Applicant Tracking System) tools for the MCP server.
 * Only registered if the user has an ATS integration connected.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient } from '../api-client.js';

// Schemas for tool inputs
const searchCandidatesSchema = {
  query: z.string().optional().describe('Search query (name, skills, title, etc.)'),
  tags: z.string().optional().describe('Comma-separated tags to filter by'),
  limit: z.number().optional().default(20).describe('Maximum number of results (default: 20)'),
};

const getCandidateSchema = {
  id: z.string().describe('Candidate ID'),
};

const createCandidateSchema = {
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  email: z.string().email().describe('Email address'),
  phone: z.string().optional().describe('Phone number'),
  headline: z.string().optional().describe('Professional headline'),
  summary: z.string().optional().describe('Summary or bio'),
  source: z.enum(['applied', 'sourced', 'referral', 'agency']).optional().describe('Source of the candidate'),
  tags: z.array(z.string()).optional().describe('Tags to assign'),
};

const updateCandidateSchema = {
  id: z.string().describe('Candidate ID to update'),
  firstName: z.string().optional().describe('First name'),
  lastName: z.string().optional().describe('Last name'),
  email: z.string().email().optional().describe('Email address'),
  phone: z.string().optional().describe('Phone number'),
  headline: z.string().optional().describe('Professional headline'),
  summary: z.string().optional().describe('Summary or bio'),
  tags: z.array(z.string()).optional().describe('Tags to assign'),
};

/**
 * Register ATS tools with the MCP server.
 */
export function registerAtsTools(server: McpServer, client: SkillomaticClient): void {
  // Search candidates
  server.tool(
    'search_ats_candidates',
    'Search for candidates in the connected ATS system',
    searchCandidatesSchema,
    async (args) => {
      try {
        const result = await client.searchCandidates({
          q: args.query,
          tags: args.tags,
          limit: args.limit,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  candidates: result.candidates,
                  total: result.total,
                  query: args.query || '(all)',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error searching candidates: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Get candidate by ID
  server.tool(
    'get_ats_candidate',
    'Get detailed information about a specific candidate',
    getCandidateSchema,
    async (args) => {
      try {
        const candidate = await client.getCandidate(args.id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(candidate, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error fetching candidate: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Create candidate
  server.tool(
    'create_ats_candidate',
    'Add a new candidate to the ATS system',
    createCandidateSchema,
    async (args) => {
      try {
        const candidate = await client.createCandidate({
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          phone: args.phone,
          headline: args.headline,
          summary: args.summary,
          source: args.source,
          tags: args.tags,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Created candidate: ${candidate.firstName} ${candidate.lastName}`,
                  candidate,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error creating candidate: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Update candidate
  server.tool(
    'update_ats_candidate',
    'Update an existing candidate in the ATS system',
    updateCandidateSchema,
    async (args) => {
      try {
        const { id, ...updates } = args;
        const candidate = await client.updateCandidate(id, updates);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Updated candidate: ${candidate.firstName} ${candidate.lastName}`,
                  candidate,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error updating candidate: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
