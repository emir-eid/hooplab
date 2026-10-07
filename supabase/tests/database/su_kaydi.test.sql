-- Su kaydı (karar 0031): tek sahip RLS, giriş aralığı, güncelleme yetkisi yok. Çalıştırma: npm run test:db.
-- Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.fluid_intakes (local_date, volume_ml) values ('2026-01-05', 500), ('2026-01-05', 250) $$,
  'A içiş ekleyebilir (aynı gün birden çok)'
);
select throws_ok(
  $$ insert into public.fluid_intakes (local_date, volume_ml) values ('2026-01-05', 20) $$,
  '23514', null,
  'giriş aralığının altı reddedilir'
);
select throws_ok(
  $$ insert into public.fluid_intakes (local_date, volume_ml) values ('2026-01-05', 2500) $$,
  '23514', null,
  'giriş aralığının üstü reddedilir'
);
select throws_ok(
  $$ insert into public.fluid_intakes (user_id, local_date, volume_ml)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-05', 500) $$,
  '42501', null,
  'A, B adına içiş ekleyemez'
);
select throws_ok(
  $$ update public.fluid_intakes set volume_ml = 750 $$,
  '42501', null,
  'içiş güncellenemez (silinip yeniden eklenir)'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.fluid_intakes)::int, 0, 'B, A''nın içişlerini görmez');
delete from public.fluid_intakes;

set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is((select count(*) from public.fluid_intakes)::int, 2, 'B''nin silmesi A''ya dokunmaz');

reset role;
set local role anon;
select throws_ok($$ select * from public.fluid_intakes $$, '42501', null, 'anon fluid_intakes tablosunu okuyamaz');

select * from finish();
rollback;
