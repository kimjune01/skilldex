Rollback to a previous production deployment by tag number.

## Usage
- `/rollback` - Rollback to previous version (one before current production)
- `/rollback <tag>` - Rollback to specific tag (e.g., `/rollback 3`)

## Steps

1. Get current production hash and find what tag is running:
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
git fetch --tags
```
Compare the production hash against tags to find which tag is currently deployed.

2. Determine target tag:
- If no argument: use the tag before the currently running tag
- If argument provided: use that tag number

3. Show rollback info:
```bash
git log -1 --format='%h %s' <target_tag>
```

4. Checkout target tag:
```bash
git checkout <target_tag>
```

5. Run typecheck:
```bash
pnpm typecheck
```

6. Deploy (NO db:push - schema stays current):
```bash
GIT_HASH=<target_hash> pnpm sst deploy --stage production
```
Note: Skipping db:push:prod intentionally. Schema development should deprecate
columns before dropping them, ensuring old code can run against newer schemas.

7. Verify deployment (call both in parallel):
```bash
curl -s "https://api.skillomatic.technology/health"
```
```bash
curl -s "https://skillomatic.technology" | grep -o 'git-hash" content="[^"]*'
```
Retry web check with exponential backoff (2-64s) if CDN hasn't propagated yet.

8. Return to main:
```bash
git checkout main
```

9. Report success with rolled-back tag and git hash.

## Troubleshooting

If rollback fails mid-deploy, you're in detached HEAD state. Run `git checkout main` to return.
