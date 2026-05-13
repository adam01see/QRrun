-- RunningQuest v3 — Activity geo + elevation fields
-- Run in Supabase → SQL Editor

ALTER TABLE activities ADD COLUMN IF NOT EXISTS elev_high float;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS start_lat float;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS start_lng float;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS country_code text;
