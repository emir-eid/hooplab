-- Koç özetleri (karar 0032): sahibi yalnız okur, yazma yolu yalnız service_role, durum alanları tutarlı.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

-- Yetki haritası
select ok(
  has_table_privilege('authenticated', 'public.coach_summaries', 'select')
  and not has_table_privilege('authenticated', 'public.coach_summaries', 'insert')
  and not has_table_privilege('authenticated', 'public.coach_summaries', 'update')
  and not has_table_privilege('authenticated', 'public.coach_summaries', 'delete'),
  'authenticated coach_summaries üzerinde yalnız SELECT yetkili'
);
select ok(
  has_table_privilege('service_role', 'public.coach_summaries', 'select,insert')
  and not has_table_privilege('service_role', 'public.coach_summaries', 'update')
  and not has_table_privilege('service_role', 'public.coach_summaries', 'delete'),
  'service_role özet ekler ve okur; güncelleme ve silme yok'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

-- coach-daily gibi service_role ile yaz.
set local role service_role;

select lives_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, content, audit, model, usage)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'accepted',
             '{"version": 1, "date": "2026-01-15", "matchDay": false}',
             '[{"type": "text", "text": "Kısa özet."}]', '{"ok": true, "sentences": [], "problems": []}',
             'claude-sonnet-5-5', '{"input_tokens": 1000, "output_tokens": 200}') $$,
  'kabul edilen özet eklenir'
);
select lives_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, content, audit, model)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'rejected',
             '{"version": 1, "date": "2026-01-15", "matchDay": false}',
             '[{"type": "text", "text": "HRV 49 ms."}]', '{"ok": false, "problems": [{"code": "number_uncited"}]}',
             'claude-sonnet-5-5') $$,
  'aynı gün ikinci deneme (reddedilen) ayrı satır olarak eklenir'
);
select lives_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, error)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-15', 'failed',
             '{"version": 1, "date": "2026-01-15", "matchDay": false}', 'credit_exhausted') $$,
  'başarısız deneme hata koduyla eklenir'
);
select throws_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'accepted',
             '{"version": 1}', 'credit_exhausted') $$,
  '23514', null,
  'kabul edilen özet yanıtsız ve denetimsiz olamaz'
);
select throws_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'failed', '{"version": 1}') $$,
  '23514', null,
  'başarısız deneme hata kodsuz olamaz'
);
select throws_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, content, audit, model)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'accepted', '[]', '[]', '{}', 'm') $$,
  '23514', null,
  'anlık değerler nesne olmalı'
);
select throws_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, content, audit, model)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-15', 'shown', '{}', '[]', '{}', 'm') $$,
  '23514', null,
  'bilinmeyen durum reddedilir'
);

-- Sahibi okur; başkasını görmez; yazamaz.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is((select count(*) from public.coach_summaries)::int, 2, 'A yalnız kendi iki özetini görür');
select throws_ok(
  $$ insert into public.coach_summaries (user_id, local_date, status, snapshot, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-16', 'failed', '{}', 'x') $$,
  '42501', null,
  'A özet yazamaz (yalnız Edge Function yazar)'
);
select throws_ok(
  $$ update public.coach_summaries set status = 'accepted' $$,
  '42501', null,
  'A özeti değiştiremez (reddedilen özeti kabul edilmiş yapamaz)'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.coach_summaries)::int, 1, 'B yalnız kendi özetini görür');

reset role;
set local role anon;
select throws_ok($$ select * from public.coach_summaries $$, '42501', null, 'anon coach_summaries tablosunu okuyamaz');

select * from finish();
rollback;
