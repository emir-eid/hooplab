-- Apple sütunları (karar 0061 sıra 3b): SDNN ve uyku nabzı ayrı sütunlarda; Apple satırında Fitbit HRV / NREM nabzı,
-- Google satırında Apple sütunları yazılamaz; healthkit-ingest'in upsert yolu çalışır; iki kullanıcı birbirini görmez.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

select col_type_is('public', 'health_daily', 'hrv_sleep_sdnn_ms', 'double precision', 'SDNN sütunu');
select col_type_is('public', 'health_daily', 'sleep_hr_bpm', 'double precision', 'uyku nabzı sütunu');
select ok(
  not has_column_privilege('authenticated', 'public.health_daily', 'hrv_sleep_sdnn_ms', 'insert')
  and not has_column_privilege('authenticated', 'public.health_daily', 'hrv_sleep_sdnn_ms', 'update')
  and not has_column_privilege('authenticated', 'public.health_daily', 'sleep_hr_bpm', 'update')
  and has_column_privilege('authenticated', 'public.health_daily', 'hrv_sleep_sdnn_ms', 'select'),
  'kullanıcı Apple sütunlarını okur, yazamaz (yazan yalnız healthkit-ingest)'
);

-- A: sahibi gibi (varsayılan profil). B: davetli (Apple · fitness, hesabı açan atar).
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role service_role;
update public.profiles set data_source = 'apple_health', sport = 'fitness'
  where user_id = '22222222-2222-4222-8222-222222222222';

insert into public.health_daily (user_id, local_date, hrv_deep_rmssd_ms, nrem_hr_bpm)
  values ('11111111-1111-4111-8111-111111111111', '2026-01-01', 60, 50);

-- healthkit-ingest'in yazdığı biçim: upsert, kaynak apple_health.
select lives_ok(
  $$ insert into public.health_daily (user_id, local_date, source, hrv_sleep_sdnn_ms, sleep_hr_bpm, resting_hr_bpm)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-01', 'apple_health', 45.5, 55.2, 52)
     on conflict (user_id, local_date) do update
       set hrv_sleep_sdnn_ms = excluded.hrv_sleep_sdnn_ms, sleep_hr_bpm = excluded.sleep_hr_bpm $$,
  'Apple satırı Apple sütunlarıyla yazılır'
);
select lives_ok(
  $$ insert into public.health_daily (user_id, local_date, source, hrv_sleep_sdnn_ms, sleep_hr_bpm)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-01', 'apple_health', 47, 54)
     on conflict (user_id, local_date) do update
       set hrv_sleep_sdnn_ms = excluded.hrv_sleep_sdnn_ms, sleep_hr_bpm = excluded.sleep_hr_bpm $$,
  'aynı gün yeniden yüklenince güncellenir'
);
select results_eq(
  $$ select hrv_sleep_sdnn_ms, sleep_hr_bpm from public.health_daily
     where user_id = '22222222-2222-4222-8222-222222222222' $$,
  $$ values (47::double precision, 54::double precision) $$,
  'yeniden yüklemenin değeri yazıldı, satır tek'
);
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date, source, hrv_deep_rmssd_ms)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-02', 'apple_health', 60) $$,
  '23514', null,
  'Apple satırına Fitbit RMSSD''si yazılamaz'
);
select throws_ok(
  $$ update public.health_daily set nrem_hr_bpm = 50
     where user_id = '22222222-2222-4222-8222-222222222222' $$,
  '23514', null,
  'Apple satırına NREM nabzı sonradan da yazılamaz'
);
select throws_ok(
  $$ update public.health_daily set hrv_sleep_sdnn_ms = 45
     where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null,
  'sahibinin Google satırına SDNN yazılamaz'
);
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date, sleep_hr_bpm)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-02', 55) $$,
  '23514', null,
  'Google satırına uyku nabzı yazılamaz'
);
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date, source, hrv_sleep_sdnn_ms)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-03', 'apple_health', 0) $$,
  '23514', null,
  'SDNN sıfır ya da negatif olamaz'
);
select lives_ok(
  $$ insert into public.sleep_sessions (user_id, source_id, local_date, start_time, end_time, is_nap, is_main,
                                        minutes_asleep, minutes_light, minutes_deep, minutes_rem, source)
     values ('22222222-2222-4222-8222-222222222222', 'hk-1', '2026-01-01',
             '2025-12-31T21:00:00Z', '2026-01-01T05:00:00Z', false, true, 440, 250, 80, 110, 'apple_health')
     on conflict (user_id, source_id) do update set minutes_asleep = excluded.minutes_asleep $$,
  'Apple uyku oturumu yazılır'
);
select lives_ok(
  $$ insert into public.exercise_sessions (user_id, source_id, local_date, start_time, end_time, exercise_type, source)
     values ('22222222-2222-4222-8222-222222222222', 'hk-2', '2026-01-01',
             '2026-01-01T15:00:00Z', '2026-01-01T16:00:00Z', 'traditionalStrengthTraining', 'apple_health')
     on conflict (user_id, source_id) do update set exercise_type = excluded.exercise_type $$,
  'Apple antrenmanı yazılır'
);
select lives_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal, source)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-01T05:00:00Z', '2026-01-01', 8, 90, 'apple_health')
     on conflict (user_id, hour_start) do update set kcal = excluded.kcal $$,
  'Apple saatlik enerjisi yazılır'
);
select results_eq(
  $$ select hrv_deep_rmssd_ms, nrem_hr_bpm::int, hrv_sleep_sdnn_ms, sleep_hr_bpm from public.health_daily
     where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (60::double precision, 50, null::double precision, null::double precision) $$,
  'sahibinin satırı dokunulmamış'
);

-- A'nın oturumu: B'nin Apple satırları görünmez.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is(
  (select count(*)::int from public.health_daily where hrv_sleep_sdnn_ms is not null)
    + (select count(*)::int from public.sleep_sessions)
    + (select count(*)::int from public.exercise_sessions)
    + (select count(*)::int from public.health_hourly_energy),
  0,
  'A, B''nin Apple satırlarının hiçbirini görmez'
);

-- B'nin oturumu: kendi değerini okur.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select results_eq(
  $$ select hrv_sleep_sdnn_ms, sleep_hr_bpm from public.health_daily $$,
  $$ values (47::double precision, 54::double precision) $$,
  'B yalnız kendi Apple satırını görür'
);

select * from finish();
rollback;
