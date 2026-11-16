-- Döngü günleri (karar 0061 sıra 5): yalnız döngü takibi açık Apple profiline yazılır, kullanıcı yalnız okur,
-- takip kapanınca satırlar silinir, iki kullanıcı birbirini görmez, sahibinin profilinde satır olamaz.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

select has_table('public', 'cycle_days', 'cycle_days tablosu var');
select ok(
  has_table_privilege('authenticated', 'public.cycle_days', 'select')
  and not has_table_privilege('authenticated', 'public.cycle_days', 'insert')
  and not has_table_privilege('authenticated', 'public.cycle_days', 'update')
  and not has_table_privilege('authenticated', 'public.cycle_days', 'delete')
  and not has_table_privilege('anon', 'public.cycle_days', 'select'),
  'kullanıcı yalnız okur; yazan healthkit-ingest (service_role)'
);

-- A: sahibi gibi (varsayılan profil). B: davetli (Apple · fitness · kadın · döngü takibi). C: Apple, döngü kapalı.
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local'),
  ('33333333-3333-4333-8333-333333333333', 'c@test.local');

set local role service_role;
update public.profiles set data_source = 'apple_health', sport = 'fitness'
  where user_id in ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333');
update public.profiles set sex = 'kadin', cycle_tracking = true, hormonal_contraception = 'yok'
  where user_id = '22222222-2222-4222-8222-222222222222';
update public.profiles set sex = 'kadin', cycle_tracking = false
  where user_id = '33333333-3333-4333-8333-333333333333';

select lives_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day, phase)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-01', 24, 'adet_oncesi'),
            ('22222222-2222-4222-8222-222222222222', '2026-01-02', 25, 'adet_oncesi')
     on conflict (user_id, local_date) do update
       set cycle_day = excluded.cycle_day, phase = excluded.phase, irregular = excluded.irregular $$,
  'döngü takibi açık Apple profiline yazılır'
);
select lives_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day, phase, irregular)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-03', 40, null, true) $$,
  'düzensiz gün evresiz yazılır'
);
select throws_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day, phase)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-01', 3, 'adet') $$,
  '23514', null,
  'sahibinin profiline (Google, cinsiyet boş) döngü satırı yazılamaz'
);
select throws_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day, phase)
     values ('33333333-3333-4333-8333-333333333333', '2026-01-01', 3, 'adet') $$,
  '23514', null,
  'döngü takibi kapalı Apple profiline yazılamaz'
);
select throws_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day, phase, irregular)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-04', 41, 'luteal', true) $$,
  '23514', null,
  'düzensiz günde evre olamaz'
);
select throws_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day, phase)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-05', 5, 'yumurtlama') $$,
  '23514', null,
  'bilinmeyen evre reddedilir'
);
select throws_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-06', 0) $$,
  '23514', null,
  'döngü günü 1''den küçük olamaz'
);

-- A'nın oturumu: B'nin döngü satırları görünmez; A yazamaz.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is((select count(*)::int from public.cycle_days), 0, 'A, B''nin döngü satırlarını görmez');
select throws_ok(
  $$ insert into public.cycle_days (user_id, local_date, cycle_day)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-01', 3) $$,
  '42501', null,
  'kullanıcı döngü satırı yazamaz'
);

-- B'nin oturumu: kendi satırlarını okur, silemez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select results_eq(
  $$ select cycle_day::int, phase, irregular from public.cycle_days order by local_date $$,
  $$ values (24, 'adet_oncesi', false), (25, 'adet_oncesi', false), (40, null, true) $$,
  'B kendi döngü satırlarını okur'
);
select throws_ok(
  $$ delete from public.cycle_days $$,
  '42501', null,
  'kullanıcı döngü satırını doğrudan silemez'
);

-- B döngü takibini kapatır (Ben → Profil): satırların hepsi silinir.
update public.profiles set cycle_tracking = false, hormonal_contraception = null
  where user_id = '22222222-2222-4222-8222-222222222222';
reset role;
select is(
  (select count(*)::int from public.cycle_days where user_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'döngü takibi kapanınca B''nin döngü satırları silinir'
);

-- Cinsiyet değişince de silinir (takip yeniden açılıp satır yazıldıktan sonra).
set local role service_role;
update public.profiles set cycle_tracking = true where user_id = '22222222-2222-4222-8222-222222222222';
insert into public.cycle_days (user_id, local_date, cycle_day, phase)
  values ('22222222-2222-4222-8222-222222222222', '2026-01-01', 24, 'adet_oncesi');
update public.profiles set sex = 'erkek', cycle_tracking = false where user_id = '22222222-2222-4222-8222-222222222222';
select is(
  (select count(*)::int from public.cycle_days where user_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'cinsiyet değişince döngü satırları silinir'
);
select results_eq(
  $$ select data_source, sex from public.profiles where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values ('google_health'::text, null::text) $$,
  'sahibinin profili dokunulmamış'
);

select * from finish();
rollback;
