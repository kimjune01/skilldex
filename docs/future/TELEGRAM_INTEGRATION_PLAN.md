# Telegram Bot Integration Plan

> **Purpose**: Implementation plan for Telegram bot support
>
> **Status**: Planned
>
> **Last Updated**: January 2026

---

## Summary

Add Telegram bot support so users can chat with Skillomatic from Telegram. Inspired by Clawdbot's viral success - mobile-first access is key to accessibility.

**Design decisions:**
- Users can sign up via Telegram (no account required first)
- Ephemeral context (no message history storage - aligns with existing architecture)
- Private DMs only (no group chat support)

## Architecture

```
User's Phone                  Skillomatic
     |                            |
     |  "Check my calendar"       |
     v                            |
+-----------+    webhook     +-----------+
| Telegram  | ------------> |   API     |
|   Bot     |               |  Server   |
|           | <------------ |           |
+-----------+    response   +-----------+
                                  |
                                  v
                            +-----------+
                            |   Chat    |
                            |  Pipeline |
                            +-----------+
```

**User flow (BYOB - Bring Your Own Bot):**
1. User messages @BotFather to create a bot (30 sec)
2. User sends `/start` to their bot with a link token (generated in web UI) OR connects from web UI
3. Skillomatic registers webhook with Telegram
4. User chats with their bot, Skillomatic responds

---

## Database Schema

### New table: `telegram_bots`

```typescript
// packages/db/src/schema.ts

export const telegramBots = sqliteTable('telegram_bots', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Bot credentials
  botToken: text('bot_token').notNull(),    // From @BotFather
  botUsername: text('bot_username'),         // e.g., "my_company_bot"
  botId: text('bot_id').notNull(),          // Extracted from token

  // Webhook config
  webhookSecret: text('webhook_secret').notNull(), // For verification

  // Status
  status: text('status').notNull().default('active'), // 'active' | 'paused' | 'error'
  lastMessageAt: integer('last_message_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('telegram_bots_user_id_idx').on(table.userId),
  botIdIdx: unique('telegram_bots_bot_id_idx').on(table.botId),
}));
```

**Note:** No message storage table (ephemeral architecture). No telegramChats table since we're not tracking history.

---

## API Endpoints

### 1. Telegram webhook (public, no auth)

**File:** `apps/api/src/routes/webhooks/telegram.ts`

```
POST /webhooks/telegram/:botId
```

- Verify `X-Telegram-Bot-Api-Secret-Token` header
- Return 200 immediately (Telegram requires fast response)
- Process message async:
  1. Find user by botId
  2. Send typing indicator
  3. Process through chat pipeline
  4. Send response via Telegram API
  5. Log to skillUsageLogs

### 2. Telegram setup (JWT auth)

**File:** `apps/api/src/routes/telegram.ts`

```
POST /telegram/connect
  Input: { botToken: string }
  - Validate token with Telegram getMe()
  - Generate webhook secret
  - Register webhook with Telegram setWebhook()
  - Create telegram_bots record
  - Return: { bot: TelegramBotPublic }

GET /telegram
  - Return user's connected bot (or null)

DELETE /telegram/disconnect
  - Delete webhook from Telegram
  - Delete telegram_bots record

POST /telegram/test
  - Send test message to user via their bot
```

### 3. Telegram sign-up flow

**File:** `apps/api/src/routes/telegram.ts`

```
POST /telegram/link-token
  Input: { email: string }
  - Generate short-lived token (10 min expiry)
  - Return: { token: string, botInstructions: string }

POST /telegram/verify-link (called by webhook when user sends /start <token>)
  - Verify token, find/create user
  - Associate Telegram chat with user
```

---

## File Changes

### New files:
1. `apps/api/src/routes/telegram.ts` - Setup routes
2. `apps/api/src/routes/webhooks/telegram.ts` - Webhook handler
3. `apps/api/src/lib/telegram.ts` - Telegram API client
4. `apps/web/src/pages/TelegramSetup.tsx` - Setup UI

### Modified files:
1. `packages/db/src/schema.ts` - Add telegram_bots table
2. `apps/api/src/routes/webhooks.ts` - Import telegram webhook
3. `apps/api/src/index.ts` - Mount telegram routes
4. `apps/web/src/pages/Integrations.tsx` - Add Telegram section
5. `apps/web/src/lib/api/index.ts` - Add telegram API client
6. `docs/future/MESSAGING_CHANNELS.md` - Mark as implemented

---

## Implementation Details

### Telegram API Client

