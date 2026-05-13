-- RunningQuest Database Schema
-- Run this in Supabase → SQL Editor

create table profiles (
  id uuid default gen_random_uuid() primary key,
  strava_id bigint unique not null,
  username text,
  firstname text,
  lastname text,
  profile_photo text,
  strava_access_token text,
  strava_refresh_token text,
  token_expires_at bigint,
  total_xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_run_date date,
  created_at timestamptz default now()
);

create table activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  strava_id bigint unique not null,
  name text,
  distance float,
  moving_time integer,
  elapsed_time integer,
  start_date timestamptz,
  average_speed float,
  average_heartrate float,
  max_heartrate float,
  total_elevation_gain float,
  workout_type integer default 0,
  xp_earned integer default 0,
  is_pr boolean default false,
  created_at timestamptz default now()
);

create table user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  achievement_slug text not null,
  earned_at timestamptz default now(),
  unique(user_id, achievement_slug)
);

create table quests (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  xp_reward integer default 0,
  quest_type text,
  requirement_type text,
  requirement_value float
);

create table user_quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  quest_slug text not null,
  status text default 'active',
  progress float default 0,
  completed_at timestamptz,
  unique(user_id, quest_slug)
);

-- Indexes for common queries
create index activities_user_date on activities(user_id, start_date desc);
create index user_achievements_user on user_achievements(user_id);
create index user_quests_user on user_quests(user_id);

-- Disable RLS for MVP (all access via service role key)
alter table profiles disable row level security;
alter table activities disable row level security;
alter table user_achievements disable row level security;
alter table quests disable row level security;
alter table user_quests disable row level security;
