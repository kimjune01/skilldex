import type { WSContext } from 'hono/ws';

export interface ScrapeTaskEvent {
  type: 'task_update';
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  result?: string;
  errorMessage?: string;
}

export interface TaskAssignment {
  type: 'task_assigned';
  task: {
    id: string;
    url: string;
  };
}

// Map of userId -> Set of WebSocket connections (web UI)
const userConnections = new Map<string, Set<WSContext>>();

// Map of userId -> Set of WebSocket connections (extensions ready to receive tasks)
const extensionConnections = new Map<string, Set<WSContext>>();

// Map of taskId -> Set of userIds waiting for this task
const taskWaiters = new Map<string, Set<string>>();

/**
 * Register a WebSocket connection for a user
 */
export function addConnection(userId: string, ws: WSContext): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(ws);
  console.log(`[WS] User ${userId} connected. Total connections: ${userConnections.get(userId)!.size}`);
}

/**
 * Remove a WebSocket connection for a user
 */
export function removeConnection(userId: string, ws: WSContext): void {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
    console.log(`[WS] User ${userId} disconnected. Remaining: ${connections?.size || 0}`);
  }
}

/**
 * Register an extension WebSocket connection for a user
 */
export function addExtensionConnection(userId: string, ws: WSContext): void {
  if (!extensionConnections.has(userId)) {
    extensionConnections.set(userId, new Set());
  }
  extensionConnections.get(userId)!.add(ws);
  console.log(`[WS] Extension for user ${userId} connected. Total: ${extensionConnections.get(userId)!.size}`);
}

/**
 * Remove an extension WebSocket connection
 */
export function removeExtensionConnection(userId: string, ws: WSContext): void {
  const connections = extensionConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      extensionConnections.delete(userId);
    }
    console.log(`[WS] Extension for user ${userId} disconnected. Remaining: ${connections?.size || 0}`);
  }
}

/**
 * Check if user has a connected extension
 */
export function hasExtensionConnected(userId: string): boolean {
  const connections = extensionConnections.get(userId);
  return connections !== undefined && connections.size > 0;
}

/**
 * Push a task assignment to one of the user's connected extensions
 * Returns true if task was assigned to an extension
 */
export function assignTaskToExtension(userId: string, task: { id: string; url: string }): boolean {
  const connections = extensionConnections.get(userId);
  if (!connections || connections.size === 0) {
    return false;
  }

  // Send to the first available extension (round-robin could be added later)
  const ws = connections.values().next().value;
  if (!ws) {
    return false;
  }

  const message: TaskAssignment = {
    type: 'task_assigned',
    task,
  };

  try {
    ws.send(JSON.stringify(message));
    console.log(`[WS] Task ${task.id} assigned to extension for user ${userId}`);
    return true;
  } catch (err) {
    console.error(`[WS] Failed to assign task to extension:`, err);
    return false;
  }
}

/**
 * Subscribe a user to updates for a specific task
 */
export function subscribeToTask(userId: string, taskId: string): void {
  if (!taskWaiters.has(taskId)) {
    taskWaiters.set(taskId, new Set());
  }
  taskWaiters.get(taskId)!.add(userId);
}

/**
 * Unsubscribe a user from a task
 */
export function unsubscribeFromTask(userId: string, taskId: string): void {
  const waiters = taskWaiters.get(taskId);
  if (waiters) {
    waiters.delete(userId);
    if (waiters.size === 0) {
      taskWaiters.delete(taskId);
    }
  }
}

/**
 * Broadcast a task update to all subscribed users
 */
export function broadcastTaskUpdate(taskId: string, event: ScrapeTaskEvent): void {
  const waiters = taskWaiters.get(taskId);
  if (!waiters || waiters.size === 0) {
    return;
  }

  const message = JSON.stringify(event);

  for (const userId of waiters) {
    const connections = userConnections.get(userId);
    if (connections) {
      for (const ws of connections) {
        try {
          ws.send(message);
        } catch (err) {
          console.error(`[WS] Failed to send to user ${userId}:`, err);
        }
      }
    }
  }

  // If task is terminal, clean up waiters
  if (['completed', 'failed', 'expired'].includes(event.status)) {
    taskWaiters.delete(taskId);
  }
}

/**
 * Send a message to a specific user
 */
export function sendToUser(userId: string, message: unknown): void {
  const connections = userConnections.get(userId);
  if (!connections) return;

  const data = typeof message === 'string' ? message : JSON.stringify(message);

  for (const ws of connections) {
    try {
      ws.send(data);
    } catch (err) {
      console.error(`[WS] Failed to send to user ${userId}:`, err);
    }
  }
}

/**
 * Create a promise that resolves when a task completes (or times out)
 */
export function waitForTask(
  userId: string,
  taskId: string,
  timeoutMs: number = 120000
): Promise<ScrapeTaskEvent> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribeFromTask(userId, taskId);
      reject(new Error('Task wait timeout'));
    }, timeoutMs);

    // Subscribe to task updates
    subscribeToTask(userId, taskId);

    // Create a one-time listener for this specific task
    const checkUpdate = (event: ScrapeTaskEvent) => {
      if (event.taskId === taskId && ['completed', 'failed', 'expired'].includes(event.status)) {
        clearTimeout(timeout);
        unsubscribeFromTask(userId, taskId);
        resolve(event);
      }
    };

    // Store the callback so broadcastTaskUpdate can notify us
    // We use a simple approach: poll the connections for messages
    // A more robust solution would use EventEmitter
    taskCallbacks.set(`${userId}:${taskId}`, checkUpdate);
  });
}

// Callbacks for waitForTask - exported so chat.ts can register callbacks directly
export const taskCallbacks = new Map<string, (event: ScrapeTaskEvent) => void>();

/**
 * Notify task callbacks (called from broadcastTaskUpdate)
 */
export function notifyTaskCallback(taskId: string, event: ScrapeTaskEvent): void {
  const waiters = taskWaiters.get(taskId);
  if (!waiters) return;

  for (const userId of waiters) {
    const key = `${userId}:${taskId}`;
    const callback = taskCallbacks.get(key);
    if (callback) {
      callback(event);
      taskCallbacks.delete(key);
    }
  }
}

// Enhanced broadcast that also notifies internal callbacks
export function emitTaskUpdate(taskId: string, event: ScrapeTaskEvent): void {
  broadcastTaskUpdate(taskId, event);
  notifyTaskCallback(taskId, event);
}

/**
 * Get connection stats
 */
export function getStats(): { users: number; connections: number; extensions: number; pendingTasks: number } {
  let totalConnections = 0;
  for (const connections of userConnections.values()) {
    totalConnections += connections.size;
  }
  let totalExtensions = 0;
  for (const connections of extensionConnections.values()) {
    totalExtensions += connections.size;
  }
  return {
    users: userConnections.size,
    connections: totalConnections,
    extensions: totalExtensions,
    pendingTasks: taskWaiters.size,
  };
}
