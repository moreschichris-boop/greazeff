-- Historical standings: 2013-14 season, entered from the league's
-- final standings screenshot. 10-team season (Ian O'Loughlin and Adam
-- Gladstone hadn't joined yet). Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2013-14'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('jeff-peragallo', 6, 7, 0, 1593.0, 1461.96, 1, true),
  ('kevin-blanco', 9, 4, 0, 1364.72, 1268.1, 2, true),
  ('soren-pedersen', 8, 5, 0, 1370.52, 1438.98, 3, true),
  ('frank-panico', 11, 2, 0, 1532.66, 1297.44, 4, true),
  ('rob-moreschi', 6, 7, 0, 1401.56, 1403.56, 5, true),
  ('adam-rudin', 7, 6, 0, 1475.12, 1419.34, 6, true),
  ('chris-blanco', 5, 8, 0, 1442.24, 1428.96, 7, false),
  ('michael-pateiro', 3, 10, 0, 1247.28, 1525.82, 8, false),
  ('chris-moreschi', 4, 9, 0, 1396.7, 1510.88, 9, false),
  ('cuyler-peragallo', 6, 7, 0, 1310.76, 1379.52, 10, false)
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
update seasons set last_place_id = (select id from owners where slug = 'cuyler-peragallo')
where year = '2013-14';
