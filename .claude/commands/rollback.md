Rollback to a previous production deployment by tag number.

<!-- RELATED: This command is paired with /deploy. Keep deployment logic in sync. -->
<!-- When updating: check /deploy for target mapping, health endpoints, verification steps -->

## Usage
- `/rollback` - Rollback to previous version (one before current production)
- `/rollback <tag>` - Rollback to specific tag (e.g., `/rollback 3`)

## Steps

1. Get current production hashes and find what tag is running:
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://mcp.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
git fetch --tags
```
Compare the production hash against tags to find which tag is currently deployed.

2. Determine target tag:
- If no argument: use the tag before the currently running tag
- If argument provided: use that tag number

3. Check if already running target:
- Compare the target tag's hash against the current production hash
- If they match, report "Production is already running tag X" and stop
- Do not proceed with deployment if already on target version

4. Show rollback info and confirm:
```bash
git log -1 --format='%h %s' <target_tag>
```
Ask user to confirm: "Rollback from tag X to tag Y? (y/n)"
- Proceed only if user confirms
- If declined, report "Rollback cancelled" and stop

5. Checkout target tag:
```bash
git checkout <target_tag>
```

6. Run typecheck:
```bash
pnpm typecheck
```

7. Deploy all services (NO db:push - schema stays current):
```bash
GIT_HASH=<target_hash> pnpm sst deploy --stage production
```

**Note:** Rollback deploys ALL services (no `--target` flag) because we're reverting to a known-good state. Skipping db:push:prod intentionally - schema development should deprecate columns before dropping them, ensuring old code can run against newer schemas.

8. Verify all services are responding and hashes match (call in parallel):
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://mcp.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://skillomatic.technology" | grep 'git-hash' | sed 's/.*content="\([^"]*\)".*/\1/'
```

All three hashes must match the target tag's commit hash.

Retry with exponential backoff (2-64s) if CDN hasn't propagated or MCP hasn't rolled over (ECS rolling deployment can take up to 2 minutes).

9. Return to main:
```bash
git checkout main
```

10. Report success with rolled-back tag and git hash.

## Troubleshooting

If rollback fails mid-deploy, you're in detached HEAD state. Run `git checkout main` to return.

## Health Endpoints

| Service | Endpoint |
|---------|----------|
| API | `https://api.skillomatic.technology/health` |
| MCP | `https://mcp.skillomatic.technology/health` |
| Web | `https://skillomatic.technology` (check `git-hash` meta tag) |
