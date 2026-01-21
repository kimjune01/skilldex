import { serve } from '@hono/node-server';
import { app, injectWebSocket } from './app.js';

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Starting API server on port ${port}...`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Inject WebSocket support into the server
injectWebSocket(server);

console.log(`API server running at http://localhost:${port}`);
console.log(`WebSocket endpoint available at ws://localhost:${port}/ws/scrape`);
