-- Profil: veri kaynağı × spor × cinsiyet (karar 0061, uygulama sırası 1). Sahibinin davranışı değişmez.
--
--   * profiles: kullanıcı başına bir satır. data_source ve sport hesabı açan (service_role) tarafından atanır;
--     kullanıcı yalnız cinsiyet, döngü takibi ve hormonal korunma alanlarını değiştirir (sütun düzeyinde GRANT).
--     Var olan kullanıcılara google_health + basketbol yazılır, cinsiyet boş kalır: repoya kişisel bilgi girmez,
--     boş cinsiyet döngü özelliklerini kapatır. Yeni kullanıcıya aynı varsayılan satır tetikleyiciyle açılır.
--   * Cihaz tabloları (health_daily, sleep_sessions, exercise_sessions, health_hourly_energy) satırın kaynağını
--     taşır (source). Kaynak, kullanıcının profilindeki data_source'tan farklıysa yazma reddedilir: Apple verisi
--     sahibinin satırlarına, Google verisi Apple profilli hesaba yazılamaz (bekçi 3).
--   * CHECK listeleri `= any (array[...])` biçiminde (rules-sync testi `kind in` biçimini seans türü sanıyor, LESSONS).

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data_source text not null default 'google_health'
    check (data_source = any (array['google_health', 'apple_health'])),
  sport text not null default 'basketbol'
    check (sport = any (array['basketbol', 'fitness'])),
  sex text check (sex = any (array['kadin', 'erkek'])),
  cycle_tracking boolean not null default false,
  hormonal_contraception text
    check (hormonal_contraception = any (array['yok', 'var', 'belirtmek_istemiyorum'])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Döngü alanları yalnız kadın profilinde anlamlı.
  constraint profiles_cycle_requires_female check (not cycle_tracking or sex = 'kadin'),
  constraint profiles_contraception_requires_female check (hormonal_contraception is null or sex = 'kadin')
);

comment on table public.profiles is
  'Kullanıcı profili (karar 0061): veri kaynağı ve spor hesabı açan tarafından atanır; kurallar ve modüller buna göre seçilir.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (sex, cycle_tracking, hormonal_contraception) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy "sahibi okur" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Ekleme ve silme politikası yok: satırı tetikleyici açar, hesap silinince cascade siler.

insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();

-- Cihaz satırlarının kaynağı ve profil bekçisi.
create function private.enforce_profile_source()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected text;
begin
  select p.data_source into expected from public.profiles p where p.user_id = new.user_id;
  if new.source is distinct from coalesce(expected, 'google_health') then
    raise exception 'kaynak profil ile uyuşmuyor: % satırı % profiline yazılamaz', new.source, coalesce(expected, 'google_health')
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_profile_source() from public, anon, authenticated;

alter table public.health_daily
  add column source text not null default 'google_health'
    check (source = any (array['google_health', 'apple_health']));
alter table public.sleep_sessions
  add column source text not null default 'google_health'
    check (source = any (array['google_health', 'apple_health']));
alter table public.exercise_sessions
  add column source text not null default 'google_health'
    check (source = any (array['google_health', 'apple_health']));
alter table public.health_hourly_energy
  add column source text not null default 'google_health'
    check (source = any (array['google_health', 'apple_health']));

create trigger health_daily_profile_source
  before insert or update of source, user_id on public.health_daily
  for each row execute function private.enforce_profile_source();
create trigger sleep_sessions_profile_source
  before insert or update of source, user_id on public.sleep_sessions
  for each row execute function private.enforce_profile_source();
create trigger exercise_sessions_profile_source
  before insert or update of source, user_id on public.exercise_sessions
  for each row execute function private.enforce_profile_source();
create trigger health_hourly_energy_profile_source
  before insert or update of source, user_id on public.health_hourly_energy
  for each row execute function private.enforce_profile_source();
