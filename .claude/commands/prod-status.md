Check what version is currently running in production.

<!-- RELATED: See /deploy and /rollback for deployment commands -->

## Steps

1. Get current production hashes from all services (call in parallel):
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://mcp.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://skillomatic.technology" | grep 'git-hash' | sed 's/.*content="\([^"]*\)".*/\1/'
```

2. Fetch tags and find matching tag:
```bash
git fetch --tags
```

3. For each recent tag, check if it matches the production hash:
```bash
git tag --list '[0-9]*' --sort=-v:refname | head -5
```
Then for each tag, get its hash:
```bash
git rev-parse --short <tag>
```

4. Report:
- Current production hashes (API, MCP, Web)
- Whether all services are in sync (same hash)
- Which tag is running (if any matches)
- If no tag matches, note that production is running an untagged commit
- List recent tags with their commit messages

## Health Endpoints

| Service | Endpoint |
|---------|----------|
| API | `https://api.skillomatic.technology/health` |
| MCP | `https://mcp.skillomatic.technology/health` |
| Web | `https://skillomatic.technology` (check `git-hash` meta tag) |

## Next Steps

- To deploy new changes: `/deploy`
- To rollback to a previous version: `/rollback`
- To investigate errors: `/prod-debugger`
