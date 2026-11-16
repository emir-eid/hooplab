-- Döngü günleri (karar 0061, uygulama sırası 5). Sahibinin davranışı değişmez (profili google_health, cinsiyeti boş).
--
--   * cycle_days: telefonun HealthKit adet kayıtlarından hesapladığı yerel gün, döngü günü, kaba evre ve "düzensiz"
--     bayrağı (rules/dongu.json). Ham adet kaydı, akış miktarı ve sapma kayıtları buluta gelmez.
--   * Yazan yalnız healthkit-ingest (service_role); kullanıcı yalnız kendi satırını okur.
--   * Bekçi: satır yalnız Apple profili + kadın + döngü takibi açık hesaba yazılır. Profilde döngü takibi kapanır,
--     cinsiyet ya da veri kaynağı değişirse o kullanıcının bütün döngü satırları silinir (veri en aza indirilir).

create table public.cycle_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  cycle_day smallint not null check (cycle_day between 1 and 400),
  phase text check (phase = any (array['adet', 'folikuler', 'luteal', 'adet_oncesi'])),
  irregular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date),
  -- Düzensiz döngüde evre hesaplanmaz (dongu-duzensiz).
  constraint cycle_days_irregular_has_no_phase check (not irregular or phase is null)
);

comment on table public.cycle_days is
  'Döngü günü ve kaba evre (karar 0061 sıra 5; rules/dongu.json); telefon hesaplar, healthkit-ingest yazar. Ham adet kaydı yok.';

create trigger cycle_days_set_updated_at
  before update on public.cycle_days
  for each row execute function private.set_updated_at();

alter table public.cycle_days enable row level security;

revoke all on table public.cycle_days from anon, authenticated;
grant select on table public.cycle_days to authenticated;
grant select, insert, update, delete on table public.cycle_days to service_role;

create policy "sahibi okur" on public.cycle_days
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Satır yalnız döngü takibi açık Apple profiline yazılır.
create function private.enforce_cycle_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.user_id = new.user_id
      and p.data_source = 'apple_health'
      and p.sex = 'kadin'
      and p.cycle_tracking
  ) then
    raise exception 'döngü satırı yalnız döngü takibi açık Apple profiline yazılır'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_cycle_profile() from public, anon, authenticated;

create trigger cycle_days_profile
  before insert or update of user_id on public.cycle_days
  for each row execute function private.enforce_cycle_profile();

-- Döngü takibi kapanınca (ya da cinsiyet / kaynak değişince) döngü satırları silinir.
create function private.purge_cycle_days()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (new.data_source = 'apple_health' and new.sex = 'kadin' and new.cycle_tracking) then
    delete from public.cycle_days where user_id = new.user_id;
  end if;
  return new;
end;
$$;

revoke all on function private.purge_cycle_days() from public, anon, authenticated;

create trigger profiles_purge_cycle_days
  after update of data_source, sex, cycle_tracking on public.profiles
  for each row execute function private.purge_cycle_days();
