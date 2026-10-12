-- Maç günü işareti (karar 0036): tek sahip RLS, günde bir, güncelleme yetkisi yok. Çalıştırma: npm run test:db.
-- Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.match_days (local_date) values ('2026-01-05'), ('2026-01-07') $$,
  'A maç günü işaretleyebilir'
);
select throws_ok(
  $$ insert into public.match_days (local_date) values ('2026-01-05') $$,
  '23505', null,
  'aynı gün ikinci kez işaretlenemez'
);
select throws_ok(
  $$ insert into public.match_days (user_id, local_date)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-05') $$,
  '42501', null,
  'A, B adına işaretleyemez'
);
select throws_ok(
  $$ update public.match_days set local_date = '2026-01-06' $$,
  '42501', null,
  'işaret güncellenemez (silinip yeniden eklenir)'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.match_days)::int, 0, 'B, A''nın maç günlerini görmez');
delete from public.match_days;

set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is((select count(*) from public.match_days)::int, 2, 'B''nin silmesi A''ya dokunmaz');

reset role;
set local role anon;
select throws_ok($$ select * from public.match_days $$, '42501', null, 'anon match_days tablosunu okuyamaz');

select * from finish();
rollback;
