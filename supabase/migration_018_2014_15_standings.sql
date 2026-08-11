-- Historical standings: 2014-15 season, entered from the league's
-- final standings screenshot. This was a 10-team season (Ian O'Loughlin and
-- Adam Gladstone joined in 2015-16), so only 10 owners get a row here.
-- Safe to run once.

insert into season_results (season_id, owner_id, wins, losses, ties, points_for, points_against, final_rank, made_playoffs)
select
  (select id from seasons where year = '2014-15'),
  o.id, v.wins, v.losses, v.ties, v.points_for, v.points_against, v.final_rank, v.made_playoffs
from (values
  ('chris-moreschi', 8, 4, 1, 1514.64, 1334.96, 1, true),
  ('jeff-peragallo', 10, 2, 1, 1575.2, 1452.92, 2, true),
  ('soren-pedersen', 10, 3, 0, 1410.12, 1312.28, 3, true),
  ('michael-pateiro', 7, 6, 0, 1455.42, 1468.14, 4, true),
  ('rob-moreschi', 6, 7, 0, 1354.1, 1405.66, 5, true),
  ('adam-rudin', 6, 7, 0, 1540.88, 1385.1, 6, true),
  ('kevin-blanco', 5, 8, 0, 1344.66, 1468.64, 7, false),
  ('chris-blanco', 5, 8, 0, 1447.44, 1488.8, 8, false),
  ('cuyler-peragallo', 2, 11, 0, 1235.2, 1506.88, 9, false),
  ('frank-panico', 5, 8, 0, 1399.14, 1453.42, 10, false)
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
update seasons set last_place_id = (select id from owners where slug = 'frank-panico')
where year = '2014-15';
