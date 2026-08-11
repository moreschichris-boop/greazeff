-- Redefines "Toilet Bowl" (seasons.last_place_id) as whoever finished
-- rank 12 in the final standings that year, rather than the separate
-- loser's-bracket result from the original spreadsheet. Updates the two
-- seasons entered so far; safe to run once.

update seasons set last_place_id = (select id from owners where slug = 'frank-panico')
where year = '2024-25';

update seasons set last_place_id = (select id from owners where slug = 'cuyler-peragallo')
where year = '2025-26';
