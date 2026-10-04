-- Sabah check-in, ağrı haritası ve save_morning_checkin. Çalıştırma: npm run test:db (yerel Supabase, Docker).
-- Kullanıcılar sentetik; işlem sonunda geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

-- Genel bekçi: anon public şemadaki hiçbir fonksiyonu çağıramaz.
select is_empty(
  $$ select routine_name from information_schema.role_routine_grants
     where grantee in ('anon', 'PUBLIC') and routine_schema = 'public' $$,
  'anon ve PUBLIC public fonksiyonlarını çalıştıramaz'
);
select ok(
  has_function_privilege('authenticated', 'public.save_morning_checkin(date, smallint, smallint, smallint, smallint, smallint, jsonb)', 'execute'),
  'authenticated save_morning_checkin çalıştırabilir'
);
select is(
  (select prosecdef from pg_proc where proname = 'save_morning_checkin'),
  false,
  'save_morning_checkin SECURITY INVOKER (RLS geçerli)'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

-- A oturumu
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ select public.save_morning_checkin('2026-01-05', 4::smallint, 3::smallint, 2::smallint, 5::smallint, 4::smallint,
       '[{"region": "achilles", "side": "left", "pain": 3}, {"region": "lower_back", "side": "center", "pain": 2}]') $$,
  'A check-in ve ağrı haritası kaydedebilir'
);
select is(
  (select user_id from public.daily_checkins limit 1),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'check-in oturum sahibine yazılır'
);
select is((select count(*)::int from public.pain_reports), 2, 'iki ağrı kaydı yazıldı');

-- Aynı gün yeniden: check-in güncellenir, ağrı haritası yenisiyle değişir.
select lives_ok(
  $$ select public.save_morning_checkin('2026-01-05', 2::smallint, 2::smallint, 2::smallint, 2::smallint, 2::smallint,
       '[{"region": "patellar_tendon", "side": "right", "pain": 5}]') $$,
  'aynı gün yeniden kaydedilebilir'
);
select is((select count(*)::int from public.daily_checkins), 1, 'günde tek check-in satırı');
select is((select sleep_quality::int from public.daily_checkins), 2, 'check-in değerleri güncellendi');
select results_eq(
  $$ select region, side, pain::int from public.pain_reports $$,
  $$ values ('patellar_tendon'::text, 'right'::text, 5) $$,
  'ağrı haritası o günün yeni hali'
);

-- Doğrulama: ölçek dışı ve tutarsız değerler reddedilir; hata olunca hiçbir şey yazılmaz.
select throws_ok(
  $$ select public.save_morning_checkin('2026-01-06', 0::smallint, 3::smallint, 3::smallint, 3::smallint, 3::smallint) $$,
  '23514', null,
  'check-in maddesi 1-5 dışında olamaz'
);
select throws_ok(
  $$ select public.save_morning_checkin('2026-01-06', 3::smallint, 3::smallint, 3::smallint, 3::smallint, 3::smallint,
       '[{"region": "achilles", "side": "left", "pain": 11}]') $$,
  '23514', null,
  'ağrı 0-10 dışında olamaz'
);
select is((select count(*)::int from public.daily_checkins where local_date = '2026-01-06'), 0,
  'ağrı hatası check-in''i de geri aldı (tek işlem)');
select throws_ok(
  $$ insert into public.pain_reports (local_date, region, side, pain) values ('2026-01-06', 'lower_back', 'left', 2) $$,
  '23514', null,
  'bel yalnız orta hat (center)'
);
select throws_ok(
  $$ insert into public.pain_reports (local_date, region, side, pain) values ('2026-01-06', 'achilles', 'center', 2) $$,
  '23514', null,
  'Aşil sol veya sağ olmalı'
);
select throws_ok(
  $$ insert into public.pain_reports (local_date, region, side, pain) values ('2026-01-06', 'knee', 'left', 2) $$,
  '23514', null,
  'bilinmeyen bölge reddedilir'
);
select throws_ok(
  $$ select public.save_morning_checkin('2026-01-06', 3::smallint, 3::smallint, 3::smallint, 3::smallint, 3::smallint, '{}') $$,
  '22023', null,
  'ağrı haritası dizi olmalı'
);
select throws_ok(
  $$ insert into public.daily_checkins (user_id, local_date, sleep_quality, fatigue, soreness, stress, mood)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-07', 3, 3, 3, 3, 3) $$,
  '42501', null,
  'A, B adına check-in ekleyemez'
);

-- B oturumu: A'nın satırlarını göremez; kendi check-in'i A'nınkini ezmez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is_empty($$ select id from public.daily_checkins $$, 'B, A''nın check-in''lerini göremez');
select is_empty($$ select id from public.pain_reports $$, 'B, A''nın ağrı haritasını göremez');
select lives_ok(
  $$ select public.save_morning_checkin('2026-01-05', 5::smallint, 5::smallint, 5::smallint, 5::smallint, 5::smallint) $$,
  'B aynı tarihe kendi check-in''ini kaydedebilir'
);

-- A'ya dön: A'nın kaydı ve ağrı haritası yerinde.
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select results_eq(
  $$ select c.sleep_quality::int, (select count(*)::int from public.pain_reports)
     from public.daily_checkins c where local_date = '2026-01-05' $$,
  $$ values (2, 1) $$,
  'B''nin kaydı A''nın check-in''ine ve ağrı haritasına dokunmadı'
);

select * from finish();
rollback;
