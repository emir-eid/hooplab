-- Öğün kaydı (karar 0030): tek sahip RLS, öğün adı ve kalem biçimi. Çalıştırma: npm run test:db.
-- Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.meals (local_date, slot, items)
     values ('2026-01-05', 'lunch', '[{"food": "pilav-pirinc", "portions": 1.5}, {"food": "tavuk-gogsu", "portions": 2}]') $$,
  'A listeden öğün ekleyebilir'
);
select lives_ok(
  $$ insert into public.meals (local_date, slot, items)
     values ('2026-01-05', 'snack', '[{"label": "Protein bar", "carbs_g": 22, "protein_g": 20}, {"label": null, "carbs_g": 0, "protein_g": 5}]') $$,
  'A etiketten öğün ekleyebilir (ad isteğe bağlı)'
);
select lives_ok(
  $$ insert into public.meals (local_date, slot, items)
     values ('2026-01-05', 'snack', '[{"food": "muz", "portions": 1}]') $$,
  'aynı gün aynı öğün adı birden çok kez olabilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'brunch', '[{"food": "muz", "portions": 1}]') $$,
  '23514', null,
  'bilinmeyen öğün adı reddedilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'lunch', '[]') $$,
  '23514', null,
  'boş öğün reddedilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'lunch', '[{"food": "muz", "portions": 4}]') $$,
  '23514', null,
  'listede olmayan çarpan reddedilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'lunch', '[{"food": "muz", "portions": 1, "kcal": 105}]') $$,
  '23514', null,
  'fazladan alan (ör. kalori) reddedilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'lunch', '[{"label": "x", "carbs_g": 301, "protein_g": 0}]') $$,
  '23514', null,
  'elle gram giriş aralığı dışında reddedilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'lunch', '[{"label": null, "carbs_g": 0, "protein_g": 0}]') $$,
  '23514', null,
  'iki değeri de sıfır kalem reddedilir'
);
select throws_ok(
  $$ insert into public.meals (local_date, slot, items) values ('2026-01-05', 'lunch', '{"food": "muz", "portions": 1}') $$,
  '23514', null,
  'dizi olmayan items reddedilir'
);
select throws_ok(
  $$ insert into public.meals (user_id, local_date, slot, items)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-05', 'lunch', '[{"food": "muz", "portions": 1}]') $$,
  '42501', null,
  'A, B adına öğün ekleyemez'
);

-- B, A'nın öğünlerini göremez ve değiştiremez.
set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.meals)::int, 0, 'B, A''nın öğünlerini görmez');
update public.meals set slot = 'dinner';
delete from public.meals;

set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is((select count(*) from public.meals where slot <> 'dinner')::int, 3, 'B''nin güncelleme ve silmesi A''ya dokunmaz');

-- anon hiçbir şey göremez.
reset role;
set local role anon;
select throws_ok($$ select * from public.meals $$, '42501', null, 'anon meals tablosunu okuyamaz');

select * from finish();
rollback;
