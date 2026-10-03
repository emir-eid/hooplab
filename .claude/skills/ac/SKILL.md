---
name: ac
description: HoopLab oturum açılışı. Durum dosyalarını, son oturum raporlarını, git ve CI durumunu, otomatik görev çıktılarını okur; kaldığımız yeri, dikkat gerektirenleri ve bugün önerilen işi özetler. Kullanıcı /ac yazınca çalışır.
disable-model-invocation: true
---

# /ac — oturum açılışı

Amaç: Yeni oturum, önceki oturumların bıraktığı yerden **tahmin etmeden** devam etsin. Okunan her şey dosyadan veya komut çıktısından gelir.

## Adımlar

1. **Zaman:** `date '+%Y-%m-%d %H:%M %Z'` komutunu çalıştır. Bugünün tarihini buradan al.
2. **Durum:** `docs/STATE.md` dosyasını baştan sona oku.
3. **Son oturumlar:** `docs/sessions/` klasöründeki en yeni iki raporu oku (`README.md` hariç; ada göre sırala, ad zaman damgasıyla başlar). En yeni raporun başlığında **Durum: açık** yazıyorsa önceki oturum `/rep` ile kayda geçmiş ama `/kapat`'sız bitmiştir: "Dikkat" altında yaz; son bloktan sonraki commit'leri (adım 4) ve Drive yedeğini kontrol et.
4. **Git:**
   - `git status -sb`: commit edilmemiş değişiklik var mı, push edilmemiş commit var mı (`ahead`)?
   - `git log --oneline -10`
   - Son oturum raporunda adı geçen son commit ile `HEAD` arasında rapora girmemiş commit var mı? Varsa listele.
5. **CI:** `gh run list -L 3`. Son çalışma başarısızsa `gh run view <id> --log-failed` çıktısından hatanın özünü çıkar (tamamını yapıştırma).
6. **Otomatik görevler:**
   - `docs/audits/` içinde son oturum raporundan **daha yeni** bir denetim raporu varsa oku.
   - `research/inbox/` içinde durumu `bekliyor` olan literatür önerisi var mı?
7. **Dersler ve kapsam:** `docs/LESSONS.md` içinde başlıkları tara; bugünkü olası işle ilgili bölüm varsa onu oku. Önerilecek iş bir modüle, ekrana veya kullanıcı girdisine dokunuyorsa `docs/PRODUCT.md` dosyasının ilgili bölümünü de oku.
8. **Ortam:**
   - **SessionStart hook'u çalıştı mı?** Bu oturumun bağlamında "HoopLab oturum bağlamı (otomatik, SessionStart hook)" başlıklı bir blok yoksa "Dikkat" altında yaz: hook çalışmadı, `.claude/settings.json` hook tanımı kontrol edilmeli.
   - **Plugin'ler yüklü mü?** Kullanılabilir skill listesinde Expo (`expo` plugin) ve Supabase (`supabase`, `postgres-best-practices`) skill'leri yoksa "Dikkat" altında yaz.
   - `../private` klasörü var mı (yoksa uyar: kişisel veri yazılacak yer eksik)?
   - Proje fazına göre gerekli araçlar kurulu mu (STATE.md "Ortam" bölümüne bak)?

## Çıktı (Türkçe, kısa)

```
**Kaldığımız yer:** 2-3 satır (faz, son yapılan iş).

**Dikkat:** (yalnız varsa) CI kırmızı / push edilmemiş commit / rapora girmemiş commit /
denetim bulgusu / bekleyen literatür önerisi / eksik ortam.

**Bugün önerdiğim iş:** STATE.md'deki sıradan 1 ana iş ve en fazla 2 alternatif.
Her biri tek satır: ne ve neden şimdi.

**Önerilen model/efor:** ana iş için tek satır gerekçeyle (ör. "Opus + orta: çok dosyalı ama
tasarımı belli"). Ayarı kullanıcı yapar.

**Senden gerekenler:** (yalnız varsa) kullanıcının yapması gereken manuel adımlar.
```

Sonra kullanıcının seçimini bekle. **Kullanıcı seçmeden işe başlama.**

## Kurallar

- Okuduğun bir dosya eksikse veya bozuksa bunu "Dikkat" altında söyle; uydurma özet üretme.
- Uzun dosya içeriklerini yapıştırma; özetle ve `dosya:satır` referansı ver.
- Bu komut dosya yazmaz ve commit atmaz.
