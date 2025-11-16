-- Migration: 000_migrations_table
-- Description: Create migrations tracking table
-- This table tracks which migrations have been applied

CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
