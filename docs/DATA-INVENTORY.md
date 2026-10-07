# Veri envanteri

Hangi veri nerede durur, hangi servise ne gider, ne kadar saklanır, nasıl silinir. Yeni bir veri türü veya yeni bir servis eklendiğinde bu belge aynı commit'te güncellenir.

## Veri türleri

| Veri | Kaynak | Nerede saklanır | Kim / ne erişir |
|---|---|---|---|
| Cihaz verisi: günlük HRV, dinlenik nabız, SpO2, solunum, gece cilt sıcaklığı, günlük nabız özeti (en düşük / ortalama / en yüksek), adım, mesafe, kalori, aktif bölge dakikası; uyku ve egzersiz oturumları | Fitbit Air → Google Health API v4 | Google (kaynak); Faz 0 dışa aktarımları `private/data`; Supabase `health_daily`, `sleep_sessions`, `exercise_sessions` (2026-10-04'ten beri, [0019](decisions/0019-google-health-senkronu.md)). **Saklanmayanlar:** gün içi ham nabız (hiç çekilmez), uyku evre zaman çizelgesi, egzersiz notları, `swim-lengths-data`, iPhone adımı | Sahibi yalnız okur (RLS); yazan yalnız senkron Edge Function'ı (`service_role`). İstisna: sahibi `exercise_sessions.dismissed_at` ("Seans değil") sütununu güncelleyebilir ([0020](decisions/0020-seans-etiketleme.md)) |
| Google Health bağlantı durumu: bağlı mı, son senkron, veri aralığı, saat dilimi, kısa hata kodu | Senkron | Supabase `health_sync_status` | Sahibi okur; senkron yazar |
| Kullanıcı girdileri: check-in, seans, ağrı haritası, kilo, beslenme, sıvı | Uygulama | Supabase (`training_sessions`, `daily_checkins`, `pain_reports` 2026-10-04'ten beri; diğerleri geldikçe). Seans kaydı eşleştiği saat oturumuna `exercise_session_id` ile bağlanır ([0020](decisions/0020-seans-etiketleme.md)); içerik etiketleri `training_sessions.content_tags` (2026-10-07'den beri, [0027](decisions/0027-kas-tendon-bolge-yuku.md); bölge yükü saklanmaz, uygulamada hesaplanır); sabah kilosu `body_weights`, gün tipi düzeltmesi `day_types` ve seansa bağlı ter testi `training_sessions.sweat_*` (ön / son kilo, içilen sıvı, idrar) 2026-10-07'den beri ([0029](decisions/0029-beslenme-ve-hidrasyon.md); hedefler ve ter oranı saklanmaz, uygulamada hesaplanır). Kilo kişisel veridir: demoda yalnız sentetik değer, repoda hiç | Sahibi (RLS ile yalnız kendi satırları, [0015](decisions/0015-veritabani-tek-sahip-rls.md)) |
| Giriş hesabı: e-posta, şifre özeti | Supabase panosu (bir kez) | Supabase Auth (`auth.users`) | Sahibi; yeni kayıt kapalı |
| Oturum: erişim ve yenileme token'ı, kullanıcı kimliği ve e-postası | Supabase Auth | iPhone Keychain (`expo-secure-store`, parçalı); web önizlemesinde tarayıcının localStorage'ı | Yalnız uygulama |
| Profil: boy, kilo, doğum tarihi, sakatlık geçmişi | Uygulama | Yalnız Supabase | Sahibi; hesap motoru |
| Hesaplanmış değerler: baseline, yük, tahminler, hedefler | Hesap motoru | Şimdilik saklanmaz: toparlanma bandı ve antrenman yükü her gösterimde cihazda, Supabase satırlarından hesaplanır ([0021](decisions/0021-toparlanma-kisisel-bant.md), [0025](decisions/0025-antrenman-yuku.md)); ileride koç için Supabase | Sahibi; AI koç (özet olarak) |
| AI özetleri ve cevapları | Anthropic API | Supabase | Sahibi |
| Kanıt tabanı: kaynak özetleri, kurallar | Bu repo (`research/`) | GitHub; Supabase (Faz 3, arama için) | Herkese açık (kişisel veri içermez) |
| Kişisel notlar | `/kapat` | `private/journal` + Drive yedeği | Sahibi |
| Claude Code oturum dökümleri | Hook'lar | `private/transcripts` + Drive yedeği | Sahibi |
| Google OAuth istemci sırrı ve token'ları (Faz 0) | `ghealth` setup | `private/ghealth` + Drive yedeği | `ghealth` CLI |
| Google OAuth Web istemcisi sırrı, yenileme token'ı, OAuth durumu (tek kullanımlık, 15 dk) | Kullanıcının Google Cloud projesi; izin ekranı | Supabase secrets; `google_health_tokens`, `google_health_oauth_states` (yalnız `service_role`) | Yalnız Edge Functions; uygulama ve kullanıcı oturumu okuyamaz |
| Kişisel denylist | Sahibi | `private/guard-denylist.txt` + Drive yedeği + GitHub Actions secret | Gizlilik bekçisi (değerleri hiçbir yere yazdırmaz) |
| Görünüm tercihi: tema (Sistem / Açık / Koyu), haleyi canlandır | Uygulama | Cihazda AsyncStorage (`hooplab.appearance.v1`); web önizlemesinde tarayıcının localStorage'ı | Yalnız uygulama; hiçbir servise gitmez |
| Kod, belgeler, sentetik demo verisi | Geliştirme | GitHub (ileride public) | Herkes |
| Demo modundaki sentetik sporcu ve demoda girilen kayıtlar | Uygulama içinde üretilir (`apps/mobile/src/demo`, [0022](decisions/0022-demo-modu.md)) | Yalnız cihazın belleği; hiçbir servise gitmez, uygulama kapanınca silinir | Cihazı kullanan |

## Üçüncü taraflara ne gider

| Servis | Ne gider | Ne gitmez |
|---|---|---|
| Google (Health API, OAuth) | Edge Functions'tan salt okuma istekleri (4 kapsam: aktivite, sağlık ölçümleri, uyku, ayarlar); token yenileme ve iptal (sahibinin kendi Google Cloud projesi, [0009](decisions/0009-herkes-kendi-hesabiyla.md), [0019](decisions/0019-google-health-senkronu.md)) | Uygulama girdileri, Supabase verisi |
| Supabase (Frankfurt) | Uygulamanın tüm verisi | — |
| Anthropic API (Faz 3) | Hesaplanmış özet sayılar, ilgili kanıt metinleri, kullanıcının sorusu | Ad, e-posta, doğum tarihi, kimlik bilgileri, ham zaman serileri |
| GitHub | Kod ve belgeler; denylist (şifreli secret olarak) | Sağlık verisi, `private` klasörü |
| Google Drive | `private` klasörünün kopyası | — |
| claude.ai Artifacts | Tasarım maketleri (yalnız sentetik veri), sahibine özel bağlantı | Gerçek sağlık verisi, kişisel bilgi |
| Google Fonts | Maket sayfalarının font istekleri (tarayıcıdan) | Veri. Uygulama Google Fonts'a istek atmaz: fontlar pakete gömülü (`@expo-google-fonts/*`, `packages/theme/fonts`) |
| Expo EAS (Build, Update; [0024](decisions/0024-eas-derleme-ve-guncelleme.md)) | Derleme için uygulama kodu (gitignore'lu dosyalar hariç), herkese açık ortam değerleri (Supabase adresi, publishable anahtar, paket ve proje kimliği), derlenmiş uygulama ve güncelleme paketleri; Apple imza sertifikaları | Sağlık verisi, kullanıcı girdileri, Supabase gizli anahtarı, Google istemci sırrı |
| Expo MCP (`mcp.expo.dev`, Expo plugin'i; geliştirme) | Claude'un Expo dokümanı ve EAS sorguları; Expo hesabıyla giriş gerekir (henüz yetkilendirilmedi) | Sağlık verisi, kişisel bilgi |
| Supabase doküman MCP'si (`mcp.supabase.com`, `features=docs`; geliştirme) | Claude'un doküman arama sorguları | Proje verisi (bu yapılandırma yalnız dokümana erişir) |
| Expo plugin telemetrisi (PostHog) | Hiçbir şey: varsayılan kapalı, opt-in dosyası yok (2026-10-03'te kaynak kodundan doğrulandı) | — |
| Anthropic (Claude Code, geliştirme) | **Geliştirme sohbetlerine yazılan her şey** ve Claude'un okuduğu dosyalar | — |

Son satıra dikkat: geliştirme sırasında sohbete yazılan veya Claude'a okutulan sağlık değerleri de Anthropic'e gider. Kişisel değerleri sohbette paylaşmak bu yüzden bilinçli bir tercih olmalıdır. Test ve geliştirme sentetik veriyle yapılır.

## Saklama ve silme

| Veri | Saklama | Silme |
|---|---|---|
| Supabase verileri | Sahibi silene kadar | Uygulamadan veya Supabase panosundan; tüm hesabın silinmesi projeyi siler |
| Google bağlantısı | Bağlantı kesilene veya izin düşene kadar | Ben → Google Health → Bağlantıyı kes: token Google'da iptal edilir ve silinir; gelmiş cihaz verisi kalır (panodan silinir). Düşen token (7. gün) kendiliğinden silinir |
| Google'daki kaynak veri | Google'ın politikası | Google Health / Google hesabı ayarlarından |
| `private` klasörü ve Drive yedeği | Süresiz | Elle. Yedek eklemelidir: kaynakta silinen dosya yedekte kalır, ayrıca Drive'dan silinmelidir |
| GitHub secret `GUARD_DENYLIST` | Süresiz | Repo ayarları → Secrets |
| Anthropic API'ye giden istekler | Anthropic'in API veri politikası (Faz 3'te güncel haliyle buraya yazılacak) | — |

## İlkeler

- **En az veri:** Bir servis yalnız işi için gereken veriyi alır. AI'ya kimlik bilgisi ve ham zaman serisi gönderilmez.
- **Tek sahip:** Supabase tablolarında RLS, yalnız sahibin oturumuna izin verir.
- **Repo kişisel veri içermez:** pre-commit ve CI'da gizlilik taraması, public öncesi tüm geçmiş taraması ([karar 0005](decisions/0005-repo-ve-gizlilik-ayrimi.md), [0008](decisions/0008-gizlilik-altyapisi-eklemeleri.md)).
