-- Açık rıza (karar 0061 sıra 6). Sahibinin davranışı değişmez.
--
--   * profiles.consented_at / consent_version: kullanıcının ilk girişte rıza ekranını onayladığı an ve onayladığı
--     metnin sürümü. Boşsa uygulama önce rıza ekranını gösterir; o onaylanmadan senkron, bildirim kaydı ve koç
--     çalışmaz. Reddeden kullanıcının oturumu kapatılır.
--   * Bu migration'dan önce var olan hesaplar (sahibi) rıza vermiş sayılır: sahibine rıza ekranı çıkmaz.
--     Yeni hesap (tetikleyicinin açtığı satır) boş başlar.
--   * Kullanıcı yalnız kendi satırında bu iki sütunu yazabilir; ikisi birlikte dolu ya da birlikte boş olur.
--   * Rızayı geri çekmek silme talebidir: hesap ve tüm satırlar silinir (auth.users → on delete cascade).

alter table public.profiles
  add column consented_at timestamptz,
  add column consent_version text,
  add constraint profiles_consent_pair check ((consented_at is null) = (consent_version is null));

comment on column public.profiles.consented_at is
  'Rıza ekranının onaylandığı an (karar 0061 sıra 6); boşsa uygulama önce rıza ekranını gösterir.';
comment on column public.profiles.consent_version is
  'Onaylanan rıza metninin sürümü (uygulamadaki consentVersion).';

update public.profiles set consented_at = now(), consent_version = 'sahip' where consented_at is null;

grant update (consented_at, consent_version) on table public.profiles to authenticated;
