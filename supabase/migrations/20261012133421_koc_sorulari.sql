-- Koçta soru-cevap (ROADMAP Faz 3, karar 0032 ve 0037). Soruyu `coach-ask` Edge Function yazar (service_role);
-- kullanıcı yalnız kendi sorularını okur (geçmiş listesi). Tek sahip deseni karar 0015'teki gibi.
--
--   * coach_messages: bir soru = bir satır (yeniden sorma yeni satırdır). Günlük soru sınırını fonksiyon satır
--     sayarak uygular.
--     - question: kullanıcının yazdığı metin (kişisel veri olabilir; Anthropic'e gider, DATA-INVENTORY).
--     - category: Haiku'nun sınıfı; sınıflandırma başarısızsa null.
--     - status: answered (denetimden geçen cümleler), no_source (kaynağa alıntı yok), rejected (kaynaklı cümleler
--       denetimden düştü), routed (tıbbi / kapsam dışı: model çağrılmadı, sabit metin), failed (hata kodu).
--     - snapshot: soruyla giden bugünün anlık değerleri (yoksa null; şema _shared/coach/snapshot.ts).
--     - content, audit: modelin yanıt blokları ve denetçinin sonucu (tanı için; uygulama okumaz).
--     - answer: uygulamaya dönen ve geçmişte gösterilen yanıt (contract.ts StoredAskResponse).
--     - model, fallback, usage, classifier_usage: yanıtı veren model, sunucu taraflı yedek, token kullanımı
--       (yanıt ve sınıflandırma ayrı; maliyet ölçümü, COSTS).

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  question text not null check (length(question) between 3 and 500),
  category text check (category is null or category in ('in_scope', 'supplement', 'medical_red_flag', 'out_of_scope')),
  status text not null check (status in ('answered', 'no_source', 'rejected', 'routed', 'failed')),
  snapshot jsonb check (snapshot is null or jsonb_typeof(snapshot) = 'object'),
  content jsonb check (content is null or jsonb_typeof(content) = 'array'),
  audit jsonb check (audit is null or jsonb_typeof(audit) = 'object'),
  answer jsonb not null check (jsonb_typeof(answer) = 'object' and answer->>'status' = status),
  error text check (error is null or length(error) between 1 and 200),
  model text check (model is null or length(model) between 1 and 100),
  fallback boolean not null default false,
  usage jsonb check (usage is null or jsonb_typeof(usage) = 'object'),
  classifier_usage jsonb check (classifier_usage is null or jsonb_typeof(classifier_usage) = 'object'),
  created_at timestamptz not null default now(),
  -- Yanıtlanan soruda model yanıtı ve denetim var; yönlendirilen soruda sınıf var, yanıt yok; başarısızda hata kodu.
  constraint coach_messages_status_fields check (
    case status
      when 'failed' then error is not null and content is null
      when 'routed' then category in ('medical_red_flag', 'out_of_scope') and content is null and error is null
      else category in ('in_scope', 'supplement') and content is not null and audit is not null and model is not null and error is null
    end
  )
);

comment on table public.coach_messages is
  'Koçta soru-cevap (karar 0037). Yazan yalnız coach-ask Edge Function (service_role); sahibi okur.';

create index coach_messages_user_date_idx on public.coach_messages (user_id, local_date, created_at desc);

alter table public.coach_messages enable row level security;

revoke all on table public.coach_messages from anon, authenticated;

-- Sahibi okur (geçmiş). Soruyu uygulama yazamaz: sınıflandırma, alıntı ve sayı denetimi sunucuda.
grant select on table public.coach_messages to authenticated;

create policy "sahibi okur" on public.coach_messages
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Edge Function service_role ile yazar (RLS'i atlar). Silme yok: kayıt maliyet ve denetim geçmişidir;
-- hesap silinince cascade ile gider.
grant select, insert on table public.coach_messages to service_role;
