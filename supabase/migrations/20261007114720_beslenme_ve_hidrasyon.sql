-- Beslenme hedefleri ve hidrasyon (karar 0029, research/rules/beslenme.json ve hidrasyon.json).
-- Tek sahip deseni karar 0015'teki gibi. Hedefler, ter oranı ve notlar packages/engine'de hesaplanır, saklanmaz.
-- CHECK aralıkları veri girişi doğrulamasıdır, bilimsel eşik değildir.
--
--   * body_weights: günde bir sabah kilosu (isteğe bağlı girdi). Karbonhidrat ve protein hedefi bundan.
--   * day_types: kullanıcının gün tipi düzeltmesi. Satır yoksa gün tipi seans kayıtlarından çıkar.
--   * training_sessions.sweat_*: seansa bağlı ter testi. Ön ve son kilo birlikte girilir;
--     sıvı ve idrar yalnız tartıyla birlikte anlamlı.

create table public.body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  weight_kg numeric(5, 2) not null check (weight_kg between 30 and 250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Benzersizlik indeksi (user_id, local_date) sorgularını da karşılar.
  constraint body_weights_one_per_day unique (user_id, local_date)
);

comment on table public.body_weights is
  'Sabah kilosu (kullanıcı girdisi, kg). Beslenme hedefleri packages/engine içinde hesaplanır.';

create trigger body_weights_set_updated_at
  before update on public.body_weights
  for each row execute function private.set_updated_at();

alter table public.body_weights enable row level security;

revoke all on table public.body_weights from anon;
grant select, insert, update, delete on table public.body_weights to authenticated;

create policy "sahibi okur" on public.body_weights
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.body_weights
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.body_weights
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.body_weights
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.day_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  day_type text not null check (day_type in ('rest', 'training', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint day_types_one_per_day unique (user_id, local_date)
);

comment on table public.day_types is
  'Gün tipi düzeltmesi (dinlenme / antrenman / yoğun). Satır yoksa gün tipi o günün seanslarından çıkar.';

create trigger day_types_set_updated_at
  before update on public.day_types
  for each row execute function private.set_updated_at();

alter table public.day_types enable row level security;

revoke all on table public.day_types from anon;
grant select, insert, update, delete on table public.day_types to authenticated;

create policy "sahibi okur" on public.day_types
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.day_types
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.day_types
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.day_types
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Varsayılansız ve null olabilen sütunlar tabloyu yeniden yazmaz.
alter table public.training_sessions
  add column sweat_pre_kg numeric(5, 2) check (sweat_pre_kg between 30 and 250),
  add column sweat_post_kg numeric(5, 2) check (sweat_post_kg between 30 and 250),
  add column sweat_fluid_l numeric(4, 2) check (sweat_fluid_l between 0 and 10),
  add column sweat_urine_l numeric(4, 2) check (sweat_urine_l between 0 and 5),
  add constraint training_sessions_sweat_weights_together
    check ((sweat_pre_kg is null) = (sweat_post_kg is null)),
  add constraint training_sessions_sweat_extras_need_weights
    check (sweat_pre_kg is not null or (sweat_fluid_l is null and sweat_urine_l is null));

comment on column public.training_sessions.sweat_pre_kg is
  'Ter testi: seans öncesi kilo (kg). Son kiloyla birlikte girilir; ter oranı packages/engine içinde.';
