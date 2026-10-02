# 0005. Repo ve gizlilik: code/private ayrımı, önce private sonra public

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0003, 0006

## Bağlam
Kod GitHub'da public paylaşılıp CV ve portfolyoda kullanılacak. Ama uygulama sahibinin sağlık verisini işliyor. Public bir repoya bir kez giren veri, sonradan silinse bile fork'lar ve önbellekler yüzünden geri alınamayabilir.

## Seçenekler
1. **Tek klasör, `private/` gitignore'lu:** Basit, ama yanlış bir `git add -f` veya hatalı ignore kuralı sızıntıya yol açar.
2. **Fiziksel ayrım:** `E:\HoopLab\code` (repo) ve `E:\HoopLab\private` (repo dışı); bekçiler ve CI taraması.
3. **Hep private repo:** Sızıntı riski en düşük, ama portfolyoda gösterilemez.

## Karar
Fiziksel ayrım. Kişisel veri, dökümler ve kişisel notlar `private` klasöründe, repo dışında. Repo önce private açılır; Faz 1 sonunda tüm git geçmişi taranıp public yapılır.

## Sonuçlar
- Repo yalnız kod, şema, sentetik demo verisi, kanıt tabanı (DOI ve kendi özetlerimiz) ve süreç belgelerini içerir.
- Sırlar `.env.local` veya Supabase secrets içinde; `EXPO_PUBLIC_` değerleri herkese açık sayılır.
- Bekçiler: pre-commit gizlilik taraması (yollar, sır kalıpları, repo dışında tutulan kişisel denylist), pre-push ve CI'da tüm repo taraması. Bekçiler fail-closed ve negatif testli.
- Commit'ler GitHub noreply e-postasıyla.
- Ekran görüntüleri ve demo, sentetik "demo sporcu" verisiyle.
- Public'e geçiş öncesi kontrol listesi ROADMAP Faz 1'de: tüm geçmişte tarama, README, LICENSE, GitHub secret scanning ve push protection.
- **Yeniden değerlendirme tetikleyicisi:** Sızıntı şüphesi olursa repo hemen private'a alınır ve geçmiş temizliği kararı verilir.
