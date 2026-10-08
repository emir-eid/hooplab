-- Koçun günlük özeti (ROADMAP Faz 3, karar 0032). Özeti `coach-daily` Edge Function yazar (service_role);
-- kullanıcı yalnız kendi özetlerini okur. Tek sahip deseni karar 0015'teki gibi.
--
--   * coach_summaries: bir üretim denemesi = bir satır. Aynı gün yeniden üretilirse yeni satır eklenir;
--     uygulama günün en yeni `accepted` satırını gösterir. Günlük deneme sınırını fonksiyon satır sayarak uygular.
--     - snapshot: uygulamanın gönderdiği anlık değerler (şema: _shared/coach/snapshot.ts). Ad, e-posta,
--       kilo, ham seri yoktur; şema bilinmeyen alanı reddeder.
--     - content: modelin yanıt blokları (metin ve alıntılar). Denetimden geçmeyen yanıt da saklanır
--       (`rejected`) ki denetçinin ret nedenleri incelenebilsin; uygulama onu göstermez.
--     - audit: denetçinin sonucu (_shared/coach/audit.ts: cümleler, sorunlar).
--     - error: `failed` satırında hata kodu (ör. kredi bitti, anahtar süresi doldu); kişisel veri yazılmaz.
--     - model, fallback, usage: yanıtı veren model, sunucu taraflı yedeğin devreye girip girmediği ve token
--       kullanımı (maliyet ölçümü, COSTS).

create table public.coach_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('accepted', 'rejected', 'failed')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  content jsonb check (content is null or jsonb_typeof(content) = 'array'),
  audit jsonb check (audit is null or jsonb_typeof(audit) = 'object'),
  error text check (error is null or length(error) between 1 and 200),
  model text check (model is null or length(model) between 1 and 100),
  fallback boolean not null default false,
  usage jsonb check (usage is null or jsonb_typeof(usage) = 'object'),
  created_at timestamptz not null default now(),
  -- Kabul edilen ve reddedilen özette yanıt ve denetim vardır; başarısız denemede hata kodu vardır.
  constraint coach_summaries_status_fields check (
    case status
      when 'failed' then error is not null and content is null
      else content is not null and audit is not null and model is not null and error is null
    end
  )
);

comment on table public.coach_summaries is
  'Koçun günlük özeti (karar 0032). Yazan yalnız coach-daily Edge Function (service_role); sahibi okur.';

create index coach_summaries_user_date_idx on public.coach_summaries (user_id, local_date, created_at desc);

alter table public.coach_summaries enable row level security;

revoke all on table public.coach_summaries from anon, authenticated;

-- Sahibi okur (yalnız SELECT). Özeti uygulama yazamaz: sayıların ve alıntıların denetimi sunucuda.
grant select on table public.coach_summaries to authenticated;

create policy "sahibi okur" on public.coach_summaries
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Edge Function service_role ile yazar (RLS'i atlar). Yeni tablolar kendiliğinden açılmadığı için açık GRANT.
-- Silme yok: kayıt maliyet ve denetim geçmişidir; hesap silinince cascade ile gider.
grant select, insert on table public.coach_summaries to service_role;
