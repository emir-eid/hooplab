-- PWA bildirimleri, Web Push (karar 0058). Tek sahip deseni karar 0015'teki gibi.
--
--   * push_subscriptions: tarayıcının (ana ekrandaki PWA) bildirim aboneliği: push servisinin adresi ve
--     şifreleme anahtarları. Sağlık verisi yok.
--   * notification_prefs: hangi hatırlatma, hangi saatte, hangi saat diliminde. iPhone uygulamasında tercih
--     telefonda kalır (karar 0045); PWA'da sunucu göndereceği için burada da durur.
--   * push_log: gönderilen her hatırlatmanın anahtarı; aynı hatırlatma iki kez gitmez. Yalnız Edge Functions.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null check (endpoint like 'https://%' and length(endpoint) <= 2048),
  p256dh text not null check (length(p256dh) between 1 and 200),
  auth text not null check (length(auth) between 1 and 100),
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

comment on table public.push_subscriptions is
  'PWA bildirim abonelikleri (karar 0058): push servisinin adresi ve tarayıcının şifreleme anahtarları.';

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table public.notification_prefs (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  time_zone text not null check (length(time_zone) between 1 and 64),
  checkin_enabled boolean not null default false,
  checkin_time time not null default '08:30',
  match_enabled boolean not null default false,
  match_time time not null default '09:00',
  reconnect_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.notification_prefs is
  'PWA hatırlatma tercihleri (karar 0058): sunucu bu saatlere ve saat dilimine göre gönderir.';

create table public.push_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- `= any (array[...])` biçimi bilerek: rules-sync testi "kind in" biçimli CHECK'i seans türleri sanar.
  kind text not null check (kind = any (array['checkin', 'match', 'reconnect'])),
  key text not null check (length(key) between 1 and 64),
  sent_at timestamptz not null default now(),
  constraint push_log_once unique (user_id, kind, key)
);

comment on table public.push_log is
  'Gönderilen hatırlatmalar (karar 0058): tür ve anahtar (ör. yerel gün); aynı hatırlatma bir kez gider.';

alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.push_log enable row level security;

revoke all on table public.push_subscriptions, public.notification_prefs, public.push_log from anon;
revoke all on table public.push_log from authenticated;
grant select, insert, update, delete on table public.push_subscriptions, public.notification_prefs to authenticated;
grant select, insert, update, delete on table public.push_subscriptions, public.notification_prefs, public.push_log
to service_role;

create policy "sahibi okur" on public.push_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.push_subscriptions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.push_subscriptions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.push_subscriptions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi okur" on public.notification_prefs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.notification_prefs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.notification_prefs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.notification_prefs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- push_log'da politika yok: yalnız service_role (Edge Functions) okur ve yazar.

-- Gönderim fonksiyonu o günün check-in'i ve maçı var mı diye okur (yalnız okuma; yazma yetkisi verilmez).
grant select on table public.daily_checkins, public.match_days to service_role;

-- Zamanlayıcı: 15 dakikada bir gönderim fonksiyonunu çağırır (check-in saati 15 dakikalık adımla seçilir).
-- Adres ve paylaşılan sır senkronla aynı Vault kayıtları; sır yalnız tetiklemeye yarar. Sırlar yoksa hiçbir şey yapmaz.
create function private.trigger_push_dispatch()
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'ghealth_cron_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;
  return net.http_post(
    url := v_url || '/functions/v1/push-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hooplab-cron', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

comment on function private.trigger_push_dispatch is
  '15 dakikalık zamanlayıcının çağırdığı tetikleyici: Vault''taki adres ve sırla push-dispatch fonksiyonunu çağırır.';

revoke all on function private.trigger_push_dispatch() from public;

select cron.schedule(
  'pwa-bildirim-gonderimi',
  '1,16,31,46 * * * *',
  $$ select private.trigger_push_dispatch() $$
);
