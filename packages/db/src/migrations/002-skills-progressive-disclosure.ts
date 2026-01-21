/**
 * Migration: Add progressive disclosure fields to skills table
 *
 * Adds:
 * - intent: When to use this skill (Level 1 metadata)
 * - capabilities: What the skill can do (Level 1 metadata, JSON array)
 * - instructions: Full skill instructions (Level 2, loaded on demand)
 *
 * Removes:
 * - skillMdPath: No longer needed, instructions stored in DB
 * - requiredScopes: Not used
 */

import { db } from '../client.js';
import { skills } from '../schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, '..', '..', '..', '..', 'skills');

interface SkillFrontmatter {
  name: string;
  description: string;
  intent?: string;
  capabilities?: string[];
  'allowed-tools'?: string[];
}

function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter | null; instructions: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, instructions: content };
  }
  try {
    const frontmatter = parseYaml(match[1]) as SkillFrontmatter;
    const instructions = match[2].trim();
    return { frontmatter, instructions };
  } catch {
    return { frontmatter: null, instructions: content };
  }
}

export async function migrate() {
  console.log('Running migration: 002-skills-progressive-disclosure');

  // Add new columns if they don't exist
  // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
  try {
    await db.run(`ALTER TABLE skills ADD COLUMN intent TEXT`);
    console.log('Added intent column');
  } catch (e: unknown) {
    if (!(e instanceof Error) || !e.message.includes('duplicate column')) {
      throw e;
    }
    console.log('intent column already exists');
  }

  try {
    await db.run(`ALTER TABLE skills ADD COLUMN capabilities TEXT`);
    console.log('Added capabilities column');
  } catch (e: unknown) {
    if (!(e instanceof Error) || !e.message.includes('duplicate column')) {
      throw e;
    }
    console.log('capabilities column already exists');
  }

  try {
    await db.run(`ALTER TABLE skills ADD COLUMN instructions TEXT`);
    console.log('Added instructions column');
  } catch (e: unknown) {
    if (!(e instanceof Error) || !e.message.includes('duplicate column')) {
      throw e;
    }
    console.log('instructions column already exists');
  }

  // Migrate existing skills: read SKILL.md files and populate new fields
  const allSkills = await db.select().from(skills);

  for (const skill of allSkills) {
    const skillMdPath = join(skillsDir, skill.slug, 'SKILL.md');

    if (!existsSync(skillMdPath)) {
      console.log(`Skipping ${skill.slug}: SKILL.md not found at ${skillMdPath}`);
      continue;
    }

    const content = readFileSync(skillMdPath, 'utf-8');
    const { frontmatter, instructions } = parseFrontmatter(content);

    if (!frontmatter) {
      console.log(`Skipping ${skill.slug}: Could not parse frontmatter`);
      continue;
    }

    await db
      .update(skills)
      .set({
        intent: frontmatter.intent || null,
        capabilities: frontmatter.capabilities ? JSON.stringify(frontmatter.capabilities) : null,
        instructions: instructions,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id));

    console.log(`Updated ${skill.slug} with intent, capabilities, and instructions`);
  }

  console.log('Migration completed: 002-skills-progressive-disclosure');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
