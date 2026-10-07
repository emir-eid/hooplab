-- Google Health senkron tabloları: sahibi yalnız okur, yazma yolu yalnız service_role; token ve OAuth
-- durumu kullanıcı oturumuna tamamen kapalı. Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

-- Yetki haritası: authenticated cihaz verisinde yalnız SELECT, sır tablolarında hiçbir şey.
select ok(
  has_table_privilege('authenticated', 'public.health_daily', 'select')
  and not has_table_privilege('authenticated', 'public.health_daily', 'insert')
  and not has_table_privilege('authenticated', 'public.health_daily', 'update')
  and not has_table_privilege('authenticated', 'public.health_daily', 'delete'),
  'authenticated health_daily üzerinde yalnız SELECT yetkili'
);
select ok(
  not has_table_privilege('authenticated', 'public.sleep_sessions', 'insert,update,delete')
  and not has_table_privilege('authenticated', 'public.exercise_sessions', 'insert,update,delete')
  and not has_table_privilege('authenticated', 'public.health_sync_status', 'insert,update,delete'),
  'authenticated uyku, egzersiz ve durum tablolarına yazamaz'
);
select ok(
  not has_table_privilege('authenticated', 'public.google_health_tokens', 'select,insert,update,delete')
  and not has_table_privilege('authenticated', 'public.google_health_oauth_states', 'select,insert,update,delete'),
  'authenticated token ve OAuth durumu tablolarında hiçbir yetkiye sahip değil'
);
select is_empty(
  $$ select polname from pg_policy where polrelid in
       ('public.google_health_tokens'::regclass, 'public.google_health_oauth_states'::regclass) $$,
  'sır tablolarında hiç politika yok'
);
select ok(
  has_table_privilege('service_role', 'public.google_health_tokens', 'select,insert,update,delete')
  and has_table_privilege('service_role', 'public.health_daily', 'select,insert,update,delete'),
  'service_role (Edge Functions) tablolara yazabilir'
);

-- Zamanlayıcı ve tetikleyici
select is(
  (select schedule from cron.job where jobname = 'google-health-senkron'),
  '17 * * * *',
  'saatlik senkron işi kurulu'
);
-- Yerel kurulum (npm run setup -- --local) Vault'a değer yazmış olabilir; işlem sonunda geri alınır.
delete from vault.secrets where name in ('project_url', 'ghealth_cron_secret');
select is(private.trigger_google_health_sync(), null,'Vault''ta adres ve sır yoksa tetikleyici hiçbir şey yapmaz');
select ok(
  not has_function_privilege('authenticated', 'private.trigger_google_health_sync()', 'execute')
  and not has_function_privilege('anon', 'private.trigger_google_health_sync()', 'execute'),
  'tetikleyici kullanıcı rollerince çağrılamaz'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

-- Senkron fonksiyonu gibi service_role ile yaz.
set local role service_role;

select lives_ok(
  $$ insert into public.health_daily (user_id, local_date, hrv_rmssd_ms, resting_hr_bpm, steps)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-05', 61.5, 48, 9000) $$,
  'service_role günlük metrik yazabilir'
);
select lives_ok(
  $$ insert into public.health_daily (user_id, local_date, hr_avg_bpm)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-05', 70)
     on conflict (user_id, local_date) do update set hr_avg_bpm = excluded.hr_avg_bpm $$,
  'aynı gün ikinci tip kendi sütununu günceller'
);
select is(
  (select hrv_rmssd_ms from public.health_daily where local_date = '2026-01-05'),
  61.5::double precision,
  'başka tipin güncellemesi önceki değeri silmez'
);
select lives_ok(
  $$ insert into public.sleep_sessions (user_id, source_id, local_date, start_time, end_time, minutes_asleep)
     values ('11111111-1111-4111-8111-111111111111', 'uyku-1', '2026-01-05',
             '2026-01-04 22:30+00', '2026-01-05 06:30+00', 450) $$,
  'service_role uyku oturumu yazabilir'
);
select throws_ok(
  $$ insert into public.sleep_sessions (user_id, source_id, local_date, start_time, end_time)
     values ('11111111-1111-4111-8111-111111111111', 'uyku-1', '2026-01-05',
             '2026-01-04 22:30+00', '2026-01-05 06:30+00') $$,
  '23505', null,
  'aynı kaynak kaydı iki kez eklenemez'
);
select lives_ok(
  $$ insert into public.exercise_sessions (user_id, source_id, local_date, start_time, end_time, exercise_type)
     values ('11111111-1111-4111-8111-111111111111', 'egz-1', '2026-01-05',
             '2026-01-05 17:00+00', '2026-01-05 18:30+00', 'SPORT') $$,
  'service_role egzersiz oturumu yazabilir'
);
select lives_ok(
  $$ insert into public.health_sync_status (user_id, state) values ('11111111-1111-4111-8111-111111111111', 'connected') $$,
  'service_role durum satırı yazabilir'
);
select lives_ok(
  $$ insert into public.google_health_tokens (user_id, refresh_token) values ('11111111-1111-4111-8111-111111111111', 'sentetik-token') $$,
  'service_role token yazabilir'
);

-- A oturumu: kendi verisini okur, yazamaz, token'a erişemez.
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.health_daily), 1, 'A kendi günlük metriğini görür');
select is((select state from public.health_sync_status), 'connected', 'A kendi bağlantı durumunu görür');
select throws_ok(
  $$ insert into public.health_daily (user_id, local_date, steps)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-06', 1) $$,
  '42501', null,
  'A cihaz verisini elle ekleyemez'
);
select throws_ok(
  $$ update public.sleep_sessions set minutes_asleep = 600 $$,
  '42501', null,
  'A uyku kaydını değiştiremez'
);
select throws_ok(
  $$ select refresh_token from public.google_health_tokens $$,
  '42501', null,
  'A token tablosunu okuyamaz'
);

-- B oturumu: A'nın verisini göremez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is_empty($$ select id from public.health_daily $$, 'B, A''nın günlük metriklerini göremez');
select is_empty(
  $$ select id from public.sleep_sessions union all select id from public.exercise_sessions $$,
  'B, A''nın uyku ve egzersiz kayıtlarını göremez'
);

-- Anonim istek
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok(
  $$ select id from public.health_daily $$,
  '42501', null,
  'anon günlük metrik tablosunu okuyamaz'
);

select * from finish();
rollback;
