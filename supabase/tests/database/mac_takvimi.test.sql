-- Maç takvimi (karar 0046): saat ve yer, yalnız sahibi günceller, tarih ve sahip değişmez; yeni gün tipi.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.match_days (local_date, start_time, venue) values ('2026-01-10', '19:00', 'away'), ('2026-01-12', null, null) $$,
  'A ileri tarihli maç ekleyebilir (saat ve yer isteğe bağlı)'
);
select throws_ok(
  $$ insert into public.match_days (local_date, venue) values ('2026-01-14', 'neutral') $$,
  '23514', null,
  'tanınmayan yer reddedilir'
);
select lives_ok(
  $$ update public.match_days set start_time = '20:30', venue = 'home' where local_date = '2026-01-10' $$,
  'A saat ve yeri güncelleyebilir'
);
select is((select start_time::text from public.match_days where local_date = '2026-01-10'), '20:30:00', 'güncelleme yazıldı');
select throws_ok(
  $$ update public.match_days set local_date = '2026-01-11' $$,
  '42501', null,
  'tarih güncellenemez (silinip yeniden eklenir)'
);
select throws_ok(
  $$ update public.match_days set user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null,
  'sahip güncellenemez'
);
select lives_ok(
  $$ insert into public.day_types (local_date, day_type) values ('2026-01-09', 'match') $$,
  'maç çevresi gün tipi seçilebilir'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
update public.match_days set venue = 'home', start_time = '10:00';
select is((select count(*) from public.match_days)::int, 0, 'B, A''nın maçlarını görmez');

set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is(
  (select start_time::text || ' ' || venue from public.match_days where local_date = '2026-01-10'),
  '20:30:00 home',
  'B''nin güncellemesi A''nın maçına dokunmaz'
);

reset role;
set local role anon;
select throws_ok($$ update public.match_days set venue = 'home' $$, '42501', null, 'anon match_days tablosunu güncelleyemez');

select * from finish();
rollback;
