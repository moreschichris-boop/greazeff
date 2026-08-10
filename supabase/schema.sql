-- Greaze Fantasy Football League — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- Owners / teams
create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  team_name text,
  photo_url text,
  bio text,
  questionnaire jsonb default '[]'::jsonb, -- [{ "question": "...", "answer": "..." }]
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- One row per season (league year, e.g. "2011-12")
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  year text unique not null, -- '2011-12'
  champion_id uuid references owners(id),
  runner_up_id uuid references owners(id),
  reg_season_winner_id uuid references owners(id),
  last_place_id uuid references owners(id),
  notes text,
  created_at timestamptz default now()
);

-- Per-owner results within a season (final standings row)
create table if not exists season_results (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  owner_id uuid references owners(id) on delete cascade,
  wins int default 0,
  losses int default 0,
  ties int default 0,
  points_for numeric(7,2),
  points_against numeric(7,2),
  final_rank int,
  made_playoffs boolean default false,
  unique(season_id, owner_id)
);

-- Manually-curated all-time record book entries (best record, biggest blowout, etc.)
-- These are hand-entered via the admin panel since raw weekly scores aren't tracked.
create table if not exists all_time_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,          -- 'Biggest Blowout'
  holder_id uuid references owners(id),
  value text,                   -- '87.4 - 41.2'
  season_year text,             -- '2019-20'
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Photo gallery, grouped by season year
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  season_year text not null,
  url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Single-row settings table (admin PIN hash, league info)
create table if not exists app_settings (
  key text primary key,
  value text
);

-- Row Level Security: public can read everything, writes happen via the anon
-- key from the client after a correct PIN is entered in the admin panel
-- (same pattern as prior league sites — not real auth, just a soft gate).
alter table owners enable row level security;
alter table seasons enable row level security;
alter table season_results enable row level security;
alter table all_time_records enable row level security;
alter table photos enable row level security;
alter table app_settings enable row level security;

create policy "public read owners" on owners for select using (true);
create policy "public write owners" on owners for all using (true) with check (true);

create policy "public read seasons" on seasons for select using (true);
create policy "public write seasons" on seasons for all using (true) with check (true);

create policy "public read season_results" on season_results for select using (true);
create policy "public write season_results" on season_results for all using (true) with check (true);

create policy "public read all_time_records" on all_time_records for select using (true);
create policy "public write all_time_records" on all_time_records for all using (true) with check (true);

create policy "public read photos" on photos for select using (true);
create policy "public write photos" on photos for all using (true) with check (true);

create policy "public read app_settings" on app_settings for select using (true);
create policy "public write app_settings" on app_settings for all using (true) with check (true);

-- Season-ending rosters, with keeper eligibility/cost tracked per player.
-- Keeper cost (which round it'll take to keep them next year) has enough
-- exceptions in the league rules (FA one-year-only, multi-keeper tiebreaks,
-- rounds 1-2 ineligible, etc.) that it's tracked as a plain editable field
-- rather than auto-calculated — the commissioner sets it by hand each year.
create table if not exists roster_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  owner_id uuid references owners(id) on delete cascade,
  player_name text not null,
  position text,
  nfl_team text,
  keeper_eligible boolean default true,
  keeper_round int, -- round it would cost to keep next season; null = not applicable
  keeper_selected boolean default false, -- which of the eligible players the owner actually chose to keep (max 2, enforced in the UI)
  is_free_agent boolean default false,
  notes text,
  sort_order int default 0
);

alter table roster_entries enable row level security;
create policy "public read roster_entries" on roster_entries for select using (true);
create policy "public write roster_entries" on roster_entries for all using (true) with check (true);

-- Live draft: one draft per season, with a snake pick order and a pool of
-- draftable players for autocomplete (owners can also type a free-text name
-- for anyone not in the pool).
create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  rounds int not null default 17,
  draft_order jsonb not null default '[]'::jsonb, -- array of owner ids, round-1 order
  status text not null default 'setup', -- 'setup' | 'in_progress' | 'complete'
  current_pick int not null default 1, -- overall pick number, 1-indexed
  created_at timestamptz default now()
);

