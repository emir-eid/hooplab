-- "Bugün maç var" işareti (karar 0036, research/rules/mac.json → mac-gunu). Tek sahip deseni karar 0015'teki gibi.
-- İşaretli gün beslenmede yoğun gün sayılır ve koça gider; günün durumu değişmez. Hesap packages/engine'de, saklanmaz.
--
--   * match_days: kullanıcının maç işaretlediği günler. Satır varsa o gün maç var; işaret kaldırılınca satır silinir.
--     Güncelleme yok (satırın tarihten başka değeri yok).

create table public.match_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  created_at timestamptz not null default now(),
  constraint match_days_one_per_day unique (user_id, local_date)
);

comment on table public.match_days is
  'Kullanıcının "Bugün maç var" işaretlediği günler (karar 0036). Satır yoksa maç işaretlenmemiş.';

alter table public.match_days enable row level security;

revoke all on table public.match_days from anon;
grant select, insert, delete on table public.match_days to authenticated;

create policy "sahibi okur" on public.match_days
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.match_days
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.match_days
  for delete to authenticated
  using ((select auth.uid()) = user_id);
