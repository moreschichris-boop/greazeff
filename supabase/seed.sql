-- Greaze Fantasy Football League — seed data
-- Owners (12 teams) and season history (2011-12 through 2025-26)
-- pulled from the league's historical spreadsheet.

insert into owners (slug, name, sort_order) values
  ('chris-blanco', 'Chris Blanco', 0),
  ('kevin-blanco', 'Kevin Blanco', 1),
  ('adam-gladstone', 'Adam Gladstone', 2),
  ('chris-moreschi', 'Chris Moreschi', 3),
  ('rob-moreschi', 'Rob Moreschi', 4),
  ('ian-oloughlin', 'Ian O''loughlin', 5),
  ('frank-panico', 'Frank Panico', 6),
  ('michael-pateiro', 'Michael Pateiro', 7),
  ('soren-pedersen', 'Soren Pedersen', 8),
  ('cuyler-peragallo', 'Cuyler Peragallo', 9),
  ('jeff-peragallo', 'Jeff Peragallo', 10),
  ('adam-rudin', 'Adam Rudin', 11)
on conflict (slug) do nothing;

insert into seasons (year, last_place_id, reg_season_winner_id, runner_up_id, champion_id)
select v.year, lp.id, rw.id, ru.id, ch.id from (values
  ('2011-12', 'michael-pateiro', 'frank-panico', 'frank-panico', 'cuyler-peragallo'),
  ('2012-13', 'frank-panico', 'chris-moreschi', 'chris-blanco', 'soren-pedersen'),
  ('2013-14', 'michael-pateiro', 'frank-panico', 'kevin-blanco', 'jeff-peragallo'),
  ('2014-15', 'cuyler-peragallo', 'jeff-peragallo', 'jeff-peragallo', 'chris-moreschi'),
  ('2015-16', 'adam-gladstone', 'adam-rudin', 'adam-rudin', 'frank-panico'),
  ('2016-17', 'chris-blanco', 'adam-gladstone', 'michael-pateiro', 'soren-pedersen'),
  ('2017-18', 'michael-pateiro', 'rob-moreschi', 'rob-moreschi', 'kevin-blanco'),
  ('2018-19', 'chris-moreschi', 'jeff-peragallo', 'ian-oloughlin', 'soren-pedersen'),
  ('2019-20', 'adam-gladstone', 'frank-panico', 'kevin-blanco', 'frank-panico'),
  ('2020-21', 'michael-pateiro', 'soren-pedersen', 'adam-rudin', 'soren-pedersen'),
  ('2021-22', 'kevin-blanco', 'frank-panico', 'frank-panico', 'soren-pedersen'),
  ('2022-23', 'ian-oloughlin', 'chris-moreschi', 'rob-moreschi', 'cuyler-peragallo'),
  ('2023-24', 'cuyler-peragallo', 'soren-pedersen', 'adam-gladstone', 'soren-pedersen'),
  ('2024-25', 'michael-pateiro', 'chris-moreschi', 'adam-rudin', 'chris-moreschi'),
  ('2025-26', 'rob-moreschi', 'adam-rudin', 'frank-panico', 'adam-rudin')
) as v(year, loser_slug, regw_slug, ru_slug, champ_slug)
join owners lp on lp.slug = v.loser_slug
join owners rw on rw.slug = v.regw_slug
join owners ru on ru.slug = v.ru_slug
join owners ch on ch.slug = v.champ_slug
on conflict (year) do nothing;

-- Starter all-time record book — edit/add rows from the Admin > Records tab
insert into all_time_records (title, description, sort_order) values
  ('Most Championships', 'Auto-tracked below the record book from season history — see standings.', 0),
  ('Most Runner-Up Finishes', 'Auto-tracked below the record book from season history — see standings.', 0),
  ('Best Single-Season Record', 'Add once weekly records are on hand.', 0),
  ('Biggest Blowout', 'Add the final score once you have it.', 0),
  ('Most Points in a Season', 'Add once weekly scoring totals are on hand.', 0),
  ('Longest Championship Drought', 'Add manually.', 0);
