-- iPhone uygulaması (TestFlight) bildirimleri, Expo push servisi (karar 0060). Tek sahip deseni karar 0015'teki gibi.
--
--   * push_devices: iPhone uygulamasının Expo push token'ı. Kayıtlı ve geçerli bir cihaz varsa hatırlatma yalnız
--     ona gider; PWA aboneliği (push_subscriptions, karar 0058) yalnız native cihaz yokken ya da ona ulaşılamazken
--     kullanılır. Sağlık verisi yok.
--   * push_tickets: Expo'nun gönderim fişleri. Expo teslim sonucunu (makbuz) ~15 dakika sonra verir; uygulama
--     silinmişse (DeviceNotRegistered) cihaz kaydı silinir ve PWA yeniden hatırlatma almaya başlar. Yalnız Edge Functions.

create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token text not null check (token ~ '^Expo(nent)?PushToken\[[^\]]{1,180}\]$'),
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  constraint push_devices_token_key unique (token)
);

comment on table public.push_devices is
  'iPhone uygulamasının Expo push token''ı (karar 0060). Kayıtlı cihaz varsa hatırlatmalar PWA yerine ona gider.';

create index push_devices_user_idx on public.push_devices (user_id);

create table public.push_tickets (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.push_devices (id) on delete cascade,
  ticket_id text not null check (length(ticket_id) between 1 and 100),
  created_at timestamptz not null default now()
);

comment on table public.push_tickets is
  'Expo gönderim fişleri (karar 0060): makbuz denetimi için; 24 saatten eskisi silinir.';

create index push_tickets_created_idx on public.push_tickets (created_at);

alter table public.push_devices enable row level security;
alter table public.push_tickets enable row level security;

revoke all on table public.push_devices, public.push_tickets from anon;
revoke all on table public.push_tickets from authenticated;
grant select, insert, update, delete on table public.push_devices to authenticated;
grant select, insert, update, delete on table public.push_devices, public.push_tickets to service_role;

create policy "sahibi okur" on public.push_devices
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.push_devices
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.push_devices
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.push_devices
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- push_tickets'ta politika yok: yalnız service_role (Edge Functions) okur ve yazar.
