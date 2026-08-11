-- Historical standings: 2017-18 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2017-18'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('kevin-blanco', 10, 3, 0, 1348.88, 1201.74, 1, true),
  ('rob-moreschi', 10, 3, 0, 1527.18, 1196.18, 2, true),
  ('soren-pedersen', 10, 3, 0, 1480.3, 1205.66, 3, true),
  ('chris-blanco', 8, 5, 0, 1274.68, 1179.08, 4, true),
  ('chris-moreschi', 7, 6, 0, 1226.16, 1345.08, 5, true),
  ('frank-panico', 7, 6, 0, 1169.72, 1163.48, 6, true),
  ('ian-oloughlin', 6, 7, 0, 1311.82, 1226.58, 7, false),
  ('jeff-peragallo', 4, 9, 0, 1270.26, 1471.5, 8, false),
  ('adam-rudin', 6, 7, 0, 1298.04, 1305.26, 9, false),
  ('cuyler-peragallo', 4, 9, 0, 1233.98, 1309.02, 10, false),
  ('adam-gladstone', 4, 9, 0, 1188.76, 1343.44, 11, false),
  ('michael-pateiro', 2, 11, 0, 1002.84, 1385.6, 12, false)
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
update seasons set last_place_id = (select id from owners where slug = 'michael-pateiro')
where year = '2017-18';
