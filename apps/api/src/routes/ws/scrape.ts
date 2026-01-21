import type { Context } from 'hono';
import type { WSEvents } from 'hono/ws';
import { db } from '@skillomatic/db';
import { users, organizations, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '../../lib/jwt.js';
import { validateApiKey } from '../../lib/api-keys.js';
import {
  addConnection,
  removeConnection,
  addExtensionConnection,
  removeExtensionConnection,
  subscribeToTask,
  unsubscribeFromTask,
  getStats,
} from '../../lib/scrape-events.js';

/**
 * Create WebSocket handler for scrape task notifications
 * Web UI connects to: /ws/scrape?token=JWT_TOKEN
 * Extension connects to: /ws/scrape?apiKey=sk_live_...&mode=extension
 */
export function createWsScrapeHandler() {
  return async (c: Context): Promise<WSEvents> => {
    const token = c.req.query('token');
    const apiKey = c.req.query('apiKey');
    const mode = c.req.query('mode'); // 'extension' for browser extension

    // Try JWT auth first, then API key
    let userId: string | null = null;
    let userOrgId: string | null = null;
    let userOnboardingStep: number = 0;
    let isExtension = mode === 'extension';

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    } else if (apiKey) {
      const user = await validateApiKey(apiKey);
      if (user) {
        userId = user.id;
        userOrgId = user.organizationId;
        userOnboardingStep = user.onboardingStep ?? 0;
        isExtension = true; // API key auth implies extension
      }
    }

    if (!userId) {
      return {
        onOpen(_event, ws) {
          ws.close(4001, 'Missing or invalid authentication');
        },
      };
    }

    // Capture for closure
    const authenticatedUserId = userId;
    const authenticatedUserOrgId = userOrgId;
    const authenticatedUserOnboardingStep = userOnboardingStep;
    const isExtensionConnection = isExtension;

    return {
      onOpen(_event, ws) {
        if (isExtensionConnection) {
          addExtensionConnection(authenticatedUserId, ws);
          ws.send(JSON.stringify({ type: 'connected', userId: authenticatedUserId, mode: 'extension' }));

          /*
           * =======================================================================
           * EXTENSION ONBOARDING: This is where we detect the browser extension
           * connecting for the first time. When the extension connects via
           * WebSocket with mode=extension, we advance onboarding.
           *
           * Only advance if:
           * - Organization has desktopEnabled=true (extension only for BYOAI)
           * - User hasn't already passed EXTENSION_INSTALLED step
           * =======================================================================
           */
          if (authenticatedUserOrgId && authenticatedUserOnboardingStep < ONBOARDING_STEPS.EXTENSION_INSTALLED) {
            // Check if org has desktop enabled before advancing onboarding
            db.select()
              .from(organizations)
              .where(eq(organizations.id, authenticatedUserOrgId))
              .limit(1)
              .then(([org]) => {
                if (org?.desktopEnabled) {
                  db.update(users)
                    .set({
                      onboardingStep: ONBOARDING_STEPS.EXTENSION_INSTALLED,
                      updatedAt: new Date(),
                    })
                    .where(eq(users.id, authenticatedUserId))
                    .execute()
                    .catch(console.error);
                }
              })
              .catch(console.error);
          }
        } else {
          addConnection(authenticatedUserId, ws);
          ws.send(JSON.stringify({ type: 'connected', userId: authenticatedUserId }));
        }
      },

      onMessage(event, ws) {
        try {
          const data = JSON.parse(event.data.toString());

          // Handle subscription messages (web UI only)
          if (data.type === 'subscribe' && data.taskId) {
            subscribeToTask(authenticatedUserId, data.taskId);
            ws.send(JSON.stringify({ type: 'subscribed', taskId: data.taskId }));
          }

          if (data.type === 'unsubscribe' && data.taskId) {
            unsubscribeFromTask(authenticatedUserId, data.taskId);
            ws.send(JSON.stringify({ type: 'unsubscribed', taskId: data.taskId }));
          }

          // Heartbeat to keep connection alive
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
        if (isExtensionConnection) {
          removeExtensionConnection(authenticatedUserId, ws);
        } else {
          removeConnection(authenticatedUserId, ws);
        }
      },

      onError(event, ws) {
        console.error('[WS] Error:', event);
        if (isExtensionConnection) {
          removeExtensionConnection(authenticatedUserId, ws);
        } else {
          removeConnection(authenticatedUserId, ws);
        }
      },
    };
  };
}
