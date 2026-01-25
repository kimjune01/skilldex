Check what version is currently running in production.

## Steps

1. Get current production git hash:
```bash
curl -s "https://api.skillomatic.technology/health" | grep -o '"gitHash":"[^"]*"' | cut -d'"' -f4
```

2. Find which tag contains that commit:
```bash
git fetch --tags
git tag --list '[0-9]*' --sort=-v:refname | while read tag; do
  TAG_HASH=$(git rev-parse --short "$tag")
  if [ "$TAG_HASH" = "$PROD_HASH" ]; then
    echo "Production is running tag $tag ($TAG_HASH)"
    git log -1 --format='  %s' "$tag"
    exit 0
  fi
done
```

If no tag matches, production is running an untagged commit (deployed but not tagged, or deployed from a branch).

3. Show recent tags for context:
```bash
echo ""
echo "Recent tags:"
git tag --list '[0-9]*' --sort=-v:refname | head -5 | while read tag; do
  echo "  $tag: $(git log -1 --format='%h %s' $tag)"
done
```