```typescript
// apps/api/src/lib/telegram.ts

export class TelegramClient {
  constructor(private botToken: string) {}

  async getMe(): Promise<TelegramUser>
  async setWebhook(url: string, secretToken: string): Promise<boolean>
  async deleteWebhook(): Promise<boolean>
  async sendMessage(chatId: string, text: string): Promise<void>
  async sendChatAction(chatId: string, action: 'typing'): Promise<void>
}

// Split messages at 4096 char limit
export function splitMessage(text: string): string[]
```

### Message Processing

Reuse existing chat pipeline:

```typescript
// apps/api/src/routes/webhooks/telegram.ts

async function processMessage(text: string, userId: string, chatId: string) {
  const telegram = new TelegramClient(bot.botToken);

  // Send typing indicator
  await telegram.sendChatAction(chatId, 'typing');

  // Build system prompt (reuse from chat.ts)
  const systemPrompt = await buildSystemPromptForUser(userId);

  // Call LLM (non-streaming)
  const response = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text }
  ]);

  // Execute actions if present
  let finalResponse = response;
  const action = parseAction(response);
  if (action) {
    const result = await executeAction(action, userId);
    finalResponse = await chat([...messages,
      { role: 'assistant', content: response },
      { role: 'user', content: `[Action result: ${JSON.stringify(result)}]` }
    ]);
  }

  // Send response (split if > 4096 chars)
  for (const chunk of splitMessage(finalResponse)) {
    await telegram.sendMessage(chatId, chunk);
  }
}
```

### Rate Limiting

```typescript
// 20 messages per minute per user
const telegramRateLimit = rateLimit({
  limit: 20,
  windowMs: 60_000,
  keyGenerator: (c) => {
    const botId = c.req.param('botId');
    return `telegram:${botId}`;
  }
});
```

### Security

1. **Webhook verification**: Telegram sends `X-Telegram-Bot-Api-Secret-Token` header
2. **Bot token storage**: Stored in DB (Turso encrypts at rest)
3. **User isolation**: Each user has their own bot, no cross-user access

---

## Frontend UI

### Connections page addition

Add "Messaging Channels" section to `apps/web/src/pages/Integrations.tsx`:

```tsx
<Card>
  <CardHeader>
    <MessageCircle className="h-5 w-5" />
    <CardTitle>Telegram</CardTitle>
    <CardDescription>Chat with Skillomatic from Telegram</CardDescription>
  </CardHeader>
  <CardContent>
    {telegramBot ? (
      <div>
        <Badge>@{telegramBot.botUsername}</Badge>
        <Button onClick={disconnect}>Disconnect</Button>
      </div>
    ) : (
      <Button onClick={() => navigate('/telegram/setup')}>
        Connect Telegram
      </Button>
    )}
  </CardContent>
</Card>
```

### Setup page

`apps/web/src/pages/TelegramSetup.tsx`:

1. Step 1: Instructions to create bot via @BotFather
2. Step 2: Paste bot token
3. Step 3: Success - show bot username and test button

---

## Commands

Support these Telegram commands:

- `/start` - Welcome message + instructions
- `/help` - Show available commands
- `/status` - Show connected integrations

---

## Testing Checklist

1. Create bot via @BotFather
2. Connect in Skillomatic web UI
3. Send message from Telegram
4. Verify response received
5. Test action execution (e.g., "search for engineers")
6. Test long response splitting (> 4096 chars)
7. Test rate limiting
8. Disconnect and verify cleanup

---

## Implementation Phases

### Phase 1: Core (MVP)
- [ ] Add telegram_bots table to schema
- [ ] Create TelegramClient library
- [ ] Create webhook endpoint
- [ ] Create connect/disconnect endpoints
- [ ] Process messages through chat pipeline

### Phase 2: Frontend
- [ ] Add Telegram section to Connections page
- [ ] Create TelegramSetup page
- [ ] Add test message button

### Phase 3: Polish
- [ ] Add rate limiting
- [ ] Add /help, /status commands
- [ ] Handle errors gracefully
- [ ] Update docs

---

## Open Questions (Deferred)

1. **Sign-up via Telegram**: Full implementation deferred - start with web UI connection flow
2. **Group chats**: Deferred - private DMs only for MVP
3. **Message history**: Deferred - ephemeral for now, can add later

---

## References

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Bot Webhooks](https://core.telegram.org/bots/webhooks)
- [MESSAGING_CHANNELS.md](./MESSAGING_CHANNELS.md) - Original exploration doc
