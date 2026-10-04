# 0019. Google Health senkronu: Web OAuth istemcisi + Edge Functions, günlük özetler, saatlik zamanlayıcı

- **Durum:** Kabul edildi; yerelde sahte Google ile, bulutta gerçek hesapla ve iPhone'da (Expo Go) doğrulandı (2026-10-04)
- **Tarih:** 2026-10-04
- **İlgili:** [0001](0001-veri-kaynagi-google-health-api.md), [0009](0009-herkes-kendi-hesabiyla.md), [0015](0015-veritabani-tek-sahip-rls.md), [0016](0016-dis-servisleri-claude-yurutur.md), ROADMAP Faz 1

## Bağlam
Fitbit Air verisi Google Health API v4'ten sunucu tarafında çekilmeli. Google OAuth sırrı ve token'lar uygulamaya girmemeli (0001). Faz 0'daki OAuth istemcisi "Desktop app" türünde; yalnız `127.0.0.1` geri dönüş adresi kabul ediyor, sunucuya dönülemiyor. Testing modunda yenileme token'ı 7 günde düşüyor; haftalık yeniden bağlanma uygulamadan yapılabilmeli. Gün içi nabız günde ~35 bin örnek (LESSONS); Edge Functions istek başına 2 sn CPU ve 150 sn süreyle sınırlı. Adım ve mesafe iki kaynaktan (bileklik, iPhone) geliyor. API alan adları resmi discovery belgesinden (revizyon 20261001) ve `ghealth` kaynağından doğrulandı.

## Seçenekler
1. **Token aktarımı:** (a) `ghealth`'in yerel token'ını elle Supabase'e kopyalamak; haftalık yenileme bilgisayardan. (b) Web uygulaması türünde ikinci bir OAuth istemcisi; izin ekranı telefondan açılır, Google Edge Function'a döner. (b) seçildi: yeniden bağlanma telefondan iki dokunuş.
2. **Gün içi nabız:** (a) ham örnekleri çekip sunucuda özetlemek; (b) Google'ın `dailyRollUp` günlük özeti (en düşük / ortalama / en yüksek). (b) seçildi: ham veri sunucuya hiç gelmez, CPU sınırı sorun olmaz, aynı bilgi.
3. **Adım / mesafe tekilleştirme:** (a) kaynakları kendimiz ayırmak; (b) özetleri `google-wearables` kaynak ailesinden istemek. (b) seçildi: yalnız bileklik sayılır; iPhone'un adımı ve elle girilen veri karışmaz. Bileklik takılmadığı saatlerin adımı eksik kalır (kabul edildi; yük hesabı zaten bilekliğe dayanır).
4. **Zamanlayıcının kimliği:** (a) Supabase gizli anahtarını Vault'a koymak; (b) yalnız bu iş için ayrı bir paylaşılan sır (Vault + Edge Function sırrı). (b) seçildi: gizli anahtar veritabanına girmez, sır sızsa yalnız senkron tetiklenebilir.
5. **Saklama biçimi:** günlük metrikler tek geniş tablo (`health_daily`, gün başına satır, tip başına sütun); uyku ve egzersiz oturum tabloları.

## Karar
- Üç Edge Function: `ghealth-connect` (oturum JWT'si; izin adresi + tek kullanımlık durum + PKCE S256, bağlantıyı kesme), `ghealth-callback` (Google dönüşü; durum tek kullanımlık ve 15 dakikalık; token yalnız sunucu tablosuna; ilk senkron arka planda), `ghealth-sync` (kullanıcı JWT'si → yalnız kendisi; `x-hooplab-cron` paylaşılan sırrı → bağlı tüm kullanıcılar). JWT denetimi `@supabase/server` 1.9.0 ile kodda; platform `verify_jwt` kapalı.
- Kapsamlar en az yetkiyle, hepsi salt okuma: `activity_and_fitness`, `health_metrics_and_measurements`, `sleep`, `settings` (saat dilimi).
- Çekilen tipler: günlük HRV, dinlenik nabız, SpO2, solunum hızı, gece cilt sıcaklığı (list); nabız, adım, mesafe, toplam kalori, aktif bölge dakikası (`dailyRollUp`, `google-wearables`; nabız ve kalori 14 gün, diğerleri 90 gün parçalanır); uyku ve egzersiz oturumları (list, 25'lik sayfa). `swim-lengths-data` alınmaz. Egzersizin serbest metin notu alınmaz. Uyku evre zaman çizelgesi saklanmaz, yalnız toplamlar.
- Pencere: ilk bağlanışta son 90 gün; sonra her senkronda son 7 gün yeniden çekilir (geç eşitleme, sonradan işlenen uyku). Senkron tarihi yalnız tüm tipler başarılıysa ilerler; bir tip hata verirse sonraki senkron aynı pencereyi yeniden dener (ilk bulut denemesinde kısmi hatada ilerleyip eski günleri kaçırmıştı). Günler Google hesabındaki saat dilimine göre. Değer alanı olmayan gün yazılmaz ("veri yok" sıfır değildir); bir tipin güncellemesi başka tipin sütununu silmez.
- Veritabanı: cihaz verisi tablolarında sahibi yalnız SELECT alır (yazma yolu yalnız senkron); token ve OAuth durumu tablolarında hiç politika ve kullanıcı yetkisi yok, yalnız `service_role`. Zamanlayıcı `pg_cron` (her saatin 17. dakikası) → `private.trigger_google_health_sync()` → `pg_net`; adres ve sır Vault'ta (`project_url`, `ghealth_cron_secret`), yoksa hiçbir şey yapmaz.
- Uygulama: Ben → Google Health ekranı (durum, son senkron, veri aralığı, tahmini izin süresi; bağlan / yeniden bağlan, şimdi senkronla, izni yenile, bağlantıyı kes). İzin ekranı `expo-web-browser` `openAuthSessionAsync` ile; dönüş adresi yalnız uygulama şemaları (`hooplab`, `exp`, `exps`) ve yerel önizleme olabilir (açık yönlendirme yok).

## Sonuçlar
- Kullanıcı Google Cloud'da bir kez Web uygulaması türünde OAuth istemcisi açar ve geri dönüş adresini (`<proje adresi>/functions/v1/ghealth-callback`) ekler ([rehber](../guides/google-health-baglantisi.md)). İstemci kimliği ve sırrı Supabase secrets'ta.
- Testing modunda her 7 günde bir uygulamadan yeniden bağlanılır; süre dolunca durum `reconnect_required` olur ve token silinir. Ekrandaki kalan gün tahmindir.
- Yanıtlarda ve günlüklerde sağlık değeri yok: yalnız sonuç, sayım ve hata kodu.
- Yerel deneme: `node tools/dev/fake-google-health.ts` + `supabase functions serve --env-file supabase/functions/.env` (sentetik, gitignore'lu; [SETUP](../SETUP.md) §9).
- Edge Function kodu Deno'da; Deno bu makinede yok. Tip denetimi `supabase/functions/tsconfig.json` ile (`npm:` adresleri repodaki aynı sürüm paketlere eşlenir), saf modüller Node testleriyle.
- **Yeniden değerlendirme tetikleyicisi:** OAuth uygulaması yayımlanırsa (7 gün sınırı kalkar), Google kaynak ailesi veya rollup davranışını değiştirirse, bileklik dışı adım gerekirse, gün içi nabız zaman serisi bir model için gerekirse (o zaman özet yerine saatlik özet düşünülür).
