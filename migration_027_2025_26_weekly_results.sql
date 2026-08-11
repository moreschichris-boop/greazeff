-- Weekly winner/loser results for the 2025-26 season, entered from the
-- league's treasurer spreadsheet. Safe to run once.

do $$
declare
  v_season uuid := (select id from seasons where year = '2025-26');
begin

insert into weekly_results (season_id, week, winner_owner_id, loser_owner_id) values
  (v_season, 1, (select id from owners where slug = 'michael-pateiro'), (select id from owners where slug = 'jeff-peragallo')),
  (v_season, 2, (select id from owners where slug = 'chris-blanco'), (select id from owners where slug = 'michael-pateiro')),
  (v_season, 3, (select id from owners where slug = 'michael-pateiro'), (select id from owners where slug = 'cuyler-peragallo')),
  (v_season, 4, (select id from owners where slug = 'adam-rudin'), (select id from owners where slug = 'ian-oloughlin')),
  (v_season, 5, (select id from owners where slug = 'michael-pateiro'), (select id from owners where slug = 'jeff-peragallo')),
  (v_season, 6, (select id from owners where slug = 'adam-rudin'), (select id from owners where slug = 'ian-oloughlin')),
  (v_season, 7, (select id from owners where slug = 'soren-pedersen'), (select id from owners where slug = 'michael-pateiro')),
  (v_season, 8, (select id from owners where slug = 'cuyler-peragallo'), (select id from owners where slug = 'frank-panico')),
  (v_season, 9, (select id from owners where slug = 'chris-moreschi'), (select id from owners where slug = 'adam-gladstone')),
  (v_season, 10, (select id from owners where slug = 'soren-pedersen'), (select id from owners where slug = 'rob-moreschi')),
  (v_season, 11, (select id from owners where slug = 'soren-pedersen'), (select id from owners where slug = 'adam-gladstone')),
  (v_season, 12, (select id from owners where slug = 'frank-panico'), (select id from owners where slug = 'rob-moreschi')),
  (v_season, 13, (select id from owners where slug = 'adam-rudin'), (select id from owners where slug = 'rob-moreschi')),
  (v_season, 14, (select id from owners where slug = 'michael-pateiro'), (select id from owners where slug = 'kevin-blanco'))
on conflict (season_id, week) do update set
  winner_owner_id = excluded.winner_owner_id,
  loser_owner_id = excluded.loser_owner_id;

end $$;
