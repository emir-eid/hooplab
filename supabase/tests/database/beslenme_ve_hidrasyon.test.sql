-- Beslenme ve hidrasyon (karar 0029): sabah kilosu, gün tipi düzeltmesi ve seansa bağlı ter testi.
-- Tek sahip RLS, giriş aralıkları ve ter testi tutarlılığı. Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

-- Sabah kilosu
select lives_ok(
  $$ insert into public.body_weights (local_date, weight_kg) values ('2026-01-05', 80.4) $$,
  'A sabah kilosu ekleyebilir'
);
select throws_ok(
  $$ insert into public.body_weights (local_date, weight_kg) values ('2026-01-05', 81) $$,
  '23505', null,
  'günde bir kilo kaydı'
);
select throws_ok(
  $$ insert into public.body_weights (local_date, weight_kg) values ('2026-01-06', 20) $$,
  '23514', null,
  'kilo giriş aralığı dışında reddedilir'
);
select throws_ok(
  $$ insert into public.body_weights (user_id, local_date, weight_kg)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-06', 80) $$,
  '42501', null,
  'A, B adına kilo ekleyemez'
);

-- Gün tipi
select lives_ok(
  $$ insert into public.day_types (local_date, day_type) values ('2026-01-05', 'high') $$,
  'A gün tipini düzeltebilir'
);
select throws_ok(
  $$ insert into public.day_types (local_date, day_type) values ('2026-01-06', 'match') $$,
  '23514', null,
  'bilinmeyen gün tipi reddedilir'
);

-- Ter testi
select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, sweat_pre_kg, sweat_post_kg, sweat_fluid_l)
     values ('2026-01-05', 'team_practice', 90, 7, 80.4, 79.1, 1.2) $$,
  'ter testli seans eklenir'
);
select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe) values ('2026-01-05', 'shooting', 30, 3) $$,
  'ter testsiz seans eklenir'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, sweat_pre_kg)
     values ('2026-01-05', 'game', 100, 8, 80) $$,
  '23514', null,
  'ön kilo son kilo olmadan girilemez'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, sweat_fluid_l)
     values ('2026-01-05', 'game', 100, 8, 1) $$,
  '23514', null,
  'içilen sıvı tartı olmadan girilemez'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, sweat_pre_kg, sweat_post_kg, sweat_fluid_l)
     values ('2026-01-05', 'game', 100, 8, 80, 79, 12) $$,
  '23514', null,
  'içilen sıvı giriş aralığı dışında reddedilir'
);

-- B oturumu: A'nın kilosunu, gün tipini ve ter testini göremez, değiştiremez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is_empty($$ select weight_kg from public.body_weights $$, 'B, A''nın kilosunu göremez');
select is_empty($$ update public.body_weights set weight_kg = 90 returning id $$, 'B, A''nın kilosunu değiştiremez');
select is_empty($$ select day_type from public.day_types $$, 'B, A''nın gün tipini göremez');
select is_empty($$ select sweat_pre_kg from public.training_sessions $$, 'B, A''nın ter testini göremez');

-- Anonim istek
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok($$ select id from public.body_weights $$, '42501', null, 'anon kilo tablosunu okuyamaz');

select * from finish();
rollback;
