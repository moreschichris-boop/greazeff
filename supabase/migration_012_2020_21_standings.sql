-- Historical standings: 2020-21 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2020-21'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('soren-pedersen', 9, 4, 0, 1750.0, 1448.78, 1, true),
  ('adam-rudin', 8, 5, 0, 1605.38, 1526.06, 2, true),
  ('rob-moreschi', 9, 4, 0, 1653.06, 1362.12, 3, true),
  ('chris-blanco', 8, 5, 0, 1519.78, 1409.02, 4, true),
  ('frank-panico', 8, 5, 0, 1539.28, 1478.0, 5, true),
  ('cuyler-peragallo', 7, 6, 0, 1429.04, 1447.1, 6, true),
  ('kevin-blanco', 6, 7, 0, 1453.5, 1429.46, 7, false),
  ('chris-moreschi', 4, 9, 0, 1390.2, 1748.2, 8, false),
  ('jeff-peragallo', 6, 7, 0, 1544.86, 1551.04, 9, false),
  ('michael-pateiro', 2, 11, 0, 1192.76, 1571.84, 10, false),
  ('ian-oloughlin', 6, 7, 0, 1435.92, 1337.56, 11, false),
  ('adam-gladstone', 5, 8, 0, 1503.26, 1707.86, 12, false)
) as v(owner_slug, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
join owners o on o.slug = v.owner_slug
on conflict (season_id, owner_id) do update set
  wins = excluded.wins,
  losses = excluded.losses,
  ties = excluded.ties,
  points_for = excluded.points_for,
  points_against = excluded.points_against,
  final_rank = excluded.final_rank,
  made_playoffs = excluded.made_playoffs;

-- Toilet Bowl by rank-12 rule
update seasons set last_place_id = (select id from owners where slug = 'adam-gladstone')
where year = '2020-21';
