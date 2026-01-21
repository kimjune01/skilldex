-- Migration: Add deployment mode toggles to organizations
-- Allows orgs to enable/disable Web UI and Desktop (MCP) deployment modes

-- Add deployment mode columns to organizations
ALTER TABLE `organizations` ADD COLUMN `web_ui_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `organizations` ADD COLUMN `desktop_enabled` integer DEFAULT true NOT NULL;
--> statement-breakpoint

-- Also add the LLM configuration columns if they don't exist
-- (These may have been added manually or are missing from previous migrations)
ALTER TABLE `organizations` ADD COLUMN `llm_provider` text DEFAULT 'anthropic';
--> statement-breakpoint
ALTER TABLE `organizations` ADD COLUMN `llm_api_key` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD COLUMN `llm_model` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD COLUMN `ats_provider` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD COLUMN `ats_base_url` text;
