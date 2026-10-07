-- Su kaydı (karar 0031, research/rules/hidrasyon.json → sivi-alim-kaydi). Tek sahip deseni karar 0015'teki gibi.
-- Günlük toplam packages/engine'de hesaplanır, saklanmaz. Hedef yok. CHECK aralığı veri girişi doğrulamasıdır,
-- bilimsel eşik değildir.
--
--   * fluid_intakes: bir içiş = bir satır (mL). Silme Bugün'de kaydırarak.

create table public.fluid_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  volume_ml integer not null check (volume_ml between 50 and 2000),
  created_at timestamptz not null default now()
);

comment on table public.fluid_intakes is
  'İçilen sıvı (kullanıcı girdisi, mL). Günlük toplam packages/engine içinde hesaplanır; hedef yok.';

create index fluid_intakes_user_date_idx on public.fluid_intakes (user_id, local_date);

alter table public.fluid_intakes enable row level security;

revoke all on table public.fluid_intakes from anon;
grant select, insert, delete on table public.fluid_intakes to authenticated;

create policy "sahibi okur" on public.fluid_intakes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.fluid_intakes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.fluid_intakes
  for delete to authenticated
  using ((select auth.uid()) = user_id);
