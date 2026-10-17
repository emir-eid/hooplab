-- Koçun haftalık yorumu (karar 0052): sahibi yalnız okur, yazma yolu yalnız service_role, hafta pazartesi başlar.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

select ok(
  has_table_privilege('authenticated', 'public.coach_weekly_summaries', 'select')
  and not has_table_privilege('authenticated', 'public.coach_weekly_summaries', 'insert')
  and not has_table_privilege('authenticated', 'public.coach_weekly_summaries', 'update')
  and not has_table_privilege('authenticated', 'public.coach_weekly_summaries', 'delete'),
  'authenticated coach_weekly_summaries üzerinde yalnız SELECT yetkili'
);
select ok(
  has_table_privilege('service_role', 'public.coach_weekly_summaries', 'select,insert')
  and not has_table_privilege('service_role', 'public.coach_weekly_summaries', 'update')
  and not has_table_privilege('service_role', 'public.coach_weekly_summaries', 'delete'),
  'service_role yorum ekler ve okur; güncelleme ve silme yok'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role service_role;

select lives_ok(
  $$ insert into public.coach_weekly_summaries (user_id, week_start, status, snapshot, content, audit, model)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-12', 'accepted', '{"version": 1, "weekStart": "2026-01-12"}',
             '[{"type": "text", "text": "Kısa yorum."}]', '{"ok": true, "sentences": [], "problems": []}', 'claude-sonnet-5-5') $$,
  'kabul edilen yorum eklenir'
);
select lives_ok(
  $$ insert into public.coach_weekly_summaries (user_id, week_start, status, snapshot, error)
     values ('22222222-2222-4222-8222-222222222222', '2026-01-12', 'failed', '{"version": 1}', 'anthropic_529') $$,
  'başarısız deneme hata koduyla eklenir'
);
select throws_ok(
  $$ insert into public.coach_weekly_summaries (user_id, week_start, status, snapshot, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-14', 'failed', '{"version": 1}', 'x') $$,
  '23514', null,
  'hafta pazartesi başlamalı'
);
select throws_ok(
  $$ insert into public.coach_weekly_summaries (user_id, week_start, status, snapshot, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-12', 'accepted', '{"version": 1}', 'x') $$,
  '23514', null,
  'kabul edilen yorum yanıtsız ve denetimsiz olamaz'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is((select count(*) from public.coach_weekly_summaries)::int, 1, 'A yalnız kendi yorumunu görür');
select throws_ok(
  $$ insert into public.coach_weekly_summaries (user_id, week_start, status, snapshot, error)
     values ('11111111-1111-4111-8111-111111111111', '2026-01-19', 'failed', '{}', 'x') $$,
  '42501', null,
  'A yorum yazamaz (yalnız Edge Function yazar)'
);
select throws_ok($$ update public.coach_weekly_summaries set status = 'rejected' $$, '42501', null, 'A yorumu değiştiremez');

reset role;
set local role anon;
select throws_ok($$ select * from public.coach_weekly_summaries $$, '42501', null, 'anon tabloyu okuyamaz');

select * from finish();
rollback;
