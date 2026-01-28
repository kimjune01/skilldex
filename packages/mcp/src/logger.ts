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

  /** Log a tool invocation with timing */
  tool: (name: string, args?: Record<string, unknown>) => {
    const startTime = Date.now();
    const argsStr = args && Object.keys(args).length > 0
      ? ` args=${JSON.stringify(args)}`
      : '';
    console.error(`[skillomatic:tool] ${name} called${argsStr}`);

    return {
      success: (extra?: string) => {
        const duration = Date.now() - startTime;
        const extraStr = extra ? ` ${extra}` : '';
        console.error(`[skillomatic:tool] ${name} completed (${duration}ms)${extraStr}`);
      },
      error: (error: unknown) => {
        const duration = Date.now() - startTime;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[skillomatic:tool] ${name} failed (${duration}ms): ${message}`);
      },
    };
  },
};
