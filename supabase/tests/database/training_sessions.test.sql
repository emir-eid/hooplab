-- Tek sahip RLS ve seans tablosu kuralları. Çalıştırma: npm run test:db (yerel Supabase, Docker).
-- Kullanıcılar sentetik; işlem sonunda geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- Genel bekçiler: public şemadaki her tabloda RLS açık, anon hiçbir tabloda yetkili değil.
select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'public şemasındaki her tabloda RLS açık'
);
select is_empty(
  $$ select table_name from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' $$,
  'anon rolünün public tablolarında hiçbir yetkisi yok'
);
select is_empty(
  $$ select polname from pg_policy p join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not (p.polroles @> array[(select oid from pg_roles where rolname = 'authenticated')]) $$,
  'her politika yalnız authenticated rolüne yazılmış'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

-- A oturumu
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, minutes_played)
     values ('2026-01-05', 'game', 95, 8, 31) $$,
  'A seans ekleyebilir'
);
select is(
  (select user_id from public.training_sessions limit 1),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'user_id varsayılan olarak oturum sahibine yazılır'
);
select throws_ok(
  $$ insert into public.training_sessions (user_id, local_date, kind, duration_min, rpe)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-05', 'strength', 45, 6) $$,
  '42501', null,
  'A, B adına kayıt ekleyemez'
);
select throws_ok(
  $$ update public.training_sessions set user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null,
  'A kendi satırını B''ye devredemez'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, minutes_played)
     values ('2026-01-05', 'strength', 45, 6, 10) $$,
  '23514', null,
  'oynanan dakika yalnız maçta girilir'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe)
     values ('2026-01-05', 'game', 60, 11) $$,
  '23514', null,
  'RPE 0-10 dışında olamaz'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe)
     values ('2026-01-05', 'yoga', 60, 5) $$,
  '23514', null,
  'bilinmeyen seans türü reddedilir'
);

-- B oturumu: A'nın satırını göremez, değiştiremez, silemez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is_empty($$ select id from public.training_sessions $$, 'B, A''nın seanslarını göremez');
select is_empty($$ update public.training_sessions set rpe = 1 returning id $$, 'B, A''nın seansını güncelleyemez');
select is_empty($$ delete from public.training_sessions returning id $$, 'B, A''nın seansını silemez');

-- Anonim istek: tabloya hiç erişemez.
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok(
  $$ select id from public.training_sessions $$,
  '42501', null,
  'anon seans tablosunu okuyamaz'
);

-- A'ya dön: satır duruyor, güncelleme updated_at'i ilerletir.
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.training_sessions where rpe = 8), 1, 'A''nın satırı B''nin denemelerinden sonra değişmedi');
select isnt_empty(
  $$ update public.training_sessions set rpe = 7, updated_at = '2000-01-01' returning id $$,
  'A kendi seansını güncelleyebilir'
);
select ok(
  (select updated_at > '2000-01-01' from public.training_sessions limit 1),
  'updated_at tetikleyiciyle güncellenir'
);

select * from finish();
rollback;
