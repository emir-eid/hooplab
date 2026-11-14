-- Profil ve kaynak bekçisi (karar 0061, bekçi 2 ve 3): iki kullanıcı birbirini görmez; kullanıcı veri kaynağını
-- ve sporunu değiştiremez; cihaz satırının kaynağı profille uyuşmazsa yazma reddedilir.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

-- Yetki haritası
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select')
  and not has_table_privilege('authenticated', 'public.profiles', 'insert')
  and not has_table_privilege('authenticated', 'public.profiles', 'delete'),
  'authenticated profilde okur; ekleyemez, silemez'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'sex', 'update')
  and has_column_privilege('authenticated', 'public.profiles', 'cycle_tracking', 'update')
  and has_column_privilege('authenticated', 'public.profiles', 'hormonal_contraception', 'update'),
  'authenticated cinsiyet, döngü takibi ve korunma alanlarını güncelleyebilir'
);
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'data_source', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'sport', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'user_id', 'update'),
  'authenticated veri kaynağını, sporu ve sahibi değiştiremez'
);
select ok(
  not has_function_privilege('authenticated', 'private.enforce_profile_source()', 'execute')
  and not has_function_privilege('authenticated', 'private.create_profile_for_new_user()', 'execute'),
  'profil fonksiyonları kullanıcı rollerince çağrılamaz'
);

-- A: sahibi gibi (varsayılan profil). B: davetli (Apple · fitness, hesabı açan atar).
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

select results_eq(
  $$ select data_source, sport, sex, cycle_tracking, hormonal_contraception from public.profiles
     where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values ('google_health'::text, 'basketbol'::text, null::text, false, null::text) $$,
  'yeni kullanıcıya varsayılan profil açılır: Google Health, basketbol, cinsiyet boş'
);

set local role service_role;
update public.profiles set data_source = 'apple_health', sport = 'fitness'
  where user_id = '22222222-2222-4222-8222-222222222222';

-- Kaynak bekçisi: A'ya yalnız Google, B'ye yalnız Apple verisi yazılır.
select lives_ok(
  $$ insert into public.health_daily (user_id, local_date, hrv_deep_rmssd_ms)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-01', 60) $$,
  'Google satırı Google profiline yazılır (kaynak varsayılanı google_health)'
);
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date, source)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-02', 'apple_health') $$,
  '23514', null,
  'Apple satırı Google profiline (sahibine) yazılamaz'
);
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-01') $$,
  '23514', null,
  'Google satırı Apple profiline yazılamaz'
);
select lives_ok(
  $$ insert into public.health_daily (user_id, local_date, source, resting_hr_bpm)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-01', 'apple_health', 58) $$,
  'Apple satırı Apple profiline yazılır'
);
select throws_ok(
  $$ update public.health_daily set source = 'apple_health'
     where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null,
  'sahibinin satırının kaynağı sonradan Apple yapılamaz'
);
select throws_ok(
  $$ update public.health_daily set user_id = '11111111-1111-4111-8111-111111111111'
     where user_id = '22222222-2222-4222-8222-222222222222' $$,
  '23514', null,
  'Apple satırı sahibine taşınamaz'
);
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date, source)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-03', 'fitbit') $$,
  '23514', null,
  'bilinmeyen kaynak reddedilir'
);
select throws_ok(
  $$ insert into public.sleep_sessions (user_id, source_id, local_date, start_time, end_time, source)
     values ('11111111-1111-4111-8111-111111111111', 'x1', '2026-01-01',
             '2026-01-01T00:00:00Z', '2026-01-01T07:00:00Z', 'apple_health') $$,
  '23514', null,
  'uyku: Apple satırı sahibine yazılamaz'
);
select throws_ok(
  $$ insert into public.exercise_sessions (user_id, source_id, local_date, start_time, end_time, exercise_type, source)
     values ('11111111-1111-4111-8111-111111111111', 'x1', '2026-01-01',
             '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'SPORT', 'apple_health') $$,
  '23514', null,
  'egzersiz: Apple satırı sahibine yazılamaz'
);
select throws_ok(
  $$ insert into public.exercise_sessions (user_id, source_id, local_date, start_time, end_time, exercise_type)
     values ('22222222-2222-4222-8222-222222222222', 'x1', '2026-01-01',
             '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'SPORT') $$,
  '23514', null,
  'egzersiz: Google satırı Apple profiline yazılamaz'
);
select throws_ok(
  $$ insert into public.health_hourly_energy (user_id, hour_start, local_date, local_hour, kcal, source)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-01T05:00:00Z', '2026-01-01', 8, 100, 'apple_health') $$,
  '23514', null,
  'saatlik enerji: Apple satırı sahibine yazılamaz'
);
select is(
  (select count(*)::int from public.health_daily where source = 'google_health'
     and user_id = '11111111-1111-4111-8111-111111111111'),
  1,
  'sahibinin tek satırı Google kaynaklı ve dokunulmamış'
);

-- A'nın oturumu
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select results_eq(
  $$ select user_id::text from public.profiles $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::text) $$,
  'A yalnız kendi profilini görür'
);
select is(
  (select count(*)::int from public.health_daily),
  1,
  'A yalnız kendi cihaz satırını görür'
);
select throws_ok(
  $$ update public.profiles set data_source = 'apple_health' $$,
  '42501', null,
  'A veri kaynağını değiştiremez'
);
select throws_ok(
  $$ update public.profiles set sport = 'fitness' $$,
  '42501', null,
  'A sporunu değiştiremez'
);
select throws_ok(
  $$ update public.profiles set cycle_tracking = true, sex = 'erkek' $$,
  '23514', null,
  'döngü takibi yalnız kadın profilinde açılır'
);
select lives_ok(
  $$ update public.profiles set sex = 'erkek' $$,
  'A kendi cinsiyetini kaydeder'
);
update public.profiles set sex = 'kadin', cycle_tracking = true
  where user_id = '22222222-2222-4222-8222-222222222222';

-- B'nin oturumu
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select results_eq(
  $$ select sex, cycle_tracking, hormonal_contraception, data_source, sport from public.profiles $$,
  $$ values (null::text, false, null::text, 'apple_health'::text, 'fitness'::text) $$,
  'A''nın güncellemesi B''nin profiline dokunmadı; B yalnız kendini görür'
);
select lives_ok(
  $$ update public.profiles set sex = 'kadin', cycle_tracking = true, hormonal_contraception = 'belirtmek_istemiyorum' $$,
  'B döngü alanlarını kaydeder'
);
select results_eq(
  $$ select h.user_id::text, h.source from public.health_daily h $$,
  $$ values ('22222222-2222-4222-8222-222222222222'::text, 'apple_health'::text) $$,
  'B yalnız kendi Apple satırını görür; sahibinin satırı görünmez'
);

select * from finish();
rollback;
