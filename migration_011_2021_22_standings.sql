-- Historical standings: 2021-22 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2021-22'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('soren-pedersen', 9, 5, 0, 1723.72, 1594.18, 1, true),
  ('frank-panico', 12, 2, 0, 1948.98, 1491.54, 2, true),
  ('ian-oloughlin', 9, 5, 0, 1637.7, 1625.84, 3, true),
  ('chris-moreschi', 8, 6, 0, 1653.82, 1606.72, 4, true),
  ('chris-blanco', 9, 5, 0, 1598.62, 1574.02, 5, true),
  ('jeff-peragallo', 8, 6, 0, 1608.62, 1530.12, 6, true),
  ('adam-gladstone', 5, 9, 0, 1561.3, 1672.4, 7, false),
  ('adam-rudin', 7, 7, 0, 1690.36, 1664.34, 8, false),
  ('rob-moreschi', 4, 10, 0, 1435.4, 1700.78, 9, false),
  ('cuyler-peragallo', 5, 9, 0, 1584.86, 1660.88, 10, false),
  ('kevin-blanco', 3, 11, 0, 1490.78, 1646.3, 11, false),
  ('michael-pateiro', 5, 9, 0, 1545.06, 1712.1, 12, false)
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
where year = '2021-22';
