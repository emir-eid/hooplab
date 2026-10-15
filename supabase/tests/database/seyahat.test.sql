-- Seyahatler (karar 0047): tek sahip RLS, saat farkı aralığı, dönüş gidişten önce olamaz.
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
  $$ insert into public.trips (depart_date, return_date, offset_hours) values ('2026-01-10', '2026-01-20', 7), ('2026-02-01', null, 0) $$,
  'A seyahat ekleyebilir (dönüş isteğe bağlı)'
);
select throws_ok(
  $$ insert into public.trips (depart_date, offset_hours) values ('2026-03-01', 15) $$,
  '23514', null,
  'saat farkı aralık dışında reddedilir'
);
select throws_ok(
  $$ insert into public.trips (depart_date, return_date, offset_hours) values ('2026-03-05', '2026-03-04', -3) $$,
  '23514', null,
  'dönüş gidişten önce olamaz'
);
select throws_ok(
  $$ insert into public.trips (user_id, depart_date, offset_hours) values ('22222222-2222-4222-8222-222222222222', '2026-03-01', 0) $$,
  '42501', null,
  'A, B adına seyahat ekleyemez'
);
select lives_ok(
  $$ update public.trips set offset_hours = -6, return_date = '2026-01-18' where depart_date = '2026-01-10' $$,
  'A seyahatini güncelleyebilir'
);
select throws_ok(
  $$ update public.trips set user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null,
  'sahip başkasına devredilemez'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.trips)::int, 0, 'B, A''nın seyahatlerini görmez');
update public.trips set offset_hours = 1;
delete from public.trips;

set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is((select count(*) from public.trips)::int, 2, 'B''nin silmesi A''ya dokunmaz');
select is((select offset_hours from public.trips where depart_date = '2026-01-10')::int, -6, 'B''nin güncellemesi A''ya dokunmaz');

reset role;
set local role anon;
select throws_ok($$ select * from public.trips $$, '42501', null, 'anon trips tablosunu okuyamaz');

select * from finish();
rollback;
