/**
 * Stderr logger for the MCP server.
 * MUST NOT write to stdout - it's reserved for MCP JSON-RPC protocol.
 */

function formatData(data?: Record<string, unknown>): string {
  return data ? ` ${JSON.stringify(data)}` : '';
}

export const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.error(`[skillomatic] ${msg}${formatData(data)}`),
  warn: (msg: string, data?: Record<string, unknown>) =>
    console.error(`[skillomatic:warn] ${msg}${formatData(data)}`),
  error: (msg: string, data?: Record<string, unknown>) =>
    console.error(`[skillomatic:error] ${msg}${formatData(data)}`),
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (process.env.DEBUG) console.error(`[skillomatic:debug] ${msg}${formatData(data)}`);
  },
  /** Log events that should never happen in normal operation */
  unreachable: (msg: string, data?: Record<string, unknown>) =>
    console.error(`[skillomatic:UNREACHABLE] ${msg}${formatData(data)}`),
};
