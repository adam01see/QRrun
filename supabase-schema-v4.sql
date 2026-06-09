-- RunningQuest v4 — Add activity_type to support hiking activities
-- Run in Supabase → SQL Editor

ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'Run';
