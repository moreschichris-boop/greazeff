-- Historical standings: 2022-23 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2022-23'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('cuyler-peragallo', 9, 5, 0, 1590.88, 1585.48, 1, true),
  ('rob-moreschi', 11, 3, 0, 1771.04, 1415.12, 2, true),
  ('adam-rudin', 9, 5, 0, 1677.4, 1573.38, 3, true),
  ('chris-moreschi', 13, 1, 0, 1804.58, 1464.82, 4, true),
  ('kevin-blanco', 6, 8, 0, 1581.52, 1530.84, 5, true),
  ('michael-pateiro', 7, 7, 0, 1741.06, 1609.28, 6, true),
  ('chris-blanco', 6, 8, 0, 1573.98, 1604.14, 7, false),
  ('ian-oloughlin', 2, 12, 0, 1285.64, 1696.16, 8, false),
  ('frank-panico', 6, 8, 0, 1545.84, 1685.36, 9, false),
  ('adam-gladstone', 4, 10, 0, 1337.58, 1548.88, 10, false),
  ('soren-pedersen', 6, 8, 0, 1510.26, 1578.72, 11, false),
  ('jeff-peragallo', 5, 9, 0, 1448.96, 1576.56, 12, false)
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
where year = '2022-23';
