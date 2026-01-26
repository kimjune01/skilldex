# Decrypt API Key Skill

Decrypt encrypted API keys from the database for testing live connections.

## When to Use

Activate this skill when:
- User needs to test an API key stored in the database
- User wants to verify an encrypted API key can be decrypted
- User needs the plaintext API key for curl testing or debugging

## How API Key Encryption Works

API keys are encrypted using AES-256-GCM:
- Encryption module: `apps/api/src/lib/encryption.ts`
- Key derivation: scrypt from `API_KEY_ENCRYPTION_KEY` or `JWT_SECRET`
- Format: base64(iv + authTag + ciphertext)

## Quick One-Liner

```bash
# Create decrypt script, get encrypted key, decrypt it
cat > /tmp/decrypt-key.mjs << 'SCRIPT'
import { createDecipheriv, scryptSync } from 'crypto';
const key = scryptSync(process.env.JWT_SECRET, 'skillomatic-api-key-encryption-v1', 32);
const buf = Buffer.from(process.argv[2], 'base64');
const d = createDecipheriv('aes-256-gcm', key, buf.subarray(0,16));
d.setAuthTag(buf.subarray(16,32));
console.log(Buffer.concat([d.update(buf.subarray(32)), d.final()]).toString());
SCRIPT

ENCRYPTED=$(sqlite3 packages/db/data/skillomatic.db "SELECT key FROM api_keys WHERE revoked_at IS NULL LIMIT 1;") && \
JWT_SECRET=$(grep ^JWT_SECRET= .env | cut -d= -f2) node /tmp/decrypt-key.mjs "$ENCRYPTED"
```

## Step-by-Step Process

### 1. Get the encrypted key from database

```bash
# First active key
sqlite3 packages/db/data/skillomatic.db "SELECT key FROM api_keys WHERE revoked_at IS NULL LIMIT 1;"

# For specific user
sqlite3 packages/db/data/skillomatic.db "SELECT ak.key FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE u.email = 'demo@skillomatic.technology' AND ak.revoked_at IS NULL;"

# List all keys with user info
sqlite3 packages/db/data/skillomatic.db "SELECT u.email, ak.name, ak.key FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.revoked_at IS NULL;"
```

### 2. Decrypt the key

```bash
JWT_SECRET=$(grep ^JWT_SECRET= .env | cut -d= -f2) node /tmp/decrypt-key.mjs "ENCRYPTED_KEY_HERE"
```

### 3. Test the decrypted key

```bash
curl -s -H "Authorization: Bearer sk_live_xxx..." http://localhost:3000/v1/me | jq
```

## Environment Requirements

The decryption requires `JWT_SECRET` from `.env` (or `API_KEY_ENCRYPTION_KEY` if set).

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "bad decrypt" | Wrong encryption key | Check JWT_SECRET matches what was used to encrypt |
| Key starts with `sk_live_` | Already plaintext | Legacy key, no decryption needed |
| Empty output | Key not found in DB | Check `api_keys` table has records |

## Security Notes

- Never commit decrypted keys
- Delete `/tmp/decrypt-key.mjs` after use
- Don't log plaintext keys in production
