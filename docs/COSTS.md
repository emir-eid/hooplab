# Hesaplar, maliyetler ve sırlar

Projenin dayandığı hesaplar, ne zaman açılacakları, maliyetleri ve sırların nerede durduğu. Fiyatlar değişebilir: **[kaynaklı]** resmi kaynakta görüldü · **[doğrulanacak]** hesap açılırken güncel fiyat sayfasından teyit edilecek.

## Hesaplar

| Servis | Ne için | Ne zaman | Maliyet | Durum |
|---|---|---|---|---|
| GitHub (`emir-eid`) | Repo, Actions kontrolleri, secret'lar | var | Ücretsiz plan; private repoda Actions'ın aylık ücretsiz dakika kotası var, iş akışımız çalışma başına ~10 saniye | açık |
| Google Cloud | Google Health API, OAuth istemcisi (Testing modu) | Faz 0 | Faturalandırma hesabı bağlı değil, bu yüzden ücret çıkamaz. Google Health API'nin fiyatlandırması **[doğrulanacak]** | açık (2026-10-03) |
| Expo | EAS Build (bulutta iOS derleme), EAS Update, Expo MCP | Faz 1 başı | Ücretsiz plan; aylık derleme kotası sınırlı **[doğrulanacak]** | HoopLab için açılmadı. Geliştirmede Expo Go, bu bilgisayarda Expo CLI'nin girişli olduğu başka bir projenin hesabıyla açılıyor; yerel sunucu expo.dev'de proje oluşturmaz. HoopLab'in hesabı EAS işinde kararlaştırılacak |
| Supabase | Veritabanı, giriş, Edge Functions, zamanlayıcı (Frankfurt) | Faz 1 | Ücretsiz plan; hesap başına en fazla 2 aktif ücretsiz proje, duraklatılanlar sayılmaz **[kaynaklı]**; 7 gün istek gelmezse duraklatma **[kaynaklı]**. Sızan şifre koruması yalnız Pro'da **[kaynaklı]**. Gerekirse Pro plan, aylık ~25$ **[doğrulanacak]** | açık (2026-10-04). Ana hesabın ücretsiz kotası dolu olduğu için **yalnız HoopLab'e ayrılmış ikinci bir Supabase hesabında** (adres repoya yazılmaz); organizasyon `HoopLab`, proje `hooplab`, `eu-central-1`. Supabase CLI bu makinede o hesapla girişli (§7, [0016](decisions/0016-dis-servisleri-claude-yurutur.md)) |
| Apple Developer Programı | TestFlight, uygulamanın kalıcı kurulumu, bildirimler | Faz 1 sonu | Yıllık 99$ **[kaynaklı]** | açılmadı |
| Anthropic API (Console) | Uygulamadaki AI koç (Edge Functions) | Faz 3 | Kullanıma göre ödeme; **Claude aboneliğinden ayrı faturalanır**. Hesap açılınca aylık harcama limiti konur | açılmadı |
| Google Drive | `private` klasörünün yedeği | var | Mevcut kota | kullanımda |

Faz 3'e kadar zorunlu ücret yalnız Apple Developer Programı (Faz 1 sonu). Model seçimi ve tahmini aylık AI maliyeti Faz 3 başında güncel fiyat listesiyle hesaplanıp buraya yazılır.

## Sırlar nerede durur

Kural: hiçbir sır repoda, uygulama paketinde veya `EXPO_PUBLIC_` değişkeninde olmaz ([CLAUDE.md §2](../CLAUDE.md)).

| Sır | Faz 0 | Faz 1 ve sonrası |
|---|---|---|
| Google OAuth istemci sırrı | `private/ghealth/client_secret.json` (`GHEALTH_CONFIG_DIR`; Drive yedeğine de girer) | Supabase secrets |
| Google erişim / yenileme token'ları | `private/ghealth/credentials.json` (Drive yedeğine de girer; yenileme token'ı 7 günde düşer) | Supabase (yalnız Edge Functions'ın erişebildiği tablo / Vault) |
| Supabase service role / secret anahtarı | — | Yalnız Supabase panosu ve Edge Functions ortamı; mobil koda giremez (bekçi kuralı) |
| Supabase publishable anahtarı ve proje adresi | — | `apps/mobile/.env.local` (gitignore'lu; herkese açık olmak üzere tasarlanmıştır, erişimi RLS korur). Repoya yazılmaz (0009) |
| Supabase veritabanı şifresi | — | Kullanıcının şifre yöneticisi. CLI işlemleri giriş token'ıyla yapıldığı için günlük işte gerekmez |
| Supabase CLI erişim token'ı | — | Bu makinede CLI'ın kendi deposu (`supabase login`). HoopLab hesabına tam erişim verir; hesapta başka proje yok. Gerekirse `supabase logout` |
| Uygulama giriş şifresi | — | Kullanıcının şifre yöneticisi. Uygulamada oturum token'ları iPhone Keychain'de |
| Anthropic API anahtarı | — | Supabase secrets (Faz 3) |
| Apple imza sertifikaları | — | EAS yönetir |
| Kişisel denylist | `../private/guard-denylist.txt` | + GitHub Actions secret `GUARD_DENYLIST` |
