-- Historical standings: 2016-17 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2016-17'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('soren-pedersen', 8, 5, 0, 1584.78, 1288.8, 1, true),
  ('michael-pateiro', 8, 5, 0, 1423.98, 1378.6, 2, true),
  ('adam-rudin', 8, 5, 0, 1514.98, 1329.88, 3, true),
  ('adam-gladstone', 9, 4, 0, 1431.72, 1360.06, 4, true),
  ('frank-panico', 6, 7, 0, 1308.08, 1438.94, 5, true),
  ('ian-oloughlin', 8, 5, 0, 1323.68, 1229.3, 6, true),
  ('chris-moreschi', 5, 8, 0, 1373.56, 1462.1, 7, false),
  ('kevin-blanco', 5, 8, 0, 1308.82, 1299.58, 8, false),
  ('cuyler-peragallo', 6, 7, 0, 1276.36, 1440.36, 9, false),
  ('jeff-peragallo', 6, 7, 0, 1291.22, 1430.02, 10, false),
  ('rob-moreschi', 5, 8, 0, 1200.02, 1315.34, 11, false),
  ('chris-blanco', 4, 9, 0, 1310.88, 1375.1, 12, false)
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
update seasons set last_place_id = (select id from owners where slug = 'chris-blanco')
where year = '2016-17';
