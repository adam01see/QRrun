-- RunningQuest v5 — Campaign system + HP revert
-- Run in Supabase → SQL Editor

ALTER TABLE world_state ADD COLUMN IF NOT EXISTS campaign_step integer DEFAULT 0;
