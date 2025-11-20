-- Migration: Remove guest user functionality
-- This migration removes all anonymous/guest users and their associated data,
-- then drops the anonymous column from the users table.

-- Step 1: Delete all anonymous users (CASCADE will delete related chats, messages, attachments)
DELETE FROM users WHERE anonymous = true;

-- Step 2: Drop the anonymous column from users table
ALTER TABLE users DROP COLUMN IF EXISTS anonymous;

-- Step 3: Add comment to document the change
COMMENT ON TABLE users IS 'User accounts - all users must be authenticated via OAuth (no anonymous/guest users)';
