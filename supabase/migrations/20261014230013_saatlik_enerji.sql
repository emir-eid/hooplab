-- Saatlik yakılan enerji (karar 0044): Bugün'deki "Yakılan enerji" kartının 24 saatlik grafiği.
-- Google Health `total-calories` rollUp'ı (pencere 3600 sn, bileklik ailesi); senkron bugün ve önceki 7 günü
-- her saat yeniden yazar. Kurallar 0019 ile aynı: sahibi yalnız okur, yazma yolu yalnız service_role.
-- Değer bileklik tahmini (rules/enerji.json → enerji-harcamasi-tahmin); eşik yok.

create table public.health_hourly_energy (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Pencerenin başladığı an; anahtar budur (yaz saati gününde 23 / 25 saat de sorunsuz).
  hour_start timestamptz not null,
  -- Sporcunun Google hesabındaki saat dilimine göre yerel gün ve saat (senkron yazar).
  local_date date not null,
  local_hour smallint not null check (local_hour between 0 and 23),
  kcal double precision not null check (kcal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, hour_start)
);

comment on table public.health_hourly_energy is
  'Google Health saatlik toplam kalori (bileklik tahmini; senkron yazar, sahibi okur).';

-- Uygulama bir günün 24 saatini ya da son 8 günü yerel güne göre okur.
create index health_hourly_energy_user_day on public.health_hourly_energy (user_id, local_date);

create trigger health_hourly_energy_set_updated_at
  before update on public.health_hourly_energy
  for each row execute function private.set_updated_at();

alter table public.health_hourly_energy enable row level security;

revoke all on table public.health_hourly_energy from anon, authenticated;
grant select on table public.health_hourly_energy to authenticated;

create policy "sahibi okur" on public.health_hourly_energy
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Edge Functions service_role ile yazar (RLS'i atlar). Yeni tablolar kendiliğinden açılmadığı için açık GRANT.
grant select, insert, update, delete on table public.health_hourly_energy to service_role;
