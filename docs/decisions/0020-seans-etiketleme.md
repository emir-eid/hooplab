# 0020. Seans etiketleme: saat oturumu ile seans kaydı bire bir bağlanır, tür ve RPE kullanıcıdan

- **Durum:** Kabul edildi; yerelde (pgTAP + web önizlemesi, sentetik veri), bulutta ve iPhone'da (Expo Go) doğrulandı (2026-10-04)
- **Tarih:** 2026-10-04
- **İlgili:** [0015](0015-veritabani-tek-sahip-rls.md), [0017](0017-sabah-check-in-olcegi.md), [0019](0019-google-health-senkronu.md), ROADMAP Faz 1, `research/rules/yuk.json`

## Bağlam
Saat egzersiz oturumlarını kaydediyor (başlangıç, bitiş, nabız), ama basketbolda maç, takım antrenmanı ve şut çalışmasını ayıramıyor: basketbol `SPORT` veya `BASKETBALL` tipinde geliyor (LESSONS). Seans yükü (RPE × dakika) için tür ve RPE yalnız sporcudan gelebilir. Buluttaki oturumlarda kuvvet antrenmanı, yoga, crossfit ve yürüyüş tipleri de görüldü; yoganın seans türlerinde karşılığı yoktu. Elle girilen seans kaydı (`training_sessions`) ile senkronun yazdığı oturum (`exercise_sessions`) ayrı tablolardı.

## Seçenekler
1. **Bağlantı nerede:** (a) `exercise_sessions` üzerinde tür sütunu; (b) `training_sessions` üzerinde saat oturumuna dış anahtar. (b) seçildi: cihaz verisi tablosunun sahibi senkron kalır (0019), seans kaydı tek yerde durur, saat olmadan girilen kayıt da aynı tabloda.
2. **Sahiplik:** (a) yalnız RLS; (b) bileşik dış anahtar `(exercise_session_id, user_id) → exercise_sessions (id, user_id)`. (b) seçildi: başkasının oturumuna bağlanmak veritabanı düzeyinde imkansız; RLS'e ek bir kat.
3. **"Seans değil" (ör. yürüyüş):** (a) ayrı bir kullanıcı tablosu; (b) `exercise_sessions.dismissed_at`, sahibine yalnız bu sütunda UPDATE (sütun düzeyinde GRANT). (b) seçildi: tek sütun, senkronun upsert'ü bu sütunu yazmadığı için işaret korunur.
4. **Yoga:** (a) yeni tür "Mobilite / yoga"; (b) rehabilitasyon say; (c) seans sayma. Kullanıcı (a)'yı seçti.
5. **Etiketleme aralığı:** (a) bugün ve dün; (b) son 7 gün. Kullanıcı (a)'yı seçti: seans formunun gün sınırıyla aynı, RPE taze hatırlanır. Daha eski oturumlar etiketsiz kalır.

## Karar
- Migration `seans_etiketleme`: `training_sessions.exercise_session_id` (benzersiz; bir saat oturumu en fazla bir kayda bağlanır), bileşik dış anahtar, saat oturumu silinirse yalnız bağlantı boşalır (`on delete set null (exercise_session_id)`); `exercise_sessions.dismissed_at`; tür listesine `mobility`.
- Bugün ekranında **Saatten gelenler**: bugün ve dün kaydedilmiş, bağlanmamış ve "Seans değil" denmemiş oturumlar.
- Dokununca seans formu etiketleme modunda açılır (`/session-new?exercise=<id>`): gün ve başlangıç saatten; süre başından sonuna geçen dakika (ısınma ve aralar dahil, `yuk.json → seans-yuku`), 5 dakikalık adıma yuvarlanmış, değiştirilebilir. Kesin tiplerde tür önceden seçilir (kuvvet antrenmanı → Kuvvet, crossfit → Kondisyon, yoga → Mobilite / yoga); basketbol ve "Spor"da öneri yok. RPE her zaman kullanıcıdan.
- Aynı güne elle girilmiş bağlanmamış kayıt varsa formun başında "Bu seansı zaten girdin mi?" sorulur; tek dokunuşla bağlanır (`started_at` saatten yazılır).
- "Seans değil, listeden kaldır" oturumu listeden çıkarır; geri alma arayüzü şimdilik yok.

## Sonuçlar
- Yük hesabı (Faz 2) etiketli oturumlarda saatin zamanını ve nabzını seans kaydıyla birlikte kullanabilir. Etiketsiz saat oturumu yük hesabına girmez.
- Kullanıcı saat oturumunda yalnız `dismissed_at` sütununu değiştirebilir; pgTAP testi tür, zaman ve sahip sütunlarının kapalı olduğunu denetler.
- **Yeniden değerlendirme tetikleyicisi:** etiketlenmemiş oturumlar birikirse (2 günlük aralık yetmezse), "Seans değil" yanlışlıkla seçilip geri alma gerekirse, Google basketbola özgü tipi tutarlı vermeye başlarsa, otomatik eşleştirme (saat aralığı örtüşmesi) istenirse.
