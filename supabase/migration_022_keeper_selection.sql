-- Migration: adds a "selected as keeper" flag to roster_entries, separate
-- from keeper_eligible (which just marks who COULD be kept). This tracks
-- which players an owner actually chose to keep, enforced to at most 2
-- in the admin UI. Safe to run once on your existing Supabase project.

alter table roster_entries add column if not exists keeper_selected boolean default false;
