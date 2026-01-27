# Messaging Channels: Telegram, Discord, Slack

> **Purpose**: Exploratory doc for adding messaging app integrations
>
> **Status**: Exploration
>
> **Last Updated**: January 2026

---

## Executive Summary

Users want to chat with Skillomatic from apps they already use. This doc explores the three easiest options - all have official APIs, are free/cheap, and don't require user-side infrastructure.

| Channel | Difficulty | Cost | Best For |
|---------|------------|------|----------|
| **Telegram** | Easy | Free | Solo users, international |
| **Discord** | Easy | Free | Communities, tech-savvy |
| **Slack** | Medium | Free tier | Business users, teams |

---

## Option 1: Telegram Bot

### Why Telegram

- 900M+ monthly active users
- Popular with international users, freelancers, crypto/tech crowd
- Best-in-class Bot API - designed for this use case
- No approval process, instant setup
- Free, no rate limits for reasonable usage

### How It Works

1. User creates a bot via @BotFather (takes 30 seconds)
2. User gives Skillomatic the bot token
3. Skillomatic receives messages via webhook or polling
4. Skillomatic responds through the bot

```
User's Phone                  Skillomatic
     │                            │
     │  "Check my calendar"       │
     ▼                            │
┌─────────┐    webhook      ┌─────────┐
│Telegram │ ──────────────► │   API   │
│  Bot    │                 │ Server  │
│         │ ◄────────────── │         │
└─────────┘    response     └─────────┘
```

### Implementation

**Webhook endpoint:**
```typescript
// apps/api/src/routes/webhooks/telegram.ts
app.post('/webhooks/telegram/:botId', async (c) => {
  const botId = c.req.param('botId');
  const update = await c.req.json();

  // Find user by bot token
  const integration = await findIntegrationByTelegramBot(botId);
  if (!integration) return c.json({ ok: true }); // Ignore unknown bots

  // Extract message
  const message = update.message?.text;
  if (!message) return c.json({ ok: true });

  // Process through Skillomatic
  const response = await processUserMessage(integration.userId, message);

  // Send response back
  await sendTelegramMessage(integration.botToken, update.message.chat.id, response);

  return c.json({ ok: true });
});
```

**User setup flow:**
1. Go to Connections page
2. Click "Connect Telegram"
3. Instructions: "Message @BotFather, create a bot, paste token here"
4. We register webhook: `https://api.skillomatic.com/webhooks/telegram/{uniqueId}`
5. User messages their bot, we respond

### Pros
- Official API, won't get banned
- Rich messages (buttons, markdown, images)
- File sharing works
- Group chat support possible
- Instant delivery

### Cons
- User must create their own bot (30 sec but still friction)
- Bot username is public (anyone can find it)
- No end-to-end encryption for bots

### Effort Estimate
- API route: ~100 LOC
- Setup UI: ~150 LOC
- DB schema: Add `telegramBotToken`, `telegramChatId` to integrations
- Total: ~2-3 hours

---

## Option 2: Discord Bot

### Why Discord

- 200M+ monthly active users
- Strong in gaming, tech, creator communities
- Excellent bot ecosystem
- Slash commands for structured interactions
- Free, generous rate limits

### How It Works

**Option A: User creates their own bot (like Telegram)**
- User creates Discord app, adds bot to their server
- Gives us the token
- We respond to messages

**Option B: Shared Skillomatic bot (easier for user)**
- One Skillomatic bot that users add to their servers
- User links Discord account to Skillomatic
- Bot only responds to linked users

Option B is better UX but requires more infrastructure.

### Implementation (Option A - simpler)

```typescript
// apps/api/src/routes/webhooks/discord.ts
// Discord uses Gateway (WebSocket) not webhooks for messages
// But we can use Interactions endpoint for slash commands

app.post('/webhooks/discord', async (c) => {
  const body = await c.req.json();

  // Verify Discord signature
  if (!verifyDiscordSignature(c.req, body)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Handle ping
  if (body.type === 1) {
    return c.json({ type: 1 });
  }

  // Handle slash command
  if (body.type === 2) {
    const userId = body.member?.user?.id;
    const command = body.data?.options?.[0]?.value;

    // Defer response (we have 3 seconds to respond)
    // Process async and use followup
    processDiscordCommand(body, command);

    return c.json({
      type: 5, // Deferred response
    });
  }
});
```

### Pros
- Rich embeds (formatted responses)
- Slash commands (structured input)
- Buttons and select menus
- Thread support
- Server-based (good for teams)

### Cons
- More complex than Telegram (Gateway vs webhooks)
- Users need a Discord server
- Bot permissions can be confusing

### Effort Estimate
- Interactions endpoint: ~150 LOC
- Slash command registration: ~50 LOC
- Setup UI: ~150 LOC
- Total: ~4-5 hours

---

## Option 3: Slack App

### Why Slack

- 30M+ daily active users
- The business communication tool
- Native to work context (where Skillomatic is useful)
- App Directory for distribution
- Events API for real-time messages

### How It Works

