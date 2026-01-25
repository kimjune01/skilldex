Rollback to a previous production deployment by tag number.

## Usage
- `/rollback` - Rollback to previous version (second-latest tag)
- `/rollback <tag>` - Rollback to specific tag (e.g., `/rollback 3`)

## Steps

1. Determine target tag:
```bash
# If no argument provided, get second-latest tag
TAGS=$(git tag --list '[0-9]*' --sort=-v:refname)
CURRENT_TAG=$(echo "$TAGS" | head -1)
TARGET_TAG=$(echo "$TAGS" | head -2 | tail -1)
# If argument provided, use that as TARGET_TAG
```

2. Show rollback info and fetch:
```bash
git fetch --tags
echo "Rolling back from tag $CURRENT_TAG to tag $TARGET_TAG"
git log -1 --format='Target: %h %s' $TARGET_TAG
```

3. Checkout target tag:
```bash
git checkout $TARGET_TAG
```

4. Run typecheck:
```bash
pnpm typecheck
```

5. Deploy (NO db:push - schema stays current):
```bash
GIT_HASH=$(git rev-parse --short HEAD) pnpm sst deploy --stage production
```

Note: Skipping db:push:prod intentionally. Schema development should deprecate
columns before dropping them, ensuring old code can run against newer schemas.

6. Verify deployment (call both curl commands in parallel):
```bash
curl -s "https://api.skillomatic.technology/health"
```
```bash
curl -s "https://skillomatic.technology" | grep -o 'git-hash" content="[^"]*'
```
Retry web check with exponential backoff (2-64s) if CDN hasn't propagated yet.

7. Return to main:
```bash
git checkout main
```

8. Report success with rolled-back tag and git hash.

## Troubleshooting

If rollback fails mid-deploy, you're in detached HEAD state. Run `git checkout main` to return.
