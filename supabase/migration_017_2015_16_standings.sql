-- Historical standings: 2015-16 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2015-16'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('frank-panico', 6, 7, 0, 1483.3, 1358.94, 1, true),
  ('adam-rudin', 11, 2, 0, 1559.76, 1279.4, 2, true),
  ('cuyler-peragallo', 7, 6, 0, 1266.1, 1276.62, 3, true),
  ('michael-pateiro', 7, 6, 0, 1399.32, 1352.86, 4, true),
  ('chris-moreschi', 7, 6, 0, 1355.54, 1304.96, 5, true),
  ('jeff-peragallo', 7, 6, 0, 1290.5, 1335.48, 6, true),
  ('rob-moreschi', 6, 7, 0, 1146.6, 1273.1, 7, false),
  ('chris-blanco', 6, 7, 0, 1395.2, 1390.3, 8, false),
  ('soren-pedersen', 6, 7, 0, 1423.14, 1373.08, 9, false),
  ('adam-gladstone', 4, 9, 0, 1395.94, 1530.22, 10, false),
  ('ian-oloughlin', 6, 7, 0, 1303.2, 1412.3, 11, false),
  ('kevin-blanco', 5, 8, 0, 1284.82, 1416.16, 12, false)
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
update seasons set last_place_id = (select id from owners where slug = 'kevin-blanco')
where year = '2015-16';