1. Create Skillomatic Slack App (one-time, us)
2. User installs app to their workspace via OAuth
3. User DMs the Skillomatic bot
4. We receive via Events API, respond via Web API

```
User's Slack                  Skillomatic
     │                            │
     │  DM to @Skillomatic        │
     ▼                            │
┌─────────┐   Events API    ┌─────────┐
│  Slack  │ ──────────────► │   API   │
│Workspace│                 │ Server  │
│         │ ◄────────────── │         │
└─────────┘   Web API       └─────────┘
```

### Implementation

```typescript
// apps/api/src/routes/webhooks/slack.ts
app.post('/webhooks/slack/events', async (c) => {
  const body = await c.req.json();

  // Verify Slack signature
  if (!verifySlackSignature(c.req)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Handle URL verification challenge
  if (body.type === 'url_verification') {
    return c.json({ challenge: body.challenge });
  }

  // Handle message events
  if (body.event?.type === 'message' && !body.event?.bot_id) {
    const slackUserId = body.event.user;
    const message = body.event.text;
    const channel = body.event.channel;

    // Find Skillomatic user by Slack workspace + user
    const integration = await findSlackIntegration(body.team_id, slackUserId);
    if (!integration) return c.json({ ok: true });

    // Process and respond
    const response = await processUserMessage(integration.userId, message);
    await postSlackMessage(integration.accessToken, channel, response);
  }

  return c.json({ ok: true });
});
```

### OAuth Flow

```typescript
// apps/api/src/routes/integrations/slack.ts
app.get('/integrations/slack/connect', async (c) => {
  const state = generateState();
  const url = `https://slack.com/oauth/v2/authorize?` +
    `client_id=${SLACK_CLIENT_ID}` +
    `&scope=chat:write,im:history,im:read,im:write` +
    `&user_scope=` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&state=${state}`;
  return c.redirect(url);
});

app.get('/integrations/slack/callback', async (c) => {
  const code = c.req.query('code');

  // Exchange code for token
  const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const { access_token, team, authed_user } = await tokenResponse.json();

  // Store integration
  await saveSlackIntegration(userId, {
    accessToken: access_token,
    teamId: team.id,
    teamName: team.name,
    slackUserId: authed_user.id,
  });

  return c.redirect('/integrations?success=Slack connected');
});
```

### Pros
- One-click install (OAuth, no token copying)
- Professional context
- App Directory visibility
- Slash commands + shortcuts
- Thread support

### Cons
- Requires Slack App approval for distribution (can use internally first)
- More complex OAuth
- Rate limits stricter than Telegram

### Effort Estimate
- Events endpoint: ~150 LOC
- OAuth flow: ~100 LOC
- Setup UI: ~100 LOC
- Slack App configuration: ~1 hour
- Total: ~5-6 hours

---

## Comparison

| Factor | Telegram | Discord | Slack |
|--------|----------|---------|-------|
| **User friction** | Medium (create bot) | High (create bot + server) | Low (one-click OAuth) |
| **Our friction** | Low | Medium | Medium |
| **Target audience** | Solo, international | Communities, tech | Business, teams |
| **Message limits** | Generous | Generous | 1 msg/sec per channel |
| **Rich responses** | Markdown, buttons | Embeds, buttons | Blocks, buttons |
| **Distribution** | Direct link | Bot invite link | App Directory |

---

## Recommendation

### Start with Telegram

1. **Lowest effort** (~2-3 hours)
2. **Best API** (designed for bots)
3. **No approval needed**
4. **Good for solo users** (Skillomatic's current focus)

### Then add Slack

1. **Business credibility**
2. **One-click OAuth** (better UX than Telegram)
3. **Work context** (where people need AI assistance)

### Skip Discord for now

- Audience overlap with Desktop Chat users (tech-savvy)
- More complex than Telegram for similar outcome
- Add later if users ask

---

## Implementation Plan

### Phase 1: Telegram (MVP)
- [ ] Add `telegram_bot_token`, `telegram_chat_id` to integrations table
- [ ] Create `/webhooks/telegram/:id` endpoint
- [ ] Add "Connect Telegram" to Connections page
- [ ] Setup instructions with @BotFather link
- [ ] Test end-to-end

### Phase 2: Slack
- [ ] Create Slack App in Slack API dashboard
- [ ] Implement OAuth flow
- [ ] Create Events API endpoint
- [ ] Add to Connections page
- [ ] Submit to Slack App Directory (optional)

---

## Open Questions

1. **Rate limiting** - How to handle users who spam messages?
2. **Context** - How much conversation history to maintain per channel?
3. **Multi-channel** - Same user on Telegram + Slack - unified history?
4. **Notifications** - Should Skillomatic proactively message users? (automations tie-in)
5. **Pricing** - Free tier limits? Premium for messaging channels?

---

## References

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Discord Interactions](https://discord.com/developers/docs/interactions/receiving-and-responding)
- [Slack Events API](https://api.slack.com/apis/connections/events-api)
- [Slack OAuth](https://api.slack.com/authentication/oauth-v2)