create table if not exists draft_players (
  id uuid primary key default gen_random_uuid(),
  season_year text not null,
  name text not null,
  position text,
  nfl_team text,
  drafted boolean default false
);

create table if not exists draft_picks (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references drafts(id) on delete cascade,
  pick_number int not null,
  round int not null,
  pick_in_round int not null,
  owner_id uuid references owners(id),
  player_name text not null,
  position text,
  nfl_team text,
  is_keeper boolean default false,
  created_at timestamptz default now(),
  unique(draft_id, pick_number)
);

alter table drafts enable row level security;
alter table draft_players enable row level security;
alter table draft_picks enable row level security;

create policy "public read drafts" on drafts for select using (true);
create policy "public write drafts" on drafts for all using (true) with check (true);

create policy "public read draft_players" on draft_players for select using (true);
create policy "public write draft_players" on draft_players for all using (true) with check (true);

create policy "public read draft_picks" on draft_picks for select using (true);
create policy "public write draft_picks" on draft_picks for all using (true) with check (true);

-- Enable realtime so the public /draft board updates instantly on every
-- device as picks are made from the admin panel.
alter publication supabase_realtime add table drafts;
alter publication supabase_realtime add table draft_picks;

-- Storage bucket for uploaded photos (gallery + owner headshots), so the
-- admin panel can upload image files directly instead of only pasting URLs.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Public read photos bucket" on storage.objects
  for select using (bucket_id = 'photos');
create policy "Public upload photos bucket" on storage.objects
  for insert with check (bucket_id = 'photos');
create policy "Public update photos bucket" on storage.objects
  for update using (bucket_id = 'photos');
create policy "Public delete photos bucket" on storage.objects
  for delete using (bucket_id = 'photos');

-- Season finances: dues, FAAB fees, weekly high/low bonuses & penalties,
-- who's paid, plus end-of-season payouts and misc costs (e.g. parlays).
create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  owner_id uuid references owners(id) on delete cascade,
  entry_fee numeric(7,2) default 0,
  faab_spend numeric(7,2) default 0,
  loser_weeks int default 0,
  loser_penalty numeric(7,2) default 0,
  winner_weeks int default 0,
  winner_bonus numeric(7,2) default 0,
  amount_paid numeric(7,2) default 0,
  notes text,
  unique(season_id, owner_id)
);

create table if not exists season_payouts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  title text not null, -- '1st Place', '2nd Place', 'Regular Season', 'Last Place', 'Weekly High Total'
  amount numeric(8,2) default 0,
  owner_id uuid references owners(id),
  sort_order int default 0
);

create table if not exists season_costs (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  description text not null, -- 'Parlays'
  amount numeric(8,2) default 0,
  paid_by_owner_id uuid references owners(id),
  sort_order int default 0
);

alter table finance_entries enable row level security;
alter table season_payouts enable row level security;
alter table season_costs enable row level security;

create policy "public read finance_entries" on finance_entries for select using (true);
create policy "public write finance_entries" on finance_entries for all using (true) with check (true);

create policy "public read season_payouts" on season_payouts for select using (true);
create policy "public write season_payouts" on season_payouts for all using (true) with check (true);

create policy "public read season_costs" on season_costs for select using (true);
create policy "public write season_costs" on season_costs for all using (true) with check (true);

-- Default PIN is "3113" hashed with SHA-256. Change it from the admin panel
-- once the site is live (Settings tab), or replace the hash below before
-- running this file. To generate a new hash: run
--   echo -n "yourpin" | shasum -a 256
-- in any terminal and paste the resulting hex string as the value.
insert into app_settings (key, value)
values ('admin_pin_hash', '1a67316dfbb24cbd5a17450aa53cd9ae42cdc7b1f58d06ec71bdcf2c9ad1fb28')
on conflict (key) do nothing;
