-- RunningQuest v2 — Social / Friendship tables
-- Run this in Supabase → SQL Editor (after v1 schema)

create table run_pairings (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references profiles(id) on delete cascade,
  user2_id uuid references profiles(id) on delete cascade,
  paired_date date not null,
  status text default 'active', -- 'active', 'used', 'expired'
  created_at timestamptz default now(),
  unique(user1_id, user2_id, paired_date)
);

create table friendships (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references profiles(id) on delete cascade,
  user2_id uuid references profiles(id) on delete cascade,
  total_km float default 0,
  total_time_seconds integer default 0,
  run_count integer default 0,
  friendship_xp integer default 0,
  friendship_level integer default 1,
  created_at timestamptz default now(),
  -- always store with user1_id < user2_id to avoid duplicates
  unique(user1_id, user2_id)
);

create table shared_runs (
  id uuid default gen_random_uuid() primary key,
  friendship_id uuid references friendships(id) on delete cascade,
  user1_activity_id uuid references activities(id),
  user2_activity_id uuid references activities(id),
  run_date date not null,
  shared_km float,
  friendship_xp_earned integer default 0,
  created_at timestamptz default now()
);

create index run_pairings_users on run_pairings(user1_id, user2_id);
create index run_pairings_date on run_pairings(paired_date, status);
create index friendships_user1 on friendships(user1_id);
create index friendships_user2 on friendships(user2_id);

alter table run_pairings disable row level security;
alter table friendships disable row level security;
alter table shared_runs disable row level security;
