-- Seyahat ve jet lag (karar 0047, research/rules/seyahat.json). Tek sahip deseni karar 0015'teki gibi.
--
--   * trips: kullanıcının kaydettiği seyahatler. Gidiş günü, isteğe bağlı dönüş günü ve varış yerinin evin saatine
--     göre farkı (saat; + doğu, − batı). Şehir, ülke ya da uçuş saklanmaz. Uyum tahmini saklanmaz; uygulamada
--     motor hesaplar (packages/engine/src/travel.ts).

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  depart_date date not null,
  return_date date,
  offset_hours smallint not null check (offset_hours between -12 and 14),
  created_at timestamptz not null default now(),
  constraint trips_return_after_depart check (return_date is null or return_date >= depart_date)
);

comment on table public.trips is
  'Seyahatler (karar 0047): gidiş, isteğe bağlı dönüş ve saat farkı (+ doğu, − batı). Yer bilgisi saklanmaz.';

create index trips_user_depart_idx on public.trips (user_id, depart_date);

alter table public.trips enable row level security;

revoke all on table public.trips from anon;
grant select, insert, update, delete on table public.trips to authenticated;

create policy "sahibi okur" on public.trips
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.trips
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.trips
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.trips
  for delete to authenticated
  using ((select auth.uid()) = user_id);
