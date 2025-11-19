-- Migration: Add agent_name field to onboarding_data
-- Description: Adds a field to store the user's custom name for their AI agent

ALTER TABLE onboarding_data
ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN onboarding_data.agent_name IS 'Custom name given by the user for their AI agent (truffle hound)';
