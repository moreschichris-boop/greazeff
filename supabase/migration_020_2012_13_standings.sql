-- Historical standings: 2012-13 season, entered from the league's
-- final standings screenshot. 10-team season. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2012-13'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('soren-pedersen', 7, 6, 0, 1552.52, 1369.12, 1, true),
  ('chris-blanco', 8, 5, 0, 1461.7, 1504.98, 2, true),
  ('rob-moreschi', 9, 4, 0, 1469.32, 1292.16, 3, true),
  ('chris-moreschi', 9, 4, 0, 1475.34, 1372.5, 4, true),
  ('adam-rudin', 7, 6, 0, 1448.08, 1379.86, 5, true),
  ('cuyler-peragallo', 7, 6, 0, 1414.9, 1433.1, 6, true),
  ('frank-panico', 3, 10, 0, 1157.72, 1352.2, 7, false),
  ('jeff-peragallo', 5, 8, 0, 1351.62, 1518.72, 8, false),
  ('kevin-blanco', 5, 8, 0, 1417.16, 1348.9, 9, false),
  ('michael-pateiro', 5, 8, 0, 1273.04, 1449.86, 10, false)
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
where year = '2012-13';
