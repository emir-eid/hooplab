-- Saatlik yakılan enerji (karar 0044): sahibi yalnız okur, yazma yolu yalnız service_role.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

select ok(
  has_table_privilege('authenticated', 'public.health_hourly_energy', 'select')
  and not has_table_privilege('authenticated', 'public.health_hourly_energy', 'insert')
  and not has_table_privilege('authenticated', 'public.health_hourly_energy', 'update')
  and not has_table_privilege('authenticated', 'public.health_hourly_energy', 'delete'),
  'authenticated saatlik enerjide yalnız SELECT yetkili'
);
select ok(
  not has_table_privilege('anon', 'public.health_hourly_energy', 'select,insert,update,delete'),
  'anon saatlik enerjiye hiç erişemez'
);
select ok(
  has_table_privilege('service_role', 'public.health_hourly_energy', 'select,insert,update,delete'),
  'service_role saatlik enerjiye yazabilir'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.health_hourly_energy'::regclass),
  'saatlik enerjide RLS açık'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role service_role;

select lives_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-04 21:00+00', '2026-01-05', 0, 72.5),
            ('11111111-1111-4111-8111-111111111111', '2026-01-04 22:00+00', '2026-01-05', 1, 70) $$,
  'service_role saatlik enerji yazabilir'
);
select lives_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-04 21:00+00', '2026-01-05', 0, 80)
     on conflict (user_id, hour_start) do update set kcal = excluded.kcal $$,
  'aynı saat yeniden yazılınca güncellenir'
);
select is(
  (select kcal from public.health_hourly_energy where hour_start = '2026-01-04 21:00+00'),
  80::double precision,
  'güncelleme yeni değeri yazar, satır çoğalmaz'
);
select throws_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-05 21:00+00', '2026-01-06', 24, 10) $$,
  '23514', null,
  'saat 0-23 dışında olamaz'
);
select throws_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-05 21:00+00', '2026-01-06', 0, -1) $$,
  '23514', null,
  'kalori eksi olamaz'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.health_hourly_energy), 2, 'A kendi saatlerini görür');
select throws_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-05 21:00+00', '2026-01-06', 0, 10) $$,
  '42501', null,
  'A saatlik enerjiyi elle ekleyemez'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is_empty($$ select hour_start from public.health_hourly_energy $$, 'B, A''nın saatlerini göremez');

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok(
  $$ select hour_start from public.health_hourly_energy $$,
  '42501', null,
  'anon saatlik enerjiyi okuyamaz'
);

select * from finish();
rollback;
