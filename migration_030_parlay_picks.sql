-- Migration: adds weekly group parlay picks — each owner submits their
-- own leg for the week, self-service. Safe to run once.

create table if not exists parlay_picks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  week int not null,
  owner_id uuid references owners(id) on delete cascade,
  pick text not null,
  odds text,
  updated_at timestamptz default now(),
  unique(season_id, week, owner_id)
);

alter table parlay_picks enable row level security;
create policy "public read parlay_picks" on parlay_picks for select using (true);
create policy "public write parlay_picks" on parlay_picks for all using (true) with check (true);
