# Veri envanteri

Hangi veri nerede durur, hangi servise ne gider, ne kadar saklanır, nasıl silinir. Yeni bir veri türü veya yeni bir servis eklendiğinde bu belge aynı commit'te güncellenir.

## Veri türleri

| Veri | Kaynak | Nerede saklanır | Kim / ne erişir |
|---|---|---|---|
| Cihaz verisi: HRV, uyku, nabız, SpO2, solunum, egzersiz | Fitbit Air → Google Health | Google (kaynak); Faz 0 dışa aktarımları `private/data`; Faz 1+ Supabase (Frankfurt) | Sahibi; senkron Edge Function'ı |
| Kullanıcı girdileri: check-in, seans, ağrı haritası, kilo, beslenme, sıvı | Uygulama | Supabase | Sahibi (RLS ile yalnız kendi satırları) |
| Profil: boy, kilo, doğum tarihi, sakatlık geçmişi | Uygulama | Yalnız Supabase | Sahibi; hesap motoru |
| Hesaplanmış değerler: baseline, yük, tahminler, hedefler | Hesap motoru | Supabase | Sahibi; AI koç (özet olarak) |
| AI özetleri ve cevapları | Anthropic API | Supabase | Sahibi |
| Kanıt tabanı: kaynak özetleri, kurallar | Bu repo (`research/`) | GitHub; Supabase (Faz 3, arama için) | Herkese açık (kişisel veri içermez) |
| Kişisel notlar | `/kapat` | `private/journal` + Drive yedeği | Sahibi |
| Claude Code oturum dökümleri | Hook'lar | `private/transcripts` + Drive yedeği | Sahibi |
| Google OAuth istemci sırrı ve token'ları (Faz 0) | `ghealth` setup | `private/ghealth` + Drive yedeği | `ghealth` CLI |
| Kişisel denylist | Sahibi | `private/guard-denylist.txt` + Drive yedeği + GitHub Actions secret | Gizlilik bekçisi (değerleri hiçbir yere yazdırmaz) |
| Kod, belgeler, sentetik demo verisi | Geliştirme | GitHub (ileride public) | Herkes |

## Üçüncü taraflara ne gider

| Servis | Ne gider | Ne gitmez |
|---|---|---|
| Google (Health API) | OAuth ile salt okuma istekleri (sahibinin kendi Google Cloud projesi, [0009](decisions/0009-herkes-kendi-hesabiyla.md)) | Uygulama girdileri |
| Supabase (Frankfurt) | Uygulamanın tüm verisi | — |
| Anthropic API (Faz 3) | Hesaplanmış özet sayılar, ilgili kanıt metinleri, kullanıcının sorusu | Ad, e-posta, doğum tarihi, kimlik bilgileri, ham zaman serileri |
| GitHub | Kod ve belgeler; denylist (şifreli secret olarak) | Sağlık verisi, `private` klasörü |
| Google Drive | `private` klasörünün kopyası | — |
| claude.ai Artifacts | Tasarım maketleri (yalnız sentetik veri), sahibine özel bağlantı | Gerçek sağlık verisi, kişisel bilgi |
| Google Fonts | Maket sayfalarının font istekleri (tarayıcıdan) | Veri |
| Expo MCP (`mcp.expo.dev`, Expo plugin'i; geliştirme) | Claude'un Expo dokümanı ve EAS sorguları; Expo hesabıyla giriş gerekir (henüz yetkilendirilmedi) | Sağlık verisi, kişisel bilgi |
| Supabase doküman MCP'si (`mcp.supabase.com`, `features=docs`; geliştirme) | Claude'un doküman arama sorguları | Proje verisi (bu yapılandırma yalnız dokümana erişir) |
| Expo plugin telemetrisi (PostHog) | Hiçbir şey: varsayılan kapalı, opt-in dosyası yok (2026-10-03'te kaynak kodundan doğrulandı) | — |
| Anthropic (Claude Code, geliştirme) | **Geliştirme sohbetlerine yazılan her şey** ve Claude'un okuduğu dosyalar | — |

Son satıra dikkat: geliştirme sırasında sohbete yazılan veya Claude'a okutulan sağlık değerleri de Anthropic'e gider. Kişisel değerleri sohbette paylaşmak bu yüzden bilinçli bir tercih olmalıdır. Test ve geliştirme sentetik veriyle yapılır.

## Saklama ve silme

| Veri | Saklama | Silme |
|---|---|---|
| Supabase verileri | Sahibi silene kadar | Uygulamadan veya Supabase panosundan; tüm hesabın silinmesi projeyi siler |
| Google'daki kaynak veri | Google'ın politikası | Google Health / Google hesabı ayarlarından |
| `private` klasörü ve Drive yedeği | Süresiz | Elle. Yedek eklemelidir: kaynakta silinen dosya yedekte kalır, ayrıca Drive'dan silinmelidir |
| GitHub secret `GUARD_DENYLIST` | Süresiz | Repo ayarları → Secrets |
| Anthropic API'ye giden istekler | Anthropic'in API veri politikası (Faz 3'te güncel haliyle buraya yazılacak) | — |

## İlkeler

- **En az veri:** Bir servis yalnız işi için gereken veriyi alır. AI'ya kimlik bilgisi ve ham zaman serisi gönderilmez.
- **Tek sahip:** Supabase tablolarında RLS, yalnız sahibin oturumuna izin verir.
- **Repo kişisel veri içermez:** pre-commit ve CI'da gizlilik taraması, public öncesi tüm geçmiş taraması ([karar 0005](decisions/0005-repo-ve-gizlilik-ayrimi.md), [0008](decisions/0008-gizlilik-altyapisi-eklemeleri.md)).
