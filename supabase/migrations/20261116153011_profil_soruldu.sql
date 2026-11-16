-- İlk giriş profil soruları (karar 0061, uygulama sırası 4c). Sahibinin davranışı değişmez.
--
--   * profiles.answered_at: cinsiyet, döngü takibi ve hormonal korunma sorularının yanıtlandığı (ya da geçildiği) an.
--     Boşsa uygulama ilk girişte soruları gösterir; doluysa göstermez. Yanıtlar sonradan Ben ekranından değişir.
--   * Bu migration'dan önce var olan hesaplar sorulmuş sayılır: sahibine soru ekranı çıkmaz (cinsiyeti boş kalır,
--     döngü özellikleri kapalı kalır). Yeni hesap (tetikleyicinin açtığı satır) boş başlar.
--   * Kullanıcı yalnız kendi satırında bu sütunu da yazabilir; veri kaynağı ve spor yine yazılamaz.

alter table public.profiles add column answered_at timestamptz;

comment on column public.profiles.answered_at is
  'İlk giriş profil sorularının yanıtlandığı an (karar 0061 sıra 4c); boşsa uygulama soruları gösterir.';

update public.profiles set answered_at = now() where answered_at is null;

grant update (answered_at) on table public.profiles to authenticated;
