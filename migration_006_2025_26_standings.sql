-- Historical standings: 2025-26 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2025-26'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('adam-rudin', 10, 4, 0, 1800.3, 1599.3, 1, true),
  ('frank-panico', 9, 5, 0, 1636.78, 1543.18, 2, true),
  ('chris-moreschi', 10, 4, 0, 1706.78, 1518.34, 3, true),
  ('michael-pateiro', 8, 6, 0, 1671.28, 1547.14, 4, true),
  ('chris-blanco', 8, 6, 0, 1607.36, 1457.42, 5, true),
  ('jeff-peragallo', 9, 5, 0, 1544.14, 1508.4, 6, true),
  ('soren-pedersen', 6, 8, 0, 1651.06, 1577.44, 7, false),
  ('ian-oloughlin', 5, 9, 0, 1407.28, 1614.14, 8, false),
  ('rob-moreschi', 3, 11, 0, 1301.88, 1624.64, 9, false),
  ('kevin-blanco', 7, 7, 0, 1497.76, 1550.56, 10, false),
  ('adam-gladstone', 3, 11, 0, 1427.58, 1688.58, 11, false),
  ('cuyler-peragallo', 6, 8, 0, 1554.44, 1577.5, 12, false)
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
