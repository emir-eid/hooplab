-- Google Health senkronu (ROADMAP Faz 1, karar 0019). Veriyi Edge Function'lar yazar (service_role);
-- sahibi yalnız okur. Token ve OAuth durumu yalnız sunucunun erişebildiği tablolarda.
--
-- Kurallar (0015 ile aynı ruh):
--   * Her tabloda RLS açık. `anon` hiçbir tabloya erişemez.
--   * Cihaz verisi tablolarında `authenticated` yalnız SELECT alır ve politika satırı sahibine kilitler.
--     Yazma yolu yalnız senkron fonksiyonu: kullanıcı cihaz verisini elle değiştiremez.
--   * Sır tutan tablolarda (token, OAuth durumu) hiç politika yok ve `authenticated` yetkisi yok;
--     yalnız `service_role` (Edge Functions) erişir.
--   * Gün içi ham nabız saklanmaz: Google'ın günlük özetinden (dailyRollUp) en düşük / ortalama / en
--     yüksek gelir. Adım, mesafe, kalori ve nabız özeti yalnız bileklik ailesinden (google-wearables)
--     alınır; iPhone'un adımı ikinci kez sayılmaz.
--   * Sayısal alanlarda bilimsel eşik yok; yorum packages/engine'de, kişisel baseline'a göre.

-- Günlük cihaz metrikleri: gün başına bir satır, sporcunun Google hesabındaki saat dilimine göre.
-- Her veri tipi kendi sütunlarını günceller; o gün gelmeyen tip önceki değeri silmez.
create table public.health_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  -- daily-heart-rate-variability (gece ölçümü)
  hrv_rmssd_ms double precision,
  hrv_deep_rmssd_ms double precision,
  hrv_entropy double precision,
  nrem_hr_bpm smallint,
  -- daily-resting-heart-rate
  resting_hr_bpm smallint,
  resting_hr_method text,
  -- daily-oxygen-saturation (uyku sırasında)
  spo2_avg_pct double precision,
  spo2_lower_pct double precision,
  spo2_upper_pct double precision,
  -- daily-respiratory-rate (ana uyku)
  respiratory_rate_bpm double precision,
  -- daily-sleep-temperature-derivations: sapma saklanmaz, engine iki değerden hesaplar
  skin_temp_nightly_c double precision,
  skin_temp_baseline_c double precision,
  -- heart-rate günlük özeti (ham örnek yok)
  hr_min_bpm double precision,
  hr_avg_bpm double precision,
  hr_max_bpm double precision,
  -- steps / distance / total-calories / active-zone-minutes günlük toplamları (bileklik)
  steps integer check (steps >= 0),
  distance_m double precision check (distance_m >= 0),
  calories_kcal double precision check (calories_kcal >= 0),
  azm_fat_burn smallint check (azm_fat_burn >= 0),
  azm_cardio smallint check (azm_cardio >= 0),
  azm_peak smallint check (azm_peak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_daily_one_per_day unique (user_id, local_date)
);

comment on table public.health_daily is
  'Google Health günlük metrikleri (senkron yazar, sahibi okur). Ham gün içi nabız saklanmaz.';

-- Uyku oturumu: Google'daki kayıt başına bir satır. Evre zaman çizelgesi saklanmaz, yalnız toplamlar.
create table public.sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Google'daki kayıt kimliği (veri noktası adının son parçası); yoksa başlangıç zamanı.
  source_id text not null,
  -- Uyanılan günün yerel tarihi (oturumun sivil bitiş tarihi).
  local_date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  start_utc_offset_s integer,
  end_utc_offset_s integer,
  sleep_type text,
  is_main boolean,
  is_nap boolean,
  processed boolean,
  minutes_in_period integer,
  minutes_asleep integer,
  minutes_awake integer,
  minutes_to_fall_asleep integer,
  minutes_after_wake_up integer,
  minutes_light integer,
  minutes_deep integer,
  minutes_rem integer,
  short_awakenings integer,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sleep_sessions_end_after_start check (end_time >= start_time),
  constraint sleep_sessions_one_per_source unique (user_id, source_id)
);

comment on table public.sleep_sessions is
  'Google Health uyku oturumları (senkron yazar, sahibi okur). Evre toplamları; zaman çizelgesi yok.';

create index sleep_sessions_user_date_idx on public.sleep_sessions (user_id, local_date desc);

