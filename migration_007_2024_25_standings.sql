-- Historical standings: 2024-25 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2024-25'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('chris-moreschi', 11, 3, 0, 1755.18, 1427.0, 1, true),
  ('adam-rudin', 10, 4, 0, 1808.46, 1676.34, 2, true),
  ('ian-oloughlin', 8, 6, 0, 1639.4, 1669.46, 3, true),
  ('soren-pedersen', 9, 5, 0, 1827.38, 1606.1, 4, true),
  ('adam-gladstone', 8, 6, 0, 1496.72, 1497.86, 5, true),
  ('kevin-blanco', 9, 5, 0, 1623.76, 1481.02, 6, true),
  ('chris-blanco', 5, 9, 0, 1636.18, 1797.38, 7, false),
  ('rob-moreschi', 4, 10, 0, 1468.76, 1679.58, 8, false),
  ('michael-pateiro', 3, 11, 0, 1356.02, 1545.7, 9, false),
  ('jeff-peragallo', 7, 7, 0, 1457.18, 1562.82, 10, false),
  ('cuyler-peragallo', 5, 9, 0, 1563.76, 1534.52, 11, false),
  ('frank-panico', 5, 9, 0, 1440.62, 1595.64, 12, false)
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
