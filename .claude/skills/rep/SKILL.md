---
name: rep
description: HoopLab ara rapor. Oturumu kapatmadan, biten işi oturum raporuna yeni bir blok olarak yazar; gerekiyorsa karar kaydı, ders ve faz özeti ekler; STATE ve CHANGELOG'u günceller; doğrulamaları koşar, commit atar ve push'lar; yapılan işi ayrıntılı aktarıp sıradaki işi önerir. Kullanıcı /rep yazınca çalışır.
disable-model-invocation: true
---

# /rep — ara rapor

Amaç: Bir iş bitince, oturumu kapatmadan, o işi `/kapat` kadar eksiksiz kayda geçirmek ve push'lamak. Böylece bağlam dolana kadar aynı oturumda sıradaki işe geçilir; `/kapat` → `/clear` → `/ac` döngüsü yalnız bağlam dolunca kullanılır ([0012](../../../docs/decisions/0012-ara-rapor-rep.md)). Kullanıcının `/rep` yazması, bu adımlardaki commit ve push için onaydır.

## Adımlar

1. **Zaman damgası:** `date '+%Y-%m-%d-%H%M'` (dosya adı için) ve `date '+%Y-%m-%d %H:%M'` (metin için). Asla tahmin etme.
2. **Topla:**
   - `git status`, `git diff --stat`
   - Bu bloğun commit'leri: bu oturumun son `/rep` commit'inden (yoksa son oturum raporundaki son commit'ten) `HEAD`'e kadar.
   - Konuşmadaki kararlar, sorunlar, kullanıcı talimatları; yalnız son `/rep`'ten sonrası.
3. **Kişisel veriyi ayır (önce bu):** `/kapat` adım 3 ile aynı. Sağlık değeri, ölçü, sakatlık veya kişisel bilgi yalnız `../private/journal/<YYYY-MM-DD-HHMM>-<konu>.md` dosyasına gider; repoya girmez.
4. **Oturum raporu:**
   - Bu oturumda henüz rapor yoksa `docs/sessions/<YYYY-MM-DD-HHMM>-<kisa-konu>.md` dosyasını [docs/sessions/README.md](../../../docs/sessions/README.md) şablonuyla aç; başlıkta **Durum: açık**.
   - Varsa (bu oturumda önceki bir `/rep` açtıysa) dosyanın sonundaki "Açık kalanlar" bölümünün **üstüne** yeni bir `## Blok N — <iş> (SS:DD)` ekle. Önceki blokları değiştirme.
   - Blok içeriği: Amaç, Yapılanlar (dosya ve commit'lerle), Kararlar, Sorunlar ve hatalar, Öğrenilenler. Boş alt başlık "yok" yazılır.
   - "Açık kalanlar" ve "Sıradaki adım" bölümlerini güncel duruma göre yeniden yaz (bunlar blok değil, raporun tamamı içindir).
   - "Model / efor" satırına bu blokta kullanılan ayar farklıysa ekle.
5. **Karar, ders, literatür:** `/kapat` adım 5, 6 ve 7 ile aynı; yalnız bu bloğun konuları.
6. **STATE.md:** özet bloğunu güncelle: faz satırı, "Son oturum" (bu rapor, "açık" notuyla), "Sıradaki işler" (en fazla 3, sıralı; biten iş çıkar), açık riskler, kullanıcı işleri. Faz tablosunu gerekiyorsa güncelle. 150 satır kuralı `/kapat` adım 8 ile aynı.
7. **CHANGELOG, DATA-INVENTORY, COSTS:** `/kapat` adım 9 ile aynı.
8. **Faz bittiyse:** `/kapat` adım 10 ile aynı (faz özeti, ROADMAP, commit'ten sonra etiket).
9. **Doğrula:** `npm run check` ve projede tanımlıysa tip denetimi ve testler. Kırmızıysa commit atma; neyin kırıldığını söyle, birlikte karar verin.
10. **Commit ve push:**
    - `git add -A`, ardından `git status` ile kontrol (beklenmeyen dosya varsa dur ve sor).
    - Mesaj: `[F<faz>] rep: <bloğun tek satır özeti>` ve sistem talimatında verilen Co-Authored-By satırı.
    - `--no-verify` yok; bekçi durdurursa sebebi düzelt.
    - `git push` (etiket varsa `git push --tags`).
    - Drive yedeği (`npm run backup`) burada **yapılmaz**; SessionEnd hook'u ve `/kapat` yapar.
11. **Aktarım (sohbete, Türkçe):**

```
**Biten iş:** <blok başlığı> (`<commit>`, push edildi)

**Ne yapıldı:** 3-8 madde. Her madde: ne değişti, neden, hangi dosya
(markdown bağlantısıyla). Ölçülen/doğrulanan şeyler ve nasıl doğrulandığı.

**Kayda geçenler:** rapor bloğu, yeni karar/ders/faz özeti (varsa bağlantı).

**Açık kalan:** (yalnız varsa) bu işten kalan pürüzler.

**Sıradaki iş:** STATE'teki ilk iş, tek satır; en fazla 1 alternatif.
**Önerilen model/efor:** tek satır gerekçe. Ayarı kullanıcı yapar.

**Bağlam:** "devam edebiliriz" ya da "/kapat önerilir" ve tek satır neden.

**Senden gerekenler:** (yalnız varsa) numaralı manuel adımlar.
```

Sonra kullanıcının seçimini bekle. **Kullanıcı seçmeden sıradaki işe başlama.**

## Bağlam kararı

Kesin bağlam ölçüsü görünmüyor; şu işaretlerden biri varsa "/kapat önerilir" de:
- Token veya compact uyarısı geldi, ya da oturumda compact oldu.
- Bu oturumda 3 veya daha fazla blok yazıldı.
- Sıradaki iş büyük ve bağımsız (yeni faz, farklı bir alan); temiz bağlamda daha iyi gider.
- Oturumda çok büyük dosya, log veya ekran görüntüsü okundu.

Hiçbiri yoksa "devam edebiliriz" de.

## Kurallar

- Rapor ve belgeler public olacak: sır, kişisel veri, sağlık değeri yok (adım 3).
- Kayda değer bir şey olmadıysa blok yazılmaz, boş commit atılmaz; bunu söyle ve sıradaki işi öner.
- Aynı bilgiyi birden çok dosyaya kopyalama; bağlantı ver. Tek doğruluk kaynağı STATE.md.
- `/rep` oturumu kapatmaz: rapor "açık" kalır, son sözü `/kapat` söyler.
