-- Finance data for the 2025-26 season, entered from the league's
-- treasurer spreadsheet screenshots. Safe to run once.

do $$
declare
  v_season uuid := (select id from seasons where year = '2025-26');
begin

insert into finance_entries (season_id, owner_id, entry_fee, faab_spend, loser_weeks, loser_penalty, winner_weeks, winner_bonus, amount_paid)
select v_season, o.id, v.entry_fee, v.faab_spend, v.loser_weeks, v.loser_penalty, v.winner_weeks, v.winner_bonus, v.amount_paid
from (values
  ('chris-blanco', 165, 39, 0, 0, 1, 25, 165),
  ('kevin-blanco', 165, 0, 1, 5, 0, 0, 165),
  ('adam-gladstone', 165, 0, 2, 10, 0, 0, 165),
  ('chris-moreschi', 165, 25, 0, 0, 1, 25, 165),
  ('rob-moreschi', 165, 22, 3, 15, 0, 0, 165),
  ('ian-oloughlin', 165, 4, 2, 10, 0, 0, 165),
  ('frank-panico', 165, 0, 1, 5, 1, 25, 165),
  ('michael-pateiro', 165, 46, 2, 10, 4, 100, 165),
  ('soren-pedersen', 165, 45, 0, 0, 3, 75, 165),
  ('cuyler-peragallo', 165, 38, 1, 5, 1, 25, 165),
  ('jeff-peragallo', 165, 38, 2, 10, 0, 0, 165),
  ('adam-rudin', 165, 36, 0, 0, 3, 75, 165)
) as v(owner_slug, entry_fee, faab_spend, loser_weeks, loser_penalty, winner_weeks, winner_bonus, amount_paid)
join owners o on o.slug = v.owner_slug
on conflict (season_id, owner_id) do update set
  entry_fee = excluded.entry_fee,
  faab_spend = excluded.faab_spend,
  loser_weeks = excluded.loser_weeks,
  loser_penalty = excluded.loser_penalty,
  winner_weeks = excluded.winner_weeks,
  winner_bonus = excluded.winner_bonus,
  amount_paid = excluded.amount_paid;

insert into season_payouts (season_id, title, amount, owner_id, sort_order) values
  (v_season, '2nd Place', 191, (select id from owners where slug = 'frank-panico'), 0),
  (v_season, '1st Place', 1336, (select id from owners where slug = 'adam-rudin'), 1),
  (v_season, 'Regular Season Champion', 382, (select id from owners where slug = 'adam-rudin'), 2),
  (v_season, 'Last Place', 0, (select id from owners where slug = 'rob-moreschi'), 3),
  (v_season, 'Weekly High Total', 350, null, 4);

insert into season_costs (season_id, description, amount, paid_by_owner_id, sort_order) values
  (v_season, 'Parlays', 30, (select id from owners where slug = 'adam-rudin'), 0),
  (v_season, 'Parlays', 55, (select id from owners where slug = 'rob-moreschi'), 1);

end $$;
