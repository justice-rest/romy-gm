-- Migration: Add additional_context field to onboarding_data
-- Description: Allows users to add extra context for the AI beyond the standard questions

ALTER TABLE onboarding_data
ADD COLUMN IF NOT EXISTS additional_context TEXT;

COMMENT ON COLUMN onboarding_data.additional_context IS 'Additional user-provided context to help personalize AI responses';
