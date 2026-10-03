-- Tek sahip deseni ve ilk kullanıcı girdisi tablosu: seans kaydı (PRODUCT §4).
--
-- Her kullanıcı tablosunda aynı kurallar (karar 0015):
--   * user_id varsayılanı auth.uid(); RLS dört işlemde de satırı oturum sahibine kilitler.
--   * Tablolar Data API'ye kendiliğinden açılmaz (auto_expose_new_tables = false); yalnız
--     `authenticated` rolüne açıkça GRANT verilir. `anon` hiçbir tabloya erişemez.
--   * Sayısal alanlardaki CHECK sınırları veri girişi doğrulamasıdır, bilimsel eşik değildir.
--     Eşikler research/rules içinde tanımlanır ve packages/engine hesaplar.

-- Yardımcı fonksiyonlar Data API'ye açık olmayan ayrı bir şemada durur.
create schema if not exists private;
revoke all on schema private from public;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Seans kaydı: tür, süre, RPE (0-10), maçta oynanan dakika. Seans yükü (RPE × dakika) saklanmaz,
-- hesap motoru üretir. İçerik etiketleri (sıçrama, yön değiştirme...) Faz 2'de kas / tendon modeliyle gelir.
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Sporcunun o günkü yerel tarihi (seyahatte saat dilimi değişir; günlük toplamlar buna göre).
  local_date date not null,
  started_at timestamptz,
  kind text not null
    check (kind in ('team_practice', 'game', 'strength', 'conditioning', 'shooting', 'rehab')),
  duration_min smallint not null check (duration_min between 1 and 600),
  rpe smallint not null check (rpe between 0 and 10),
  minutes_played smallint check (minutes_played between 0 and 90),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sessions_minutes_played_game_only
    check (minutes_played is null or kind = 'game')
);

comment on table public.training_sessions is
  'Seans kaydı (kullanıcı girdisi). Yük hesabı packages/engine içinde.';

create index training_sessions_user_date_idx
  on public.training_sessions (user_id, local_date desc);

create trigger training_sessions_set_updated_at
  before update on public.training_sessions
  for each row execute function private.set_updated_at();

alter table public.training_sessions enable row level security;

revoke all on table public.training_sessions from anon;
grant select, insert, update, delete on table public.training_sessions to authenticated;

create policy "sahibi okur" on public.training_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.training_sessions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.training_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.training_sessions
  for delete to authenticated
  using ((select auth.uid()) = user_id);
