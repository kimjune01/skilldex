/**
 * Migration: Add allowed_domains to organizations table
 *
 * Enables domain-based auto-assignment of users to organizations.
 * When a user signs up with an email matching an org's allowed domain,
 * they're automatically added to that organization.
 *
 * JSON array format: ["acme.com", "acme.io"] or null (invite-only)
 */

import { db } from '../client.js';

export async function migrate() {
  console.log('Running migration: 003-org-allowed-domains');

  // Add allowed_domains column if it doesn't exist
  try {
    await db.run(`ALTER TABLE organizations ADD COLUMN allowed_domains TEXT`);
    console.log('Added allowed_domains column to organizations');
  } catch (e: unknown) {
    if (!(e instanceof Error) || !e.message.includes('duplicate column')) {
      throw e;
    }
    console.log('allowed_domains column already exists');
  }

  console.log('Migration completed: 003-org-allowed-domains');
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
