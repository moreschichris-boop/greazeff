-- Historical standings: 2018-19 season, entered from the league's
-- final standings screenshot. Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2018-19'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('soren-pedersen', 7, 6, 0, 1633.0, 1610.56, 1, true),
  ('ian-oloughlin', 9, 4, 0, 1594.94, 1308.16, 2, true),
  ('rob-moreschi', 11, 2, 0, 1586.4, 1245.12, 3, true),
  ('jeff-peragallo', 12, 1, 0, 1689.06, 1386.1, 4, true),
  ('michael-pateiro', 6, 7, 0, 1409.56, 1453.56, 5, true),
  ('adam-gladstone', 6, 7, 0, 1427.84, 1332.9, 6, true),
  ('kevin-blanco', 5, 8, 0, 1354.58, 1433.9, 7, false),
  ('chris-blanco', 6, 7, 0, 1389.68, 1550.14, 8, false),
  ('cuyler-peragallo', 4, 9, 0, 1288.52, 1487.14, 9, false),
  ('frank-panico', 6, 7, 0, 1340.64, 1423.66, 10, false),
  ('adam-rudin', 4, 9, 0, 1207.98, 1440.4, 11, false),
  ('chris-moreschi', 2, 11, 0, 1267.16, 1517.72, 12, false)
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
update seasons set last_place_id = (select id from owners where slug = 'chris-moreschi')
where year = '2018-19';
