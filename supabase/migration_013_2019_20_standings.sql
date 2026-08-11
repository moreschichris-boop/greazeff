-- Historical standings: 2019-20 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2019-20'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('frank-panico', 12, 1, 0, 1700.7, 1340.54, 1, true),
  ('kevin-blanco', 9, 4, 0, 1743.14, 1490.42, 2, true),
  ('adam-rudin', 10, 3, 0, 1737.08, 1504.34, 3, true),
  ('rob-moreschi', 7, 6, 0, 1502.12, 1343.08, 4, true),
  ('cuyler-peragallo', 7, 6, 0, 1391.62, 1395.32, 5, true),
  ('jeff-peragallo', 9, 4, 0, 1519.4, 1439.36, 6, true),
  ('ian-oloughlin', 4, 9, 0, 1509.44, 1649.92, 7, false),
  ('soren-pedersen', 5, 8, 0, 1370.86, 1565.66, 8, false),
  ('michael-pateiro', 6, 7, 0, 1489.86, 1513.52, 9, false),
  ('chris-moreschi', 5, 8, 0, 1400.82, 1684.04, 10, false),
  ('chris-blanco', 3, 10, 0, 1396.86, 1547.66, 11, false),
  ('adam-gladstone', 1, 12, 0, 1309.5, 1597.54, 12, false)
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
update seasons set last_place_id = (select id from owners where slug = 'adam-gladstone')
where year = '2019-20';
