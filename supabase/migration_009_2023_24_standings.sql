-- Historical standings: 2023-24 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2023-24'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('soren-pedersen', 12, 2, 0, 1917.16, 1569.68, 1, true),
  ('adam-gladstone', 7, 7, 0, 1556.48, 1670.62, 2, true),
  ('chris-blanco', 10, 4, 0, 1656.52, 1418.58, 3, true),
  ('kevin-blanco', 8, 6, 0, 1607.0, 1542.94, 4, true),
  ('ian-oloughlin', 9, 5, 0, 1702.22, 1506.3, 5, true),
  ('chris-moreschi', 8, 6, 0, 1759.64, 1514.34, 6, true),
  ('michael-pateiro', 6, 8, 0, 1453.64, 1659.3, 7, false),
  ('cuyler-peragallo', 4, 10, 0, 1390.5, 1562.82, 8, false),
  ('adam-rudin', 5, 9, 0, 1490.72, 1532.78, 9, false),
  ('rob-moreschi', 5, 9, 0, 1469.92, 1649.96, 10, false),
  ('frank-panico', 5, 9, 0, 1425.08, 1696.0, 11, false),
  ('jeff-peragallo', 5, 9, 0, 1490.7, 1596.26, 12, false)
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
update seasons set last_place_id = (select id from owners where slug = 'jeff-peragallo')
where year = '2023-24';
