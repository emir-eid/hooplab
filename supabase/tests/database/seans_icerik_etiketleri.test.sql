-- Seans içerik etiketleri (karar 0027): yalnız bilinen etiketler; null (girilmemiş) ve boş dizi ayrı.
-- Sahibi kendi seansının etiketlerini güncelleyebilir, başkasınınkini göremez. Çalıştırma: npm run test:db.
-- Veriler sentetik; işlem sonunda geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, content_tags)
     values ('2026-01-05', 'game', 95, 8, array['jump', 'cod', 'sprint']) $$,
  'bilinen etiketlerle seans eklenir'
);
select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, content_tags)
     values ('2026-01-05', 'mobility', 30, 2, '{}') $$,
  'boş etiket dizisi kabul edilir ("bu içeriklerin hiçbiri yoktu")'
);
select lives_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe)
     values ('2026-01-04', 'strength', 60, 6) $$,
  'etiketsiz seans kabul edilir'
);
select is(
  (select count(*)::int from public.training_sessions where content_tags is null),
  1,
  'etiket girilmeyen seansta sütun null kalır (boş diziye çevrilmez)'
);
select throws_ok(
  $$ insert into public.training_sessions (local_date, kind, duration_min, rpe, content_tags)
     values ('2026-01-05', 'game', 60, 7, array['jump', 'contact']) $$,
  '23514', null,
  'bilinmeyen etiket reddedilir'
);
select isnt_empty(
  $$ update public.training_sessions set content_tags = array['lower_strength', 'upper_strength']
     where kind = 'strength' returning id $$,
  'A kendi seansının etiketlerini güncelleyebilir'
);

-- B oturumu: A'nın etiketlerini göremez ve değiştiremez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is_empty($$ select content_tags from public.training_sessions $$, 'B, A''nın seans etiketlerini göremez');
select is_empty(
  $$ update public.training_sessions set content_tags = '{}' returning id $$,
  'B, A''nın seans etiketlerini değiştiremez'
);

select * from finish();
rollback;
