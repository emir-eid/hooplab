# Hesaplar, maliyetler ve sırlar

Projenin dayandığı hesaplar, ne zaman açılacakları, maliyetleri ve sırların nerede durduğu. Fiyatlar değişebilir: **[kaynaklı]** resmi kaynakta görüldü · **[doğrulanacak]** hesap açılırken güncel fiyat sayfasından teyit edilecek.

## Hesaplar

| Servis | Ne için | Ne zaman | Maliyet | Durum |
|---|---|---|---|---|
| GitHub (`emir-eid`) | Repo, Actions kontrolleri, secret'lar | var | Ücretsiz plan; private repoda Actions'ın aylık ücretsiz dakika kotası var, iş akışımız çalışma başına ~10 saniye | açık |
| Google Cloud | Google Health API, OAuth istemcisi | Faz 0 | Google Health API ücreti **[doğrulanacak]** | açılmadı |
| Expo | EAS Build (bulutta iOS derleme), EAS Update, Expo MCP | Faz 1 başı | Ücretsiz plan; aylık derleme kotası sınırlı **[doğrulanacak]** | açılmadı |
| Supabase | Veritabanı, giriş, Edge Functions, zamanlayıcı (Frankfurt) | Faz 1 | Ücretsiz plan; 7 gün istek gelmezse duraklatma **[kaynaklı]**. Gerekirse Pro plan, aylık ~25$ **[doğrulanacak]** | açılmadı |
| Apple Developer Programı | TestFlight, uygulamanın kalıcı kurulumu, bildirimler | Faz 1 sonu | Yıllık 99$ **[kaynaklı]** | açılmadı |
| Anthropic API (Console) | Uygulamadaki AI koç (Edge Functions) | Faz 3 | Kullanıma göre ödeme; **Claude aboneliğinden ayrı faturalanır**. Hesap açılınca aylık harcama limiti konur | açılmadı |
| Google Drive | `private` klasörünün yedeği | var | Mevcut kota | kullanımda |

Faz 3'e kadar zorunlu ücret yalnız Apple Developer Programı (Faz 1 sonu). Model seçimi ve tahmini aylık AI maliyeti Faz 3 başında güncel fiyat listesiyle hesaplanıp buraya yazılır.

## Sırlar nerede durur

Kural: hiçbir sır repoda, uygulama paketinde veya `EXPO_PUBLIC_` değişkeninde olmaz ([CLAUDE.md §2](../CLAUDE.md)).

| Sır | Faz 0 | Faz 1 ve sonrası |
|---|---|---|
| Google OAuth istemci sırrı | `ghealth` CLI'ın yerel ayarı (repo dışı, kullanıcı klasörü) | Supabase secrets |
| Google erişim / yenileme token'ları | `ghealth` CLI'ın yerel ayarı | Supabase (yalnız Edge Functions'ın erişebildiği tablo / Vault) |
| Supabase service role / secret anahtarı | — | Yalnız Supabase panosu ve Edge Functions ortamı; mobil koda giremez (bekçi kuralı) |
| Supabase publishable anahtarı | — | `.env.local` (herkese açık olmak üzere tasarlanmıştır; erişim RLS ile korunur) |
| Anthropic API anahtarı | — | Supabase secrets (Faz 3) |
| Apple imza sertifikaları | — | EAS yönetir |
| Kişisel denylist | `../private/guard-denylist.txt` | + GitHub Actions secret `GUARD_DENYLIST` |
