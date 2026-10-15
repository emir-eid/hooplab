# 0045. Bildirimler: telefonda zamanlanan yerel hatırlatmalar (check-in ve Google izni)

- **Durum:** Kabul edildi. Uygulama testleri geçti. Web önizlemesinde ekran doğrulandı (web'de bildirim zamanlanmaz). iPhone'da Expo Go ile izin ve deneme bildirimi doğrulandı.
- **Tarih:** 2026-10-15
- **İlgili:** [0017](0017-sabah-check-in-olcegi.md) (check-in), [0019](0019-google-health-senkronu.md) (7 günlük izin), [0024](0024-eas-derleme-ve-guncelleme.md) (derleme), [0036](0036-mac-gunu-isareti.md) (maç günü)

## Bağlam
ROADMAP Faz 4'te "Bildirimler" maddesi var. Kullanıcı (2026-10-15) üç bildirim seçti: Google Health yeniden bağlanma, sabah check-in ve maç günü hatırlatması.

Kısıtlar (Expo SDK 57 belgesi, `expo-notifications` 57.0.23 tip dosyalarından doğrulandı):
- Uygulama içinden zamanlanan yerel bildirimler Expo Go'da çalışıyor.
- Sunucudan gelen push için ayrı derleme (development build) gerekiyor; o da Apple üyeliğini bekliyor.

## Karar
- **Yalnız yerel bildirim.** Plan telefonda kurulur, sunucu, push ve bildirim token'ı yok. Planı saf modül `data/notification-plan.ts` kurar; `notifications/scheduler.ts` telefona zamanlar.
- **Ne zaman yenilenir:** uygulama her öne geldiğinde, check-in kaydında, Google bağlantısı kurulup kesildiğinde ve tercih değiştiğinde. Her seferinde önce HoopLab'in kendi bildirimleri silinir (kimlik öneki `hooplab-`), sonra plan yeniden yazılır.
- **Sabah check-in'i:** seçilen saatte (05:00-12:00, 15 dakikalık adım, varsayılan 08:30). Önümüzdeki 7 gün için tek tek zamanlanır, böylece check-in'i yapılmış gün atlanabilir. Uygulama 7 gün hiç açılmazsa hatırlatmalar durur.
- **Google izni:**
  - İzin bağlanma anından 7 gün sonra dolar (Google'ın Testing kuralı, `TOKEN_LIFETIME_DAYS`). Dolmadan 24 ve 3 saat önce hatırlatma gelir.
  - Senkron durmuşsa (`reconnect_required`) bir sonraki 09:00'da tek hatırlatma gelir.
  - Bu sayılar gösterim ve kullanım tercihi; bilimsel eşik değil.
- **Metin:** kilit ekranında görünür, bu yüzden sağlık değeri ya da sayı içermez (testle denetlenir). Dokununca check-in ya da Ben → Google Health açılır.
- **Ayar:** Ben → Bildirimler. Anahtar açılınca izin istenir; reddedilmişse "Ayarlar'ı aç" satırı çıkar. Tercih cihazda (`AsyncStorage`) saklanır, sunucuya gitmez. Ekranda "Deneme bildirimi gönder" satırı var. Demoda ve web'de bildirim zamanlanmaz.
- **Maç günü hatırlatması ertelendi.** "Bugün maç var" işareti yalnız o gün konabiliyor ([0036](0036-mac-gunu-isareti.md)); maç sabahı hatırlatması için maç tarihi önceden bilinmeli. Maç takvimiyle birlikte "maç günü ve seyahat protokolleri" işinde gelecek.
- **`expo-notifications` yapılandırma eklentisi eklenmedi.** Yerel bildirim onsuz çalışıyor; eklenti iOS'ta push yetkisi (`aps-environment`) ekliyor ve bu ilk derlemeyi gereksiz yere bağlar. Push gelince eklenecek.

## Sonuçlar
- Bildirim telefonda kalır; Apple'ın push servisi ve Supabase kullanılmaz. Yeni sır ve ücret yok.
- Sunucu tarafı bir olaya (ör. yeni gece işareti, koç özeti hazır) bağlı bildirim bu yolla yapılamaz. TestFlight'tan sonra push ayrı bir kararla değerlendirilir; motorun sunucuya taşınması da gerekebilir ([0032](0032-ai-koc-tasarimi.md)).
- Telefonun saati ve saat dilimi esas alınır: seyahatte check-in hatırlatması bulunulan yerin saatine göre gelir.
