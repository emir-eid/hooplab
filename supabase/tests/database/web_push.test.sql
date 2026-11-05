-- PWA bildirimleri (karar 0058): abonelik ve tercih tek sahip RLS; gönderim günlüğü yalnız service_role;
-- zamanlayıcı ve tetikleyici. Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.push_subscriptions (endpoint, p256dh, auth) values ('https://push.example.test/a1', 'BKey', 'auth') $$,
  'A abonelik ekleyebilir'
);
select throws_ok(
  $$ insert into public.push_subscriptions (endpoint, p256dh, auth) values ('http://push.example.test/a2', 'BKey', 'auth') $$,
  '23514', null,
  'https olmayan adres reddedilir'
);
select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ('22222222-2222-4222-8222-222222222222', 'https://push.example.test/b1', 'BKey', 'auth') $$,
  '42501', null,
  'A, B adına abonelik ekleyemez'
);
select lives_ok(
  $$ insert into public.notification_prefs (time_zone, checkin_enabled, checkin_time) values ('Europe/Istanbul', true, '07:45') $$,
  'A tercihini yazabilir'
);
select lives_ok(
  $$ insert into public.notification_prefs (time_zone, match_enabled) values ('Europe/Istanbul', true)
     on conflict (user_id) do update set match_enabled = excluded.match_enabled $$,
  'A tercihini güncelleyebilir (upsert)'
);
select throws_ok(
  $$ update public.notification_prefs set user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null,
  'tercihin sahibi devredilemez'
);
select throws_ok($$ select * from public.push_log $$, '42501', null, 'kullanıcı gönderim günlüğünü okuyamaz');
select throws_ok(
  $$ insert into public.push_log (user_id, kind, key) values ('11111111-1111-4111-8111-111111111111', 'checkin', '2026-01-01') $$,
  '42501', null,
  'kullanıcı gönderim günlüğüne yazamaz'
);

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is(
  (select count(*) from public.push_subscriptions)::int + (select count(*) from public.notification_prefs)::int,
  0,
  'B, A''nın aboneliğini ve tercihini görmez'
);
delete from public.push_subscriptions;

reset role;
set local role service_role;
select is((select count(*) from public.push_subscriptions)::int, 1, 'B''nin silmesi A''nın aboneliğine dokunmaz');
insert into public.push_log (user_id, kind, key) values ('11111111-1111-4111-8111-111111111111', 'checkin', '2026-01-01');
select throws_ok(
  $$ insert into public.push_log (user_id, kind, key) values ('11111111-1111-4111-8111-111111111111', 'checkin', '2026-01-01') $$,
  '23505', null,
  'aynı hatırlatma iki kez kaydedilemez'
);

select lives_ok(
  $$ select count(*) from public.daily_checkins union all select count(*) from public.match_days $$,
  'gönderim fonksiyonu check-in ve maç günlerini okuyabilir'
);

reset role;
select is(
  (select schedule from cron.job where jobname = 'pwa-bildirim-gonderimi'),
  '1,16,31,46 * * * *',
  'gönderim 15 dakikada bir zamanlanır'
);
delete from vault.secrets where name in ('project_url', 'ghealth_cron_secret');
select is(private.trigger_push_dispatch(), null, 'Vault''ta adres ve sır yoksa tetikleyici hiçbir şey yapmaz');
select ok(
  not has_function_privilege('authenticated', 'private.trigger_push_dispatch()', 'execute')
  and not has_function_privilege('anon', 'private.trigger_push_dispatch()', 'execute'),
  'tetikleyiciyi kullanıcılar çağıramaz'
);

select * from finish();
rollback;
