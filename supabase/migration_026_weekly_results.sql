-- Migration: adds weekly high/low score results (winner/loser of the
-- weekly bonus & penalty pot each week). Safe to run once.

create table if not exists weekly_results (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  week int not null,
  winner_owner_id uuid references owners(id),
  loser_owner_id uuid references owners(id),
  unique(season_id, week)
);

alter table weekly_results enable row level security;
create policy "public read weekly_results" on weekly_results for select using (true);
create policy "public write weekly_results" on weekly_results for all using (true) with check (true);
