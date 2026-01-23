# Engineering Best Practices

> Non-obvious lessons from building Skillomatic. Focus on decisions that are easy to accidentally violate.

---

## 1. Ephemeral Architecture: No PII on Server

The biggest refactor in this project's history. Don't accidentally reintroduce server-side PII storage.

**The rule:** Client calls LLM directly. Server only handles auth and skill rendering.

```
✅ Client → Anthropic API (direct)
✅ Client → Server → ATS (stateless proxy, no logging of bodies)
❌ Client → Server → LLM (stores conversation history)
```

**When proxying third-party APIs (ATS):**
- Forward requests, don't store request/response bodies
- Log only metadata: `{ userId, statusCode, durationMs }` - never candidate data
- Fetch OAuth tokens just-in-time from Nango, don't cache in our DB

See `docs/EPHEMERAL_ARCHITECTURE.md` for full context.

---

## 2. Error Codes, Not Raw Messages

Raw error messages leak PII. Use standardized codes.

```typescript
// ❌ PII risk - error.message might contain candidate names
await db.insert(errorEvents).values({
  errorMessage: error.message,
});

// ✅ Safe - exhaustive allowlist of codes
await db.insert(errorEvents).values({
  errorCode: 'ATS_AUTH_FAILED', // from ErrorCode type
  errorCategory: 'ats',
});
```

The `ErrorCode` type in `packages/shared/src/types.ts` is the allowlist. Add new codes there, never log raw strings.

---

## 3. Progressive Skill Disclosure

Skills load in two levels to keep system prompts small:

**Level 1 (system prompt):** Metadata only - name, description, intent
**Level 2 (on demand):** Full instructions via `load_skill` action

```typescript
// GET /skills - metadata for all skills (goes in system prompt)
[{ slug, name, description, intent }]

// GET /skills/:slug - full rendered instructions (loaded when needed)
{ instructions: "Full content with {{API_KEY}} replaced..." }
```

Don't put full skill instructions in the system prompt. The LLM asks for them when relevant.

---

## 4. Dual Auth on /v1/* Routes

The `/v1/ats/*` routes accept both JWT (web chat) and API keys (Claude Desktop). Use `combinedAuth` middleware, not `apiKeyAuth` alone.

```typescript
// ✅ Accepts either auth method
app.use('/v1/*', combinedAuth);

// ❌ Breaks web chat (which uses JWT)
app.use('/v1/*', apiKeyAuth);
```

---

## 5. Manifest-Based Tool Generation

ATS tools are generated from provider manifests, not hand-coded. This enforces consistent security.

```typescript
// packages/mcp/src/providers/manifests/greenhouse.ts
export const greenhouseManifest: ProviderManifest = {
  operations: [...],
  blocklist: ['/users', '/webhooks', '/eeoc'], // Never exposed
};
```

**When adding ATS operations:**
1. Add to the manifest's `operations` array
2. Set correct `access` level: `'read'`, `'write'`, or `'dangerous'`
3. Add sensitive paths to `blocklist`

Don't add ATS endpoints by creating new route handlers.

---

## 6. Floats for Ordered Steps

Onboarding steps use floats so new steps can be inserted between existing ones:

```typescript
export const ONBOARDING_STEPS = {
  NOT_STARTED: 0,
  ATS_CONNECTED: 1,
  API_KEY_GENERATED: 2,
  EXTENSION_INSTALLED: 2.5,  // Added later without migration
  DEPLOYMENT_CONFIGURED: 3,
  COMPLETE: 4,
} as const;
```

Don't renumber existing steps - existing users have these values stored.

---

## 7. Validate User-Provided URLs

When users provide URLs (iCal feeds, webhooks), validate content before storing:

```typescript
// Check iCal feed doesn't contain PII (should be free/busy only)
const piiPatterns = [
  /ATTENDEE:/i,           // Has attendee emails
  /LOCATION:.{3,}/i,      // Has meeting locations
  /SUMMARY:(?!Busy|Free)/ // Has event titles (not just "Busy")
];

for (const pattern of piiPatterns) {
  if (pattern.test(icalData)) {
    return { valid: false, error: 'Calendar contains PII. Use free/busy only.' };
  }
}
```

---

## 8. Integration Permissions are Three-Way

Effective access = `min(orgAdmin, userChoice)` when integration is connected:

```
Org Admin Setting | User Choice | Connected? | Effective Access
read-write        | read-write  | yes        | read-write
read-write        | read-only   | yes        | read-only
read-only         | read-write  | yes        | read-only (capped by admin)
disabled          | any         | any        | none
any               | any         | no         | none
```

Check `effectiveAccess` from the capability profile, not raw settings.

---

## 9. Skills Have Two Visibility Paths

System skills (`isGlobal=true`): Seeded from `/skills/<slug>/SKILL.md`, visible to all orgs.

User-generated skills: Created via chat, start as `visibility: 'private'`, can request `'organization'` visibility.

```typescript
// Query pattern for getting user's available skills
const skills = await db.query.skills.findMany({
  where: or(
    eq(skills.isGlobal, true),                              // System skills
    eq(skills.organizationId, user.organizationId),         // Org skills
    and(eq(skills.userId, user.id), eq(skills.visibility, 'private')) // User's private
  ),
});
```

---

## Quick Reference: What NOT to Do

| Don't | Why | Do Instead |
|-------|-----|------------|
| Log error.message to DB | May contain PII | Use ErrorCode enum |
| Store LLM conversations | PII in chat history | Client-side only |
| Cache ATS responses | Candidate data | Stateless proxy |
| Put full skills in system prompt | Context bloat | Progressive disclosure |
| Use apiKeyAuth on /v1/* | Breaks web chat | Use combinedAuth |
| Add ATS routes manually | Bypasses blocklist | Add to manifest |
| Renumber ONBOARDING_STEPS | Breaks existing users | Use floats between |
