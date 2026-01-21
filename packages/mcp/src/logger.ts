/**
 * Stderr logger for the MCP server.
 * MUST NOT write to stdout - it's reserved for MCP JSON-RPC protocol.
 */

export const log = {
  info: (msg: string) => console.error(`[skillomatic] ${msg}`),
  error: (msg: string) => console.error(`[skillomatic:error] ${msg}`),
  debug: (msg: string) => {
    if (process.env.DEBUG) console.error(`[skillomatic:debug] ${msg}`);
  },
};