-- Egzersiz oturumu. Basketbol API'de SPORT olarak gelir; tür etiketini kullanıcı verir (ayrı iş).
-- Serbest metin notları alınmaz.
create table public.exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_id text not null,
  -- Başlangıç gününün yerel tarihi.
  local_date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  start_utc_offset_s integer,
  exercise_type text not null,
  display_name text,
  active_duration_s integer check (active_duration_s >= 0),
  avg_hr_bpm smallint,
  calories_kcal double precision check (calories_kcal >= 0),
  distance_m double precision check (distance_m >= 0),
  steps integer check (steps >= 0),
  active_zone_minutes integer check (active_zone_minutes >= 0),
  hr_zone_light_s integer check (hr_zone_light_s >= 0),
  hr_zone_moderate_s integer check (hr_zone_moderate_s >= 0),
  hr_zone_vigorous_s integer check (hr_zone_vigorous_s >= 0),
  hr_zone_peak_s integer check (hr_zone_peak_s >= 0),
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_sessions_end_after_start check (end_time >= start_time),
  constraint exercise_sessions_one_per_source unique (user_id, source_id)
);

comment on table public.exercise_sessions is
  'Google Health egzersiz oturumları (senkron yazar, sahibi okur). Notlar alınmaz.';

create index exercise_sessions_user_date_idx on public.exercise_sessions (user_id, local_date desc);

-- Bağlantı ve senkron durumu: uygulama "bağlı / yeniden bağlan / son senkron" gösterir.
-- Sır içermez; hata alanında yalnız kısa bir kod durur.
create table public.health_sync_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state text not null check (state in ('connected', 'reconnect_required', 'disconnected')),
  connected_at timestamptz,
  time_zone text,
  synced_from date,
  synced_through date,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text check (char_length(last_error) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.health_sync_status is
  'Google Health bağlantı ve senkron durumu (senkron yazar, sahibi okur).';

-- Yenileme token'ı. Yalnız service_role; uygulama ve kullanıcı oturumu okuyamaz.
-- Testing modundaki OAuth uygulamasında 7 günde düşer (LESSONS); yeniden bağlanınca üzerine yazılır.
create table public.google_health_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_health_tokens is
  'Google OAuth yenileme token''ı. Yalnız Edge Functions (service_role); politika yok.';

-- OAuth akışı sırasında tek kullanımlık durum (CSRF) ve PKCE doğrulayıcısı. Kısa ömürlü.
create table public.google_health_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code_verifier text not null,
  return_url text not null,
  created_at timestamptz not null default now()
);

comment on table public.google_health_oauth_states is
  'Google OAuth tek kullanımlık durum + PKCE. Yalnız Edge Functions (service_role); politika yok.';

create index google_health_oauth_states_created_idx on public.google_health_oauth_states (created_at);

-- updated_at tetikleyicileri
create trigger health_daily_set_updated_at
  before update on public.health_daily
  for each row execute function private.set_updated_at();
create trigger sleep_sessions_set_updated_at
  before update on public.sleep_sessions
  for each row execute function private.set_updated_at();
create trigger exercise_sessions_set_updated_at
  before update on public.exercise_sessions
  for each row execute function private.set_updated_at();
create trigger health_sync_status_set_updated_at
  before update on public.health_sync_status
  for each row execute function private.set_updated_at();
create trigger google_health_tokens_set_updated_at
  before update on public.google_health_tokens
  for each row execute function private.set_updated_at();

-- RLS ve yetkiler
alter table public.health_daily enable row level security;
alter table public.sleep_sessions enable row level security;
alter table public.exercise_sessions enable row level security;
alter table public.health_sync_status enable row level security;
alter table public.google_health_tokens enable row level security;
alter table public.google_health_oauth_states enable row level security;

revoke all on table
  public.health_daily, public.sleep_sessions, public.exercise_sessions, public.health_sync_status,
  public.google_health_tokens, public.google_health_oauth_states
from anon, authenticated;

-- Sahibi okur (yalnız SELECT).
grant select on table
  public.health_daily, public.sleep_sessions, public.exercise_sessions, public.health_sync_status
to authenticated;

create policy "sahibi okur" on public.health_daily
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi okur" on public.sleep_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi okur" on public.exercise_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi okur" on public.health_sync_status
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Edge Functions service_role ile yazar (RLS'i atlar). Yeni tablolar kendiliğinden açılmadığı için açık GRANT.
grant select, insert, update, delete on table
  public.health_daily, public.sleep_sessions, public.exercise_sessions, public.health_sync_status,
  public.google_health_tokens, public.google_health_oauth_states
to service_role;

-- Zamanlayıcı: saatte bir senkron fonksiyonunu çağırır. Adres ve paylaşılan sır Vault'ta durur
-- (migration'da değil: proje adresi repoya girmez, 0009). Sırlar yoksa hiçbir şey yapmaz.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function private.trigger_google_health_sync()
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
    url := v_url || '/functions/v1/ghealth-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hooplab-cron', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
end;
$$;

comment on function private.trigger_google_health_sync is
  'Saatlik zamanlayıcının çağırdığı tetikleyici: Vault''taki adres ve sırla ghealth-sync fonksiyonunu çağırır.';

revoke all on function private.trigger_google_health_sync() from public;

select cron.schedule(
  'google-health-senkron',
  '17 * * * *',
  $$ select private.trigger_google_health_sync() $$
);
