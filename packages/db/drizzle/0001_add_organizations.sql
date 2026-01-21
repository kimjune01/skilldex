-- Migration: Add organization multi-tenancy support
-- This migration adds organizations table and organization_id to all relevant tables

-- 1. Create organizations table
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);
--> statement-breakpoint

-- 2. Create organization_invites table
CREATE TABLE `organization_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`token` text NOT NULL,
	`invited_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_invites_token_unique` ON `organization_invites` (`token`);
--> statement-breakpoint
CREATE INDEX `idx_organization_invites_email` ON `organization_invites` (`email`);
--> statement-breakpoint

-- 3. Add columns to users table
ALTER TABLE `users` ADD COLUMN `is_super_admin` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX `idx_users_organization` ON `users` (`organization_id`);
--> statement-breakpoint

-- 4. Add columns to skills table
ALTER TABLE `skills` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE `skills` ADD COLUMN `is_global` integer DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_skills_organization` ON `skills` (`organization_id`);
--> statement-breakpoint

-- 5. Add organization_id to api_keys
ALTER TABLE `api_keys` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX `idx_api_keys_organization` ON `api_keys` (`organization_id`);
--> statement-breakpoint

-- 6. Add organization_id to integrations
ALTER TABLE `integrations` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX `idx_integrations_organization` ON `integrations` (`organization_id`);
--> statement-breakpoint

-- 7. Add organization_id to skill_usage_logs
ALTER TABLE `skill_usage_logs` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE NO ACTION;
--> statement-breakpoint
CREATE INDEX `idx_skill_usage_logs_organization` ON `skill_usage_logs` (`organization_id`);
--> statement-breakpoint

-- 8. Add organization_id to scrape_tasks
ALTER TABLE `scrape_tasks` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX `idx_scrape_tasks_organization` ON `scrape_tasks` (`organization_id`);
--> statement-breakpoint

-- 9. Add organization_id to skill_proposals
ALTER TABLE `skill_proposals` ADD COLUMN `organization_id` text REFERENCES `organizations`(`id`) ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX `idx_skill_proposals_organization` ON `skill_proposals` (`organization_id`);
