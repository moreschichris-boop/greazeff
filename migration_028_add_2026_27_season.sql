-- Adds the 2026-27 season so it shows up in the Finances (and Draft,
-- Rosters) dropdowns, ready for you to start tracking dues as treasurer.
-- Champion/runner-up/etc. stay blank until the season plays out.
-- Safe to run once.

insert into seasons (year)
values ('2026-27')
on conflict (year) do nothing;
