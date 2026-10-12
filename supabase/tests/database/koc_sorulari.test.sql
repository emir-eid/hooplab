-- Koçta soru-cevap (karar 0037): sahibi yalnız okur, yazma yolu yalnız service_role, durum alanları tutarlı.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

-- Yetki haritası
select ok(
  has_table_privilege('authenticated', 'public.coach_messages', 'select')
  and not has_table_privilege('authenticated', 'public.coach_messages', 'insert')
  and not has_table_privilege('authenticated', 'public.coach_messages', 'update')
  and not has_table_privilege('authenticated', 'public.coach_messages', 'delete'),
  'authenticated coach_messages üzerinde yalnız SELECT yetkili'
);
select ok(
  has_table_privilege('service_role', 'public.coach_messages', 'select,insert')
  and not has_table_privilege('service_role', 'public.coach_messages', 'update')
  and not has_table_privilege('service_role', 'public.coach_messages', 'delete'),
  'service_role soru ekler ve okur; güncelleme ve silme yok'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

-- coach-ask gibi service_role ile yaz.
set local role service_role;

select lives_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, category, status, content, audit, answer, model, usage, classifier_usage)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Maçtan önce ne yemeliyim?', 'in_scope', 'answered',
             '[{"type": "text", "text": "Kısa yanıt."}]', '{"ok": true, "sentences": [], "problems": []}',
             '{"status": "answered", "category": "in_scope", "sentences": [], "omitted": 0, "withNumbers": false}',
             'claude-sonnet-5-5', '{"input_tokens": 1000}', '{"input_tokens": 200}') $$,
  'yanıtlanan soru eklenir'
);
select lives_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, category, status, answer, classifier_usage)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Sentetik tıbbi soru', 'medical_red_flag', 'routed',
             '{"status": "routed", "category": "medical_red_flag"}', '{"input_tokens": 200}') $$,
  'yönlendirilen soru modelsiz eklenir'
);
select lives_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, status, answer, error)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-15', 'Sentetik soru', 'failed',
             '{"status": "failed", "category": null, "error": "anthropic_529"}', 'anthropic_529') $$,
  'başarısız soru hata koduyla eklenir'
);
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, category, status, answer)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Sentetik soru', 'in_scope', 'answered',
             '{"status": "answered"}') $$,
  '23514', null,
  'yanıtlanan soru yanıtsız ve denetimsiz olamaz'
);
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, category, status, answer)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Sentetik soru', 'in_scope', 'routed',
             '{"status": "routed"}') $$,
  '23514', null,
  'kapsamdaki soru yönlendirilemez (yalnız tıbbi ve kapsam dışı)'
);
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, status, answer)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Sentetik soru', 'failed', '{"status": "failed"}') $$,
  '23514', null,
  'başarısız soru hata kodsuz olamaz'
);
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, category, status, answer, classifier_usage)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Sentetik soru', 'out_of_scope', 'routed',
             '{"status": "answered"}', '{}') $$,
  '23514', null,
  'saklanan yanıtın durumu satırın durumuyla aynı olmalı'
);
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, status, answer, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'ab', 'failed', '{"status": "failed"}', 'x') $$,
  '23514', null,
  'soru en az 3 karakter'
);
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, category, status, answer, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'Sentetik soru', 'tactics', 'failed', '{"status": "failed"}', 'x') $$,
  '23514', null,
  'bilinmeyen sınıf reddedilir'
);

-- Sahibi okur; başkasını görmez; yazamaz.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is((select count(*) from public.coach_messages)::int, 2, 'A yalnız kendi iki sorusunu görür');
select throws_ok(
  $$ insert into public.coach_messages (user_id, local_date, question, status, answer, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-16', 'Sentetik soru', 'failed', '{"status": "failed"}', 'x') $$,
  '42501', null,
  'A soru yazamaz (yalnız Edge Function yazar)'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.coach_messages)::int, 1, 'B yalnız kendi sorusunu görür');

reset role;
set local role anon;
select throws_ok($$ select * from public.coach_messages $$, '42501', null, 'anon coach_messages tablosunu okuyamaz');

select * from finish();
rollback;
