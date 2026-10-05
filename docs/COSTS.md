# Hesaplar, maliyetler ve sırlar

Projenin dayandığı hesaplar, ne zaman açılacakları, maliyetleri ve sırların nerede durduğu. Fiyatlar değişebilir: **[kaynaklı]** resmi kaynakta görüldü · **[doğrulanacak]** hesap açılırken güncel fiyat sayfasından teyit edilecek.

## Hesaplar

| Servis | Ne için | Ne zaman | Maliyet | Durum |
|---|---|---|---|---|
| GitHub (`emir-eid`) | Repo, Actions kontrolleri, secret'lar | var | Ücretsiz plan; private repoda Actions'ın aylık ücretsiz dakika kotası var, iş akışımız çalışma başına ~10 saniye | açık |
| Google Cloud | Google Health API, OAuth istemcisi (Testing modu) | Faz 0 | Faturalandırma hesabı bağlı değil, bu yüzden ücret çıkamaz. Google Health API'nin fiyatlandırması **[doğrulanacak]** | açık (2026-10-03) |
| Expo | EAS Build (bulutta iOS derleme), EAS Update, Expo MCP | Faz 1 | Ücretsiz plan: ayda 15 iOS derlemesi, düşük öncelikli kuyruk, derleme başına 45 dk; EAS Update 1.000 aylık aktif kullanıcıya kadar; ilk ücretli plan (Starter) aylık 19$ + kullanım **[kaynaklı]** (expo.dev/pricing, 2026-10-05) | açık (2026-10-05): proje **mevcut kişisel Expo hesabında** (bu bilgisayarın girişli olduğu hesap; ayrı hesap açılmadı, kullanıcı kararı, CLAUDE.md §7 istisnası, [0024](decisions/0024-eas-derleme-ve-guncelleme.md)). Derleme kotası öbür projeyle paylaşılır. Hesap ve proje kimliği repoya yazılmaz (`.env.local` + EAS ortam değişkenleri) |
| Supabase | Veritabanı, giriş, Edge Functions, zamanlayıcı (Frankfurt) | Faz 1 | Ücretsiz plan (Edge Functions: istek başına 2 sn CPU, 150 sn süre; saatlik senkron ayda ~720 çağrı) **[kaynaklı]**; hesap başına en fazla 2 aktif ücretsiz proje, duraklatılanlar sayılmaz **[kaynaklı]**; 7 gün istek gelmezse duraklatma **[kaynaklı]**. Sızan şifre koruması yalnız Pro'da **[kaynaklı]**. Gerekirse Pro plan, aylık ~25$ **[doğrulanacak]** | açık (2026-10-04). Ana hesabın ücretsiz kotası dolu olduğu için **yalnız HoopLab'e ayrılmış ikinci bir Supabase hesabında** (adres repoya yazılmaz); organizasyon `HoopLab`, proje `hooplab`, `eu-central-1`. Supabase CLI bu makinede o hesapla girişli (§7, [0016](decisions/0016-dis-servisleri-claude-yurutur.md)) |
| Apple Developer Programı | TestFlight, uygulamanın kalıcı kurulumu, bildirimler | Faz 1 sonu | Yıllık 99 USD, kayıtta yerel para birimiyle gösterilir **[kaynaklı]** (developer.apple.com/programs/enroll, 2026-10-05). TestFlight derlemesi 90 gün geçerli; iç testte Apple incelemesi yok **[kaynaklı]** | kayıt sürüyor (2026-10-05): uygulamadan kimlik doğrulaması reddedildi, Apple Developer desteğinde vaka açık |
| Anthropic API (Console) | Uygulamadaki AI koç (Edge Functions) | Faz 3 | Kullanıma göre ödeme; **Claude aboneliğinden ayrı faturalanır**. Hesap açılınca aylık harcama limiti konur | açılmadı |
| Google Drive | `private` klasörünün yedeği | var | Mevcut kota | kullanımda |

Faz 3'e kadar zorunlu ücret yalnız Apple Developer Programı (Faz 1 sonu). Model seçimi ve tahmini aylık AI maliyeti Faz 3 başında güncel fiyat listesiyle hesaplanıp buraya yazılır.

## Sırlar nerede durur

Kural: hiçbir sır repoda, uygulama paketinde veya `EXPO_PUBLIC_` değişkeninde olmaz ([CLAUDE.md §2](../CLAUDE.md)).

| Sır | Faz 0 | Faz 1 ve sonrası |
|---|---|---|
| Google OAuth istemci sırrı | `private/ghealth/client_secret.json` (Desktop istemcisi, `ghealth` CLI; Drive yedeğine de girer) | Web istemcisinin kimliği ve sırrı Supabase secrets'ta (`GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_CLIENT_SECRET`); indirilen JSON `private/ghealth/` altında ([0019](decisions/0019-google-health-senkronu.md)) |
| Google erişim / yenileme token'ları | `private/ghealth/credentials.json` (Drive yedeğine de girer; yenileme token'ı 7 günde düşer) | Yenileme token'ı `public.google_health_tokens` (RLS açık, politika yok, yalnız `service_role`); erişim token'ı saklanmaz, her senkronda yenilenir |
| Zamanlayıcı paylaşılan sırrı | — | Supabase secrets `GHEALTH_CRON_SECRET` + Vault `ghealth_cron_secret` (aynı değer; yalnız senkronu tetikleyebilir). Proje adresi Vault `project_url` |
| Supabase service role / secret anahtarı | — | Yalnız Supabase panosu ve Edge Functions ortamı; mobil koda giremez (bekçi kuralı) |
| Supabase publishable anahtarı ve proje adresi | — | `apps/mobile/.env.local` (gitignore'lu; herkese açık olmak üzere tasarlanmıştır, erişimi RLS korur). Repoya yazılmaz (0009) |
| Supabase veritabanı şifresi | — | Kullanıcının şifre yöneticisi. CLI işlemleri giriş token'ıyla yapıldığı için günlük işte gerekmez |
| Supabase CLI erişim token'ı | — | Bu makinede CLI'ın kendi deposu (`supabase login`). HoopLab hesabına tam erişim verir; hesapta başka proje yok. Gerekirse `supabase logout` |
| Uygulama giriş şifresi | — | Kullanıcının şifre yöneticisi. Uygulamada oturum token'ları iPhone Keychain'de |
| Anthropic API anahtarı | — | Supabase secrets (Faz 3) |
| Apple imza sertifikaları | — | EAS yönetir |
| App Store Connect API anahtarı (`.p8`) | — | `private/` (Apple onayından sonra); EAS'a yüklenirse EAS'ın kimlik deposunda. Repoya ve sohbete girmez |
| EAS ortam değişkenleri (production) | — | EAS projesi: `HOOPLAB_IOS_BUNDLE_ID`, `HOOPLAB_EAS_PROJECT_ID`, `HOOPLAB_EAS_OWNER`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; hepsi herkese açık değerler, sır değil ([0024](decisions/0024-eas-derleme-ve-guncelleme.md)) |
| Kişisel denylist | `../private/guard-denylist.txt` | + GitHub Actions secret `GUARD_DENYLIST` |
