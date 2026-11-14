-- iPhone uygulaması bildirimleri (karar 0060): cihaz token'ı tek sahip RLS; gönderim fişleri yalnız service_role.
-- Çalıştırma: npm run test:db. Veriler sentetik, geri alınır.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.push_devices (token) values ('ExponentPushToken[sentetik-a1]') $$,
  'A cihaz token''ı ekleyebilir'
);
select lives_ok(
  $$ insert into public.push_devices (token) values ('ExponentPushToken[sentetik-a1]')
     on conflict (token) do update set last_success_at = null $$,
  'aynı token yeniden kaydedilince satır çoğalmaz (upsert)'
);
select throws_ok(
  $$ insert into public.push_devices (token) values ('https://push.example.test/a2') $$,
  '23514', null,
  'Expo token biçiminde olmayan değer reddedilir'
);
select throws_ok(
  $$ insert into public.push_devices (user_id, token) values ('22222222-2222-4222-8222-222222222222', 'ExponentPushToken[sentetik-b1]') $$,
  '42501', null,
  'A, B adına cihaz ekleyemez'
);
select throws_ok($$ select * from public.push_tickets $$, '42501', null, 'kullanıcı gönderim fişlerini okuyamaz');

set local request.jwt.claims to '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is((select count(*) from public.push_devices)::int, 0, 'B, A''nın cihazını görmez');
delete from public.push_devices;

reset role;
set local role service_role;
select is((select count(*) from public.push_devices)::int, 1, 'B''nin silmesi A''nın cihazına dokunmaz');
select lives_ok(
  $$ insert into public.push_tickets (device_id, ticket_id)
     select id, 'sentetik-fis-1' from public.push_devices where token = 'ExponentPushToken[sentetik-a1]' $$,
  'gönderim fonksiyonu fiş yazabilir'
);
delete from public.push_devices where token = 'ExponentPushToken[sentetik-a1]';
select is((select count(*) from public.push_tickets)::int, 0, 'cihaz silinince fişleri de silinir');

reset role;
select ok(
  not has_table_privilege('anon', 'public.push_devices', 'select')
  and not has_table_privilege('anon', 'public.push_tickets', 'select'),
  'girişsiz rol cihazları ve fişleri okuyamaz'
);

select * from finish();
rollback;
