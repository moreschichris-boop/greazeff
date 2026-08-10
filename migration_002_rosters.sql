-- Migration: adds season-ending rosters + keeper eligibility.
-- Safe to run on your existing Supabase project — it only adds a new table,
-- it doesn't touch anything you already have. Paste into a new SQL Editor
-- query and Run, same as you did with schema.sql and seed.sql.

create table if not exists roster_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  owner_id uuid references owners(id) on delete cascade,
  player_name text not null,
  position text,
  nfl_team text,
  keeper_eligible boolean default true,
  keeper_round int,
  is_free_agent boolean default false,
  notes text,
  sort_order int default 0
);

alter table roster_entries enable row level security;

create policy "public read roster_entries" on roster_entries for select using (true);
create policy "public write roster_entries" on roster_entries for all using (true) with check (true);
