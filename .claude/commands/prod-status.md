Check what version is currently running in production.

## Steps

1. Get current production git hash:
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```

2. Fetch tags and find matching tag:
```bash
git fetch --tags
```

3. For each recent tag, check if it matches the production hash. Report which tag is running:
```bash
git log -1 --format='%h %s' <tag>
```

4. Show recent tags for context:
```bash
git tag --list '[0-9]*' --sort=-v:refname | head -5
```
Then for each tag show its commit info.

5. Report:
- Which tag is running in production (if any)
- If no tag matches, note that production is running an untagged commit
- List recent tags with their commit messages
