import { Hono } from 'hono';
import { createNodeWebSocket } from '@hono/node-ws';
import { verifyToken } from '../../lib/jwt.js';
import {
  addConnection,
  removeConnection,
  subscribeToTask,
  unsubscribeFromTask,
  getStats,
} from '../../lib/scrape-events.js';

export const wsScrapeRoutes = new Hono();

// Create WebSocket helper for Node.js
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: wsScrapeRoutes });

// WebSocket endpoint for scrape task notifications
// Client connects to: /ws/scrape?token=JWT_TOKEN
wsScrapeRoutes.get(
  '/',
  upgradeWebSocket(async (c) => {
    // Get token from query param (WebSocket doesn't support headers easily)
    const token = c.req.query('token');

    if (!token) {
      // Return handlers that immediately close
      return {
        onOpen(_event, ws) {
          ws.close(4001, 'Missing authentication token');
        },
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        onOpen(_event, ws) {
          ws.close(4002, 'Invalid or expired token');
        },
      };
    }

    const userId = payload.id;

    return {
      onOpen(_event, ws) {
        addConnection(userId, ws);
        ws.send(JSON.stringify({ type: 'connected', userId }));
      },

      onMessage(event, ws) {
        try {
          const data = JSON.parse(event.data.toString());

          // Handle subscription messages
          if (data.type === 'subscribe' && data.taskId) {
            subscribeToTask(userId, data.taskId);
            ws.send(JSON.stringify({ type: 'subscribed', taskId: data.taskId }));
          }

          if (data.type === 'unsubscribe' && data.taskId) {
            unsubscribeFromTask(userId, data.taskId);
            ws.send(JSON.stringify({ type: 'unsubscribed', taskId: data.taskId }));
          }

          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }

          if (data.type === 'stats') {
            ws.send(JSON.stringify({ type: 'stats', ...getStats() }));
          }
        } catch {
          // Ignore parse errors
        }
      },

      onClose(_event, ws) {
        removeConnection(userId, ws);
      },

      onError(event, ws) {
        console.error('[WS] Error:', event);
        removeConnection(userId, ws);
      },
    };
  })
);

// Export the WebSocket injector for use in index.ts
export { injectWebSocket };
