-- Migration: Add assistant_name to onboarding_data
-- Description: Adds optional assistant_name field for users to customize their AI assistant's name

ALTER TABLE onboarding_data
ADD COLUMN IF NOT EXISTS assistant_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN onboarding_data.assistant_name IS 'Optional custom name for the AI assistant (defaults to Rōmy if not provided)';
