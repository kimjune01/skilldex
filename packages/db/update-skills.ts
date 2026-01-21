import { db } from './src/client.js';
import { skills } from './src/schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, '../../skills');

function parseSkillFrontmatter(slug: string) {
  const skillPath = join(skillsDir, slug, 'SKILL.md');
  if (!existsSync(skillPath)) {
    return {};
  }

  const content = readFileSync(skillPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { instructions: content };
  }

  const frontmatter = frontmatterMatch[1];
  const instructions = content.slice(frontmatterMatch[0].length).trim();

  let intent: string | undefined;
  let capabilities: string[] = [];

  const intentMatch = frontmatter.match(/^intent:\s*(.+)$/m);
  if (intentMatch) {
    intent = intentMatch[1].trim();
  }

  const capabilitiesMatch = frontmatter.match(/^capabilities:\n((?:\s+-\s+.+\n?)+)/m);
  if (capabilitiesMatch) {
    capabilities = capabilitiesMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);
  }

  return { intent, capabilities, instructions };
}

async function main() {
  const allSkills = await db.select().from(skills);

  for (const skill of allSkills) {
    const fm = parseSkillFrontmatter(skill.slug);
    if (fm.intent || fm.capabilities?.length || fm.instructions) {
      await db.update(skills)
        .set({
          intent: fm.intent || null,
          capabilities: fm.capabilities?.length ? JSON.stringify(fm.capabilities) : null,
          instructions: fm.instructions || null,
        })
        .where(eq(skills.id, skill.id));
      console.log(`Updated ${skill.slug}: intent=${fm.intent ? 'yes' : 'no'}, capabilities=${fm.capabilities?.length || 0}`);
    } else {
      console.log(`No SKILL.md found for ${skill.slug}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
