-- Sabah check-in ve ağrı haritası (PRODUCT §4, karar 0017). Tek sahip deseni karar 0015'teki gibi.
--
-- Ölçekler research/rules'tan; packages/engine sabitleri ve bu CHECK'ler
-- packages/engine/test/rules-sync.test.ts ile birbirine bağlı:
--   * check-in: beş madde, 1-5 tam sayı, tüm maddelerde 5 = en iyi (iyi-olus.json → checkin-olcek)
--   * ağrı: bölge ve taraf başına 0-10 NRS (agri.json → agri-olcek)
-- CHECK'ler veri girişi doğrulamasıdır; yorum ve eşikler packages/engine'de.

-- Günde bir check-in. Aynı gün yeniden doldurulursa satır güncellenir (save_morning_checkin).
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  fatigue smallint not null check (fatigue between 1 and 5),
  soreness smallint not null check (soreness between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  mood smallint not null check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Benzersizlik indeksi (user_id, local_date) sorgularını da karşılar; ayrı indeks gerekmez.
  constraint daily_checkins_one_per_day unique (user_id, local_date)
);

comment on table public.daily_checkins is
  'Sabah check-in (kullanıcı girdisi). 1-5, 5 = en iyi. Yorum kişisel baseline ile packages/engine içinde.';

create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function private.set_updated_at();

alter table public.daily_checkins enable row level security;

revoke all on table public.daily_checkins from anon;
grant select, insert, update, delete on table public.daily_checkins to authenticated;

create policy "sahibi okur" on public.daily_checkins
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.daily_checkins
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.daily_checkins
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.daily_checkins
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Ağrı haritası: gün, bölge ve taraf başına bir değer. Sol ve sağ ayrı; bel orta hatta tek (center).
-- Bölge listesi packages/engine/src/body-regions.ts ile aynı sırada.
create table public.pain_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  region text not null
    check (region in ('calf', 'achilles', 'ankle', 'patellar_tendon', 'quadriceps', 'hamstring', 'adductor', 'hip', 'lower_back', 'shoulder')),
  side text not null check (side in ('left', 'right', 'center')),
  pain smallint not null check (pain between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pain_reports_side_matches_region
    check ((region = 'lower_back') = (side = 'center')),
  constraint pain_reports_one_per_spot_per_day unique (user_id, local_date, region, side)
);

comment on table public.pain_reports is
  'Ağrı haritası (kullanıcı girdisi): bölge ve taraf başına 0-10 NRS.';

create trigger pain_reports_set_updated_at
  before update on public.pain_reports
  for each row execute function private.set_updated_at();

alter table public.pain_reports enable row level security;

revoke all on table public.pain_reports from anon;
grant select, insert, update, delete on table public.pain_reports to authenticated;

create policy "sahibi okur" on public.pain_reports
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.pain_reports
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.pain_reports
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.pain_reports
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Check-in ve o günün ağrı haritası tek işlemde kaydedilir: yarıda kalan kayıt olmaz.
-- SECURITY INVOKER: çağıranın yetkisi ve RLS geçerli; fonksiyon başkasının satırına dokunamaz.
-- Ağrı haritası o günün tam halidir: formda gösterilen değerler gönderilir, gönderilmeyen bölge silinir.
-- p_pain: [{"region": "achilles", "side": "left", "pain": 3}, ...]
create function public.save_morning_checkin(
  p_local_date date,
  p_sleep_quality smallint,
  p_fatigue smallint,
  p_soreness smallint,
  p_stress smallint,
  p_mood smallint,
  p_pain jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_pain) is distinct from 'array' then
    raise exception 'p_pain bir JSON dizisi olmalı' using errcode = '22023';
  end if;

  insert into public.daily_checkins (local_date, sleep_quality, fatigue, soreness, stress, mood)
  values (p_local_date, p_sleep_quality, p_fatigue, p_soreness, p_stress, p_mood)
  on conflict (user_id, local_date) do update
    set sleep_quality = excluded.sleep_quality,
        fatigue = excluded.fatigue,
        soreness = excluded.soreness,
        stress = excluded.stress,
        mood = excluded.mood
  returning id into v_id;

  delete from public.pain_reports
  where user_id = (select auth.uid()) and local_date = p_local_date;

  insert into public.pain_reports (local_date, region, side, pain)
  select p_local_date, x.region, x.side, x.pain
  from jsonb_to_recordset(p_pain) as x (region text, side text, pain smallint);

  return v_id;
end;
$$;

comment on function public.save_morning_checkin is
  'Sabah check-in + o günün ağrı haritası, tek işlemde. SECURITY INVOKER, RLS geçerli.';

-- Supabase yeni fonksiyonlara anon ve authenticated için EXECUTE veriyor; yalnız authenticated kalır.
revoke execute on function public.save_morning_checkin(date, smallint, smallint, smallint, smallint, smallint, jsonb)
  from public, anon;
grant execute on function public.save_morning_checkin(date, smallint, smallint, smallint, smallint, smallint, jsonb)
  to authenticated;
