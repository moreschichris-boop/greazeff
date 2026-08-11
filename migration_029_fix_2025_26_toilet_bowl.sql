-- Correction: 2025-26 Toilet Bowl should be Rob Moreschi, not Cuyler
-- Peragallo. Safe to run once.

update seasons
set last_place_id = (select id from owners where slug = 'rob-moreschi')
where year = '2025-26';
