-- Migration: Add onboarding data fields
-- Description: Adds onboarding completion tracking and stores user onboarding responses

-- Add onboarding tracking fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create onboarding_data table to store user responses
CREATE TABLE IF NOT EXISTS onboarding_data (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Question 3: What's your first name?
  first_name TEXT,

  -- Question 4: What nonprofit do you work for/with?
  nonprofit_name TEXT,

  -- Question 5: Where is it based?
  nonprofit_location TEXT,

  -- Question 6: What sector is it in?
  nonprofit_sector TEXT,

  -- Question 7: Approximately what is the size of your annual budget?
  annual_budget TEXT,

  -- Question 8: Approximately how many individual donors are in your database?
  donor_count TEXT,

  -- Question 9: Is fundraising your primary responsibility?
  fundraising_primary BOOLEAN,

  -- Question 10: Have you ever worked with donor wealth screening tools before?
  prior_tools TEXT[],

  -- Question 11: What's your purpose in trying Rōmy?
  purpose TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_data_user_id ON onboarding_data(user_id);

-- Enable Row Level Security
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_data
CREATE POLICY "Users can view their own onboarding data"
  ON onboarding_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data"
  ON onboarding_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data"
  ON onboarding_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_data_timestamp
  BEFORE UPDATE ON onboarding_data
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_data_updated_at();

-- Add comment for documentation
COMMENT ON TABLE onboarding_data IS 'Stores user responses from the onboarding flow to provide context for LLM interactions';
