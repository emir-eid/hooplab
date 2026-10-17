-- Koçun haftalık yorumu (karar 0052). Yorumu `coach-weekly` Edge Function yazar (service_role); kullanıcı yalnız
-- kendi yorumlarını okur. Desen coach_summaries (20261009012204) ile aynı; anahtar gün yerine haftanın pazartesisi.
--
--   * Bir deneme = bir satır. Hafta başına deneme sınırını fonksiyon satır sayarak uygular; uygulama haftanın en yeni
--     `accepted` satırını gösterir.
--   * snapshot: uygulamanın gönderdiği biten haftanın sayıları (şema: _shared/coach/weekly.ts). Ad, e-posta, kilo,
--     yakılan enerji, ham seri ve gün gün tarih yoktur; şema bilinmeyen alanı reddeder.
--   * content, audit, error, model, fallback, usage: coach_summaries'teki gibi.

create table public.coach_weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  status text not null check (status in ('accepted', 'rejected', 'failed')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  content jsonb check (content is null or jsonb_typeof(content) = 'array'),
  audit jsonb check (audit is null or jsonb_typeof(audit) = 'object'),
  error text check (error is null or length(error) between 1 and 200),
  model text check (model is null or length(model) between 1 and 100),
  fallback boolean not null default false,
  usage jsonb check (usage is null or jsonb_typeof(usage) = 'object'),
  created_at timestamptz not null default now(),
  constraint coach_weekly_summaries_status_fields check (
    case status
      when 'failed' then error is not null and content is null
      else content is not null and audit is not null and model is not null and error is null
    end
  )
);

comment on table public.coach_weekly_summaries is
  'Koçun haftalık yorumu (karar 0052). Yazan yalnız coach-weekly Edge Function (service_role); sahibi okur.';

create index coach_weekly_summaries_user_week_idx on public.coach_weekly_summaries (user_id, week_start, created_at desc);

alter table public.coach_weekly_summaries enable row level security;

revoke all on table public.coach_weekly_summaries from anon, authenticated;

grant select on table public.coach_weekly_summaries to authenticated;

create policy "sahibi okur" on public.coach_weekly_summaries
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Silme yok: kayıt maliyet ve denetim geçmişidir; hesap silinince cascade ile gider.
grant select, insert on table public.coach_weekly_summaries to service_role;
