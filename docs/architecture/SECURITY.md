# Security Concerns and Recommendations

> **Purpose**: Security audit and recommendations for Skillomatic platform.
>
> **Last Updated**: January 2026

## Executive Summary

Skillomatic follows an **ephemeral architecture** where minimal PII is stored on the server. The security model relies on:

1. **JWT-based web authentication** with API key authentication for skill access
2. **OAuth token delegation** via Nango Cloud (tokens not stored locally)
3. **Client-side LLM execution** with credentials rendered into skills at request time
4. **Stateless ATS proxy** that forwards requests without logging PII

This document outlines current security mechanisms, identified concerns, and recommendations.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Authorization](#2-authorization)
3. [Data Protection](#3-data-protection)
4. [API Security](#4-api-security)
5. [Input Validation](#5-input-validation)
6. [Secret Management](#6-secret-management)
7. [Session Management](#7-session-management)
8. [Error Handling](#8-error-handling)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Critical Concerns](#10-critical-concerns)
11. [Recommendations](#11-recommendations)

---

## 1. Authentication

### JWT Authentication (Web Interface)

**Location**: `apps/api/src/lib/jwt.ts`

| Aspect | Current State | Assessment |
|--------|---------------|------------|
| Algorithm | HS256 (symmetric) | Acceptable for single-server |
| Expiration | 7 days | Consider shorter for sensitive apps |
| Issuer/Audience | Validated | Good |
| Library | `jose` | Good - well-maintained |

**Concern**: JWT secret defaults to `'your-jwt-secret-here-change-in-production'` if environment variable is not set.

```typescript
// apps/api/src/lib/jwt.ts:5
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
);
```

**Risk**: If deployed without setting `JWT_SECRET`, anyone can forge valid tokens.

### API Key Authentication (Skills)

**Location**: `apps/api/src/lib/api-keys.ts`

| Aspect | Current State | Assessment |
|--------|---------------|------------|
| Format | `sk_live_*` / `sk_test_*` prefixes | Good - easy to identify in logs |
| Generation | 32-byte random (64 hex chars) | Good entropy |
| Revocation | Soft-delete via `revokedAt` | Good |
| Tracking | `lastUsedAt` timestamp | Good for monitoring |

**Good**: API keys are now encrypted at rest using AES-256-GCM.

```typescript
// packages/db/src/schema.ts
key: text('key').notNull(), // Encrypted API key (AES-256-GCM)
```

Keys are encrypted before storage and decrypted when needed. The encryption key is stored in environment variables (`API_KEY_ENCRYPTION_KEY` or falls back to `JWT_SECRET`), not in the database. This provides defense-in-depth: a database breach alone does not expose the keys.

### Password Authentication

**Location**: `apps/api/src/lib/users.ts`, `apps/api/src/routes/auth.ts`

| Aspect | Current State | Assessment |
|--------|---------------|------------|
| Hashing | bcrypt with 10 rounds | Good |
| Comparison | `bcrypt.compareSync` (constant-time) | Good |
| Error messages | Generic "Invalid credentials" | Good - prevents enumeration |

### Google OAuth

**Location**: `apps/api/src/routes/auth.ts`

| Aspect | Current State | Assessment |
|--------|---------------|------------|
| Flow | Authorization code flow | Good |
| Token storage | Server-side only | Good |
| Domain mapping | Auto-assigns to org by email domain | Good for enterprise |

---

## 2. Authorization

### Role-Based Access Control

**Location**: `apps/api/src/middleware/auth.ts`

Three-tier system:
1. **Regular users** - Access own data and skills
2. **Org admins** (`isAdmin`) - Manage org settings and users
3. **Super admins** (`isSuperAdmin`) - Cross-org platform access

Middleware guards:
- `adminOnly` - Requires super admin
- `superAdminOnly` - Requires super admin
- `orgAdminOnly` - Requires org admin status

**Note**: RBAC tables exist in schema (`roles`, `permissions`, `rolePermissions`, `userRoles`) but fine-grained enforcement is not yet implemented.

### Integration Permissions

**Location**: `apps/api/src/lib/integration-permissions.ts`

Three-way intersection model:
```
Effective Permission = Admin Policy ∩ Connection Status ∩ User Preference
```

| Category | Individual Accounts | Organization Accounts |
|----------|--------------------|-----------------------|
| ATS | Disabled | Full access |
| Email | Full access | Full access |
| Calendar | Full access | Full access |
| Database | Google Sheets only | Full access |

### Skill Access Controls

- Org-level skill allowlist/blocklist
- Visibility levels: `private`, `organization`, `global`
- Pending approval workflow for shared skills

---

## 3. Data Protection

### Data at Rest

| Data Type | Storage | Protection |
|-----------|---------|------------|
| Passwords | SQLite/Turso | bcrypt hash (10 rounds) |
| API keys | SQLite/Turso | **Plaintext** (concern) |
| OAuth tokens | Nango Cloud | Encrypted by Nango |
| Org LLM keys | SQLite/Turso | Schema mentions encryption |
| Scrape results | Client IndexedDB | Local to user's browser |
| Candidate data | **Not stored** | Ephemeral - passes through only |

### Data in Transit

| Path | Protection |
|------|------------|
| Browser ↔ API | HTTPS (TLS 1.2+) |
| API ↔ ATS providers | HTTPS |
| API ↔ Nango | HTTPS |
| Client ↔ LLM providers | HTTPS (direct from browser) |

### PII Handling

The ephemeral architecture minimizes PII storage:

1. **ATS data** - Proxied without storage or logging
2. **LLM conversations** - Executed client-side
3. **Scrape results** - Stored in browser IndexedDB (24-hour TTL)
4. **Error events** - Use safe error codes, not raw messages

---

## 4. API Security

### CORS Configuration

**Location**: `sst.config.ts`, `apps/api/src/app.ts`

| Environment | Configuration | Notes |
|-------------|---------------|-------|
| Production | `allowOrigins: ["*"]` | Required for browser extensions |
| Development | Explicit origin list | More restrictive |

**Context**: Wildcard CORS is needed because browser extension origins (`chrome-extension://xxx`) are unique per user and cannot be enumerated.

**Mitigations**:
- `allowCredentials: false` when using wildcard
- API key authentication required for sensitive operations

### Rate Limiting

**Current State**: No rate limiting implemented.

**Risk**: Vulnerable to:
- Brute force attacks on login
- API abuse and excessive usage
- Credential stuffing attacks
- Denial of service

### Request Headers

| Header | Status |
|--------|--------|
| X-Request-ID | Implemented (tracing) |
| Content-Security-Policy | Not implemented |
| X-Frame-Options | Not implemented |
| X-Content-Type-Options | Not implemented |
| Strict-Transport-Security | Not implemented |

### Request Size Limits

**Current State**: No explicit request size limits configured.

---

## 5. Input Validation

### Current Approach

Routes use TypeScript inference with `c.req.json<T>()` and `c.req.param()` but minimal runtime validation.

**Concern**: No formal validation library (Zod schemas) enforced on API routes, despite Zod being available as a dependency.

### SQL Injection Prevention

**Good**: Drizzle ORM used consistently with parameterized queries.

**Example** (`apps/api/src/routes/v1/database.ts`):
- Admin query endpoint validates SELECT-only queries
- Keyword blocklist (INSERT, UPDATE, DELETE, DROP, etc.)
- Table allowlist
- Sensitive column redaction

### XSS Prevention

- API returns JSON (implicit protection)
- Frontend sanitization responsibility (not audited)
- No explicit sanitization library detected

### Validation Examples

**Good validation** (`apps/api/src/routes/v1/stripe.ts`):
```typescript
// UUID validation before database query
if (!req.userId || !/^[a-f0-9-]+$/i.test(req.userId)) {
  return c.json({ error: 'Invalid user ID' }, 400);
}
```

**Missing validation** (many routes):
```typescript
// Body parsed without validation
const { email, password } = await c.req.json<{ email: string; password: string }>();
```

---

## 6. Secret Management

### Environment Variables

| Secret | Storage | Notes |
|--------|---------|-------|
| JWT_SECRET | Environment | Requires configuration |
| TURSO_AUTH_TOKEN | AWS SST Secrets (prod) | Good |
| NANGO_SECRET_KEY | AWS SST Secrets (prod) | Good |
| GOOGLE_CLIENT_SECRET | AWS SST Secrets (prod) | Good |
| STRIPE_SECRET_KEY | AWS SST Secrets (prod) | Good |

### Secret Access Patterns

**Good practices**:
- Secrets from environment variables
- Production uses AWS SST Secrets
- `.env.example` contains no real secrets

**Concerns**:
- Some secrets have fallback defaults that could be insecure

---

## 7. Session Management

### JWT Sessions

| Aspect | Current State | Assessment |
|--------|---------------|------------|
| Duration | 7 days | Consider shorter |
| Refresh mechanism | None implemented | Missing |
| Revocation | None (wait for expiry) | Missing |
| Storage | `sessions` table (unused for JWT) | N/A |

**Risk**: Stolen JWTs remain valid until expiration (7 days).

### API Key Sessions

| Aspect | Current State |
|--------|---------------|
| Expiration | None (permanent until revoked) |
| Revocation | Soft-delete via `revokedAt` |
| Usage tracking | `lastUsedAt` timestamp |

---

## 8. Error Handling

### Error Response Design

**Good practices**:
- Generic messages for auth failures (prevents enumeration)
- Structured error codes (`ErrorCode` enum)
- Global error handler in `apps/api/src/app.ts`

### Error Logging

**Good practices**:
- Structured logging with `createLogger` utility
- Error events use safe codes, not raw messages
- Audit logging for permission changes

**Concern**: Stack traces might leak in development mode.

### Error Event Storage

```typescript
// Error codes stored, not raw messages
type ErrorCode =
  | 'LLM_AUTH_FAILED' | 'LLM_RATE_LIMITED' | 'LLM_TIMEOUT'
  | 'ATS_AUTH_FAILED' | 'ATS_NOT_FOUND' | 'ATS_RATE_LIMITED'
  | 'SKILL_NOT_FOUND' | 'SKILL_DISABLED' | 'SKILL_MISSING_CAPABILITY'
  | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR'
  // ...
```

---

## 9. Third-Party Integrations

### Nango (OAuth Token Management)

| Aspect | Status | Notes |
|--------|--------|-------|
| Token storage | Handled by Nango | Encrypted at rest |
| Token refresh | Automatic | Good |
| Webhook validation | **Not implemented** | Concern |

**Concern**: Nango webhooks accepted without signature validation.

```typescript
// apps/api/src/routes/webhooks.ts:48
// No signature verification before processing
```

### Stripe

| Aspect | Status |
|--------|--------|
| Webhook signature | Validated via `constructEvent` |
| Raw body handling | Correct implementation |
| Error responses | Appropriate status codes |

### ATS Providers

| Aspect | Status |
|--------|--------|
| Request proxy | Stateless - no PII logging |
| Token handling | Fresh tokens from Nango |
| CORS | Server-side proxy (required) |

---

## 10. Critical Concerns

### High Priority

#### 1. ~~API Keys Stored in Plaintext~~ (RESOLVED)

**Status**: Fixed - API keys are now encrypted at rest using AES-256-GCM.

**Implementation**: `apps/api/src/lib/encryption.ts`
- Keys encrypted with AES-256-GCM before storage
- Unique IV per encryption operation
- Encryption key from environment variable (not database)
- Automatic migration of legacy plaintext keys on first use

#### 2. ~~No Rate Limiting~~ (RESOLVED)

**Status**: Fixed - Rate limiting implemented for all endpoints.

**Implementation**: `apps/api/src/middleware/rate-limit.ts`
- Login: 5 attempts per 15 minutes per IP
- API: 100 requests per minute per API key
- General: 60 requests per minute per user
- Webhooks: 100 requests per minute per IP

#### 3. ~~No Nango Webhook Signature Validation~~ (RESOLVED)

**Status**: Fixed - Webhook signatures validated using HMAC-SHA256.

**Implementation**: `apps/api/src/lib/webhook-security.ts`

#### 4. ~~Default JWT Secret~~ (RESOLVED)

**Status**: Fixed - Application fails to start in production without JWT_SECRET.

**Implementation**: `apps/api/src/lib/jwt.ts`

#### 5. ~~No Security Headers~~ (RESOLVED)

**Status**: Fixed - OWASP recommended security headers added.

**Implementation**: `apps/api/src/middleware/security-headers.ts`

### Medium Priority (Remaining)

#### 1. No Input Validation Framework

**Risk**: Vulnerable to brute force, credential stuffing, API abuse, DoS.

**Recommendation**: Implement rate limiting middleware:
- Login: 5 attempts per 15 minutes per IP
- API: 1000 requests per minute per API key
- Registration: 5 accounts per hour per IP

#### 3. No Nango Webhook Signature Validation

**Location**: `apps/api/src/routes/webhooks.ts`

**Risk**: Webhook spoofing could manipulate integration state.

**Recommendation**: Validate webhook signatures per Nango documentation.

### Medium Priority

#### 4. Default JWT Secret

**Risk**: If not set in production, tokens can be forged.

**Recommendation**:
```typescript
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
```

#### 5. No Input Validation Framework

**Risk**: Inconsistent validation across endpoints.

**Recommendation**: Enforce Zod schemas for all request bodies.

#### 6. No Security Headers

**Risk**: XSS, clickjacking, MIME sniffing attacks.

**Recommendation**: Add security headers middleware:
```typescript
app.use(secureHeaders({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] }},
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  strictTransportSecurity: true,
}));
```

#### 7. No Session Revocation

**Risk**: Compromised tokens valid until expiry.

**Recommendation**: Implement JWT blocklist or switch to short-lived tokens with refresh mechanism.

### Low Priority

#### 8. Wildcard CORS

**Context**: Required for browser extension support.

**Mitigation**: Already using `allowCredentials: false`.

**Improvement**: Consider more restrictive CORS for non-extension routes.

#### 9. 7-Day JWT Expiration

**Recommendation**: Reduce to 24 hours with refresh tokens.

#### 10. No Application-Level Encryption

**Current**: Relies on infrastructure encryption (Turso).

**Recommendation**: Encrypt sensitive fields at application level for defense in depth.

---

## 11. Recommendations

### Immediate Actions (P0)

| Action | Effort | Impact |
|--------|--------|--------|
| Add rate limiting middleware | Medium | High |
| Validate Nango webhook signatures | Low | High |
| Fail if JWT_SECRET not set in production | Low | High |
| Add Zod validation to auth endpoints | Medium | Medium |

### Short-Term (P1)

| Action | Effort | Impact |
|--------|--------|--------|
| Add security headers middleware | Low | Medium |
| Implement session revocation | Medium | Medium |
| Add request size limits | Low | Low |
| Encrypt API keys at rest | Medium | Medium |
| Add CSRF protection for web routes | Medium | Medium |

### Medium-Term (P2)

| Action | Effort | Impact |
|--------|--------|--------|
| Implement refresh token rotation | High | Medium |
| Add application-level encryption for sensitive fields | Medium | Medium |
| Set up security monitoring and alerting | High | High |
| Add automated security scanning in CI/CD | Medium | Medium |
| Add API request logging for anomaly detection | Medium | Medium |

### Long-Term (P3)

| Action | Effort | Impact |
|--------|--------|--------|
| Security audit by third party | High | High |
| Penetration testing | High | High |
| SOC 2 compliance preparation | Very High | High |
| Bug bounty program | Medium | Medium |

---

## Appendix A: Security Checklist

### Authentication
- [x] Password hashing (bcrypt, 10 rounds)
- [x] Constant-time comparison
- [x] Generic error messages
- [x] OAuth 2.0 for third-party auth
- [ ] Multi-factor authentication
- [ ] Account lockout after failed attempts
- [ ] Password complexity requirements

### Authorization
- [x] Role-based access control
- [x] Org-scoped data access
- [x] Integration permission model
- [ ] Fine-grained RBAC enforcement
- [ ] Audit logging for all admin actions

### Data Protection
- [x] TLS in transit
- [x] Password hashing
- [x] Minimal PII storage
- [ ] API keys encrypted at rest
- [ ] Field-level encryption

### API Security
- [x] API key authentication
- [x] JWT authentication
- [x] Request ID tracing
- [ ] Rate limiting
- [ ] Security headers
- [ ] Request size limits

### Input Validation
- [x] Parameterized SQL queries
- [x] UUID validation in some routes
- [ ] Schema validation on all endpoints
- [ ] Input sanitization

### Logging & Monitoring
- [x] Structured logging
- [x] Error code system
- [x] Usage tracking
- [ ] Security event alerting
- [ ] Anomaly detection

---

## Appendix B: Positive Security Practices

The codebase demonstrates several security-conscious decisions:

1. **Ephemeral Architecture**: Minimal PII storage reduces breach impact
2. **Drizzle ORM**: Parameterized queries prevent SQL injection
3. **Password Handling**: bcrypt with adequate rounds
4. **OAuth Delegation**: Tokens managed by Nango, not stored locally
5. **Audit Logging**: Permission changes tracked
6. **Error Code System**: Prevents PII leakage in error reports
7. **Org-Scoped Data**: Multi-tenant isolation
8. **Client-Side LLM**: Sensitive conversations don't pass through server
9. **Soft Deletes**: API key revocation preserves audit trail
10. **Structured Logging**: Consistent format for log analysis

---

## Appendix C: Related Documentation

- `docs/EPHEMERAL_ARCHITECTURE.md` - Privacy architecture details
- `docs/ARCHITECTURE.md` - System overview
- `docs/INTEGRATION_GUIDE.md` - OAuth integration patterns
- `docs/BEST_PRACTICES.md` - Development guidelines
