-- Migration: Add theme column to user_preferences table
-- This allows authenticated users to have their theme preference (light/dark/system) persist across devices

-- Add theme column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));

-- Update existing rows to have the default theme
UPDATE user_preferences
SET theme = 'system'
WHERE theme IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN user_preferences.theme IS 'User theme preference: light, dark, or system';
