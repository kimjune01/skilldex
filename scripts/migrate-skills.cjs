#!/usr/bin/env node

/**
 * Migrate skills to populate intent, capabilities, and instructions from SKILL.md files
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const dbPath = path.join(__dirname, '..', 'packages', 'db', 'data', 'skilldex.db');
const skillsDir = path.join(__dirname, '..', 'skills');

const db = new Database(dbPath);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, instructions: content };
  }
  try {
    const frontmatter = yaml.parse(match[1]);
    const instructions = match[2].trim();
    return { frontmatter, instructions };
  } catch (e) {
    return { frontmatter: null, instructions: content };
  }
}

const allSkills = db.prepare('SELECT id, slug FROM skills').all();

for (const skill of allSkills) {
  const skillMdPath = path.join(skillsDir, skill.slug, 'SKILL.md');

  if (!fs.existsSync(skillMdPath)) {
    console.log(`Skipping ${skill.slug}: SKILL.md not found`);
    continue;
  }

  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const { frontmatter, instructions } = parseFrontmatter(content);

  if (!frontmatter) {
    console.log(`Skipping ${skill.slug}: Could not parse frontmatter`);
    continue;
  }

  const stmt = db.prepare(`
    UPDATE skills
    SET intent = ?, capabilities = ?, instructions = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    frontmatter.intent || null,
    frontmatter.capabilities ? JSON.stringify(frontmatter.capabilities) : null,
    instructions,
    Date.now(),
    skill.id
  );

  console.log(`Updated ${skill.slug}`);
}

db.close();
console.log('Migration complete!');
