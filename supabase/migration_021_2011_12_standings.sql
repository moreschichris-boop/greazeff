-- Historical standings: 2011-12 season (the league's inaugural year),
-- entered from the final standings screenshot. 10-team season.
-- Safe to run once. This is the final season in the historical backfill.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2011-12'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('cuyler-peragallo', 6, 7, 0, 1351.32, 1439.38, 1, true),
  ('frank-panico', 13, 0, 0, 1633.46, 1344.84, 2, true),
  ('adam-rudin', 10, 3, 0, 1589.82, 1315.82, 3, true),
  ('rob-moreschi', 7, 6, 0, 1347.64, 1355.68, 4, true),
  ('chris-blanco', 6, 7, 0, 1442.88, 1377.0, 5, true),
  ('kevin-blanco', 7, 6, 0, 1396.22, 1361.9, 6, true),
  ('soren-pedersen', 5, 8, 0, 1403.58, 1450.12, 7, false),
  ('chris-moreschi', 4, 9, 0, 1270.76, 1476.66, 8, false),
  ('jeff-peragallo', 4, 9, 0, 1337.12, 1326.74, 9, false),
  ('michael-pateiro', 3, 10, 0, 1049.74, 1374.4, 10, false)
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

-- Toilet Bowl by last-standings-position rule (10th of 10 that year)
update seasons set last_place_id = (select id from owners where slug = 'michael-pateiro')
where year = '2011-12';
