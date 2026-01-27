# Security

> **Last Updated**: January 2026

## Architecture

Skillomatic uses an **ephemeral architecture** minimizing PII storage:

- **JWT auth** (web) + **API key auth** (skills)
- **OAuth tokens** delegated to Nango Cloud (not stored locally)
- **LLM execution** runs client-side
- **ATS proxy** stateless, no PII logging

## Current State

### ✅ Implemented

| Area | Implementation |
|------|----------------|
| Passwords | bcrypt (10 rounds) |
| API keys | Plaintext (DB encrypted at rest via Turso) |
| OAuth tokens | Encrypted by Nango |
| SQL injection | Drizzle ORM parameterized queries |
| Rate limiting | Per-endpoint limits (login, API, webhooks) |
| Webhook validation | HMAC-SHA256 for Nango/Stripe |
| Security headers | OWASP recommended headers |
| JWT validation | Fails in production without JWT_SECRET |
| CORS | Wildcard with `allowCredentials: false` (required for extensions) |
| Prompt injection | Sanitization + pattern detection (see below) |

## Prompt Injection Protection

**Location**: `apps/api/src/lib/prompt-sanitizer.ts`

User-controlled content is sanitized before embedding in LLM prompts:

| Vector | Mitigation |
|--------|------------|
| Email addresses | Validated format, injection patterns stripped |
| Skill metadata | Description/intent/capabilities sanitized |
| Skill creation | Rejected if injection patterns detected |
| External API responses | Wrapped in code blocks to prevent interpretation |

**Detected patterns**: Markdown headers, HTML comments, fake system markers (`[SYSTEM:]`, `<<SYS>>`), override attempts (`IGNORE PREVIOUS`, `NEW INSTRUCTIONS:`), code blocks.

### ⚠️ Not Yet Implemented

| Item | Risk | Recommendation |
|------|------|----------------|
| Input validation | Medium | Add Zod schemas to API routes |
| Session revocation | Medium | JWT blocklist or short-lived tokens + refresh |
| Fine-grained RBAC | Low | Enforce existing role/permission tables |
| MFA | Low | Add for sensitive operations |

## Authorization Model

**Three-tier system:**
1. Regular users → own data and skills
2. Org admins → org settings and users
3. Super admins → cross-org platform access

**Integration permissions:** `Effective = Admin Policy ∩ Connection Status ∩ User Preference`

## Secret Management

All production secrets stored in AWS SST Secrets:
- `JWT_SECRET`, `TURSO_AUTH_TOKEN`, `NANGO_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`

## Recommendations

**P1**: Zod validation on auth endpoints, session revocation

**P2**: Security monitoring, CI/CD scanning, refresh token rotation

**P3**: Third-party audit, penetration testing, SOC 2 prep
