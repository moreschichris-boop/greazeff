-- Migration: adds season finance tracking (dues, FAAB fees, weekly
-- high/low bonuses & penalties, who's paid, end-of-season payouts, and
-- misc costs like parlays). Safe to run once on your existing project.

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
  title text not null,
  amount numeric(8,2) default 0,
  owner_id uuid references owners(id),
  sort_order int default 0
);

create table if not exists season_costs (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  description text not null,
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
