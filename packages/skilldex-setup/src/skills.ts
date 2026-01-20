import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPaths } from './platform.js';

interface Skill {
  slug: string;
  name: string;
  content: string;
}

interface SkillsApiResponse {
  skills: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    isEnabled: boolean;
  }>;
}

export async function fetchAvailableSkills(apiBaseUrl: string, apiKey: string): Promise<Skill[]> {
  try {
    // First get list of skills
    const listResponse = await fetch(`${apiBaseUrl}/api/skills`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!listResponse.ok) {
      return [];
    }

    const data = (await listResponse.json()) as SkillsApiResponse;
    const skills: Skill[] = [];

    // Download each skill's content
    for (const skill of data.skills) {
      if (!skill.isEnabled) continue;

      try {
        const downloadResponse = await fetch(`${apiBaseUrl}/api/skills/${skill.slug}/download`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (downloadResponse.ok) {
          const content = await downloadResponse.text();
          skills.push({
            slug: skill.slug,
            name: skill.name,
            content,
          });
        }
      } catch {
        // Skip failed downloads
      }
    }

    return skills;
  } catch {
    return [];
  }
}

export function installSkills(skills: Skill[]): { installed: string[]; failed: string[] } {
  const paths = getPaths();
  const installed: string[] = [];
  const failed: string[] = [];

  try {
    // Create skills directory
    if (!existsSync(paths.skillsDir)) {
      mkdirSync(paths.skillsDir, { recursive: true });
    }

    for (const skill of skills) {
      try {
        const filePath = join(paths.skillsDir, `${skill.slug}.md`);
        writeFileSync(filePath, skill.content);
        installed.push(skill.slug);
      } catch {
        failed.push(skill.slug);
      }
    }
  } catch {
    // If we can't create the directory, all skills fail
    return { installed: [], failed: skills.map((s) => s.slug) };
  }

  return { installed, failed };
}

export function getSkillsDirectory(): string {
  return getPaths().skillsDir;
}

// Bundled core skills for offline installation
export function getBundledSkills(): Skill[] {
  return [
    {
      slug: 'skilldex-health-check',
      name: 'Skilldex Health Check',
      content: `---
name: skilldex-health-check
description: Verify your Skilldex installation is working correctly
intent: I want to check if Skilldex is set up correctly
capabilities:
  - Check API key configuration
  - Verify MCP server connection
  - Test ATS connectivity
allowed-tools:
  - Bash
  - Read
---

# Skilldex Health Check

You are a setup assistant that verifies the Skilldex installation.

## Checks to Perform

Run these checks in order:

### 1. API Key Check

\`\`\`bash
if [ -n "$SKILLDEX_API_KEY" ]; then
  echo "API key is set (starts with: \${SKILLDEX_API_KEY:0:10}...)"
else
  echo "ERROR: SKILLDEX_API_KEY is not set"
fi
\`\`\`

### 2. API Connectivity Check

\`\`\`bash
curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \\
  "\${SKILLDEX_API_URL:-http://localhost:3000}/api/v1/me"
\`\`\`

Should return 200 if connected.

### 3. Linky MCP Check

Try to ping the Linky MCP server:

\`\`\`
mcp__linky__ping
\`\`\`

Should return "hello Pong!!!" if Linky is configured.

### 4. Native Host Check

\`\`\`bash
ls -la ~/.linky/native-host.py
ls -la ~/Desktop/temp/
\`\`\`

### 5. Skills Directory Check

\`\`\`bash
ls -la ~/.claude/commands/skilldex/
\`\`\`

## Output

Report the status of each check:

\`\`\`markdown
## Skilldex Health Check Results

| Component | Status | Notes |
|-----------|--------|-------|
| API Key | OK/FAIL | ... |
| API Connectivity | OK/FAIL | ... |
| Linky MCP | OK/FAIL/SKIP | ... |
| Native Host | OK/FAIL/SKIP | ... |
| Skills | OK/FAIL | ... |

### Next Steps

[List any issues found and how to fix them]
\`\`\`
`,
    },
  ];
}
