-- Seans etiketleme (karar 0020): seans kaydı yalnız sahibinin saat oturumuna bağlanır; sahibi saat
-- oturumunda yalnız "Seans değil" işaretini değiştirebilir. Çalıştırma: npm run test:db. Veriler sentetik.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- Yetki haritası: egzersiz tablosunda tablo düzeyinde yazma yok, yalnız dismissed_at sütunu.
select ok(
  not has_table_privilege('authenticated', 'public.exercise_sessions', 'insert,update,delete'),
  'authenticated egzersiz tablosuna tablo düzeyinde yazamaz'
);
select ok(
  has_column_privilege('authenticated', 'public.exercise_sessions', 'dismissed_at', 'update'),
  'authenticated yalnız dismissed_at sütununu güncelleyebilir'
);
select ok(
  not has_column_privilege('authenticated', 'public.exercise_sessions', 'exercise_type', 'update')
  and not has_column_privilege('authenticated', 'public.exercise_sessions', 'start_time', 'update')
  and not has_column_privilege('authenticated', 'public.exercise_sessions', 'user_id', 'update'),
  'senkronun yazdığı sütunlar authenticated için kapalı'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

-- Senkronun yazdığı oturumlar (service_role yerine test sahibi ekler; RLS dışı).
insert into public.exercise_sessions (id, user_id, source_id, local_date, start_time, end_time, exercise_type) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'a-1', '2026-01-05',
   '2026-01-05 17:00+00', '2026-01-05 18:30+00', 'SPORT'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'a-2', '2026-01-05',
   '2026-01-05 08:00+00', '2026-01-05 08:30+00', 'WALKING'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'b-1', '2026-01-05',
   '2026-01-05 17:00+00', '2026-01-05 18:30+00', 'SPORT');

-- A oturumu
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, exercise_session_id)
     values ('2026-01-05', 'team_practice', 90, 7, 'aaaaaaaa-0000-4000-8000-000000000001') $$,
  'A seansını kendi saat oturumuna bağlayabilir'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, exercise_session_id)
     values ('2026-01-05', 'shooting', 30, 4, 'aaaaaaaa-0000-4000-8000-000000000001') $$,
  '23505', null,
  'bir saat oturumu iki seans kaydına bağlanamaz'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, exercise_session_id)
     values ('2026-01-05', 'game', 90, 8, 'bbbbbbbb-0000-4000-8000-000000000001') $$,
  '23503', null,
  'A, B''nin saat oturumuna bağlanamaz'
);
select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe)
     values ('2026-01-05', 'mobility', 45, 2) $$,
  'mobilite / yoga türü kabul edilir'
);
select throws_ok(
  $$ update public.training_sessions set exercise_session_id = 'bbbbbbbb-0000-4000-8000-000000000001'
     where kind = 'mobility' $$,
  '23503', null,
  'A var olan kaydını B''nin saat oturumuna bağlayamaz'
);
select isnt_empty(
  $$ update public.exercise_sessions set dismissed_at = now()
     where id = 'aaaaaaaa-0000-4000-8000-000000000002' returning id $$,
  'A kendi saat oturumunu "Seans değil" diye işaretleyebilir'
);
select throws_ok(
  $$ update public.exercise_sessions set exercise_type = 'BASKETBALL' $$,
  '42501', null,
  'A saat oturumunun türünü değiştiremez'
);
select throws_ok(
  $$ update public.exercise_sessions set user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null,
  'A saat oturumunu başkasına devredemez'
);
select throws_ok(
  $$ delete from public.exercise_sessions $$,
  '42501', null,
  'A saat oturumunu silemez'
);
select is_empty(
  $$ update public.exercise_sessions set dismissed_at = now()
     where id = 'bbbbbbbb-0000-4000-8000-000000000001' returning id $$,
  'A, B''nin saat oturumunu işaretleyemez'
);

-- B oturumu: A'nın bağlantısını ve işaretini değiştiremez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is_empty(
  $$ update public.exercise_sessions set dismissed_at = null
     where id = 'aaaaaaaa-0000-4000-8000-000000000002' returning id $$,
  'B, A''nın "Seans değil" işaretini kaldıramaz'
);

-- Sahip rolüne dön: sonuçları RLS dışından denetle.
reset role;

select is(
  (select dismissed_at is not null from public.exercise_sessions where id = 'aaaaaaaa-0000-4000-8000-000000000002'),
  true,
  'A''nın "Seans değil" işareti B''nin denemesinden sonra yerinde'
);
select is(
  (select dismissed_at from public.exercise_sessions where id = 'bbbbbbbb-0000-4000-8000-000000000001'),
  null,
  'B''nin oturumu A''nın denemesinden etkilenmedi'
);

-- Saat oturumu silinirse (ör. kaynakta kaldırıldı) seans kaydı kalır, bağlantı boşalır.
delete from public.exercise_sessions where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(
  (select exercise_session_id from public.training_sessions where kind = 'team_practice'),
  null,
  'saat oturumu silinince seans kaydı kalır, bağlantı boşalır'
);

select * from finish();
rollback;
