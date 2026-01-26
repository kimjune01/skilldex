---
name: bump-extension-version
description: Bump the browser extension version number
intent: I want to bump the extension version
---

# Bump Extension Version

Increments the Skillomatic browser extension version in all required locations.

## Files to Update

1. **Manifest** (source of truth for Chrome): `apps/skillomatic-scraper/manifest.json`
2. **Shared constants** (for web app display): `packages/shared/src/constants.ts`

## Steps

1. Ask the user what type of version bump:
   - **patch** (1.0.1 → 1.0.2) - bug fixes
   - **minor** (1.0.1 → 1.1.0) - new features
   - **major** (1.0.1 → 2.0.0) - breaking changes

2. Read current version from `apps/skillomatic-scraper/manifest.json`

3. Calculate new version based on bump type

4. Update both files:
   ```bash
   # manifest.json - update "version" field
   # constants.ts - update EXTENSION_VERSION constant
   ```

5. Commit with message: `Bump extension version to X.Y.Z`

## Example

```
Current version: 1.0.1
Bump type: patch
New version: 1.0.2
```

Files updated:
- `apps/skillomatic-scraper/manifest.json`: `"version": "1.0.2"`
- `packages/shared/src/constants.ts`: `EXTENSION_VERSION = '1.0.2'`
