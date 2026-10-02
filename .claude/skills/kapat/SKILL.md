---
name: kapat
description: HoopLab oturum kapanışı. Oturumun raporunu yazar; gerekiyorsa karar kaydı, ders ve faz özeti ekler; STATE ve CHANGELOG'u günceller; kişisel veriyi repo dışına ayırır; doğrulamaları koşar, commit atar ve push'lar. Kullanıcı /kapat yazınca çalışır.
disable-model-invocation: true
---

# /kapat — oturum kapanışı

Amaç: Bu oturumda olan her şey, bir sonraki oturumun `/ac` ile eksiksiz devralabileceği şekilde kayda geçsin ve yedeklensin. Kullanıcının `/kapat` yazması, bu adımlardaki commit ve push için onaydır.

## Adımlar

1. **Zaman damgası:** `date '+%Y-%m-%d-%H%M'` (dosya adı için) ve `date '+%Y-%m-%d %H:%M'` (metin için). Asla tahmin etme.
2. **Topla:**
   - `git status`, `git diff --stat`
   - Bu oturumun commit'leri: son oturum raporundaki son commit'ten `HEAD`'e kadar (`git log --oneline <son>..HEAD`).
   - Konuşmadaki kararlar, sorunlar, kullanıcı talimatları.
3. **Kişisel veriyi ayır (önce bu):** Oturumda kullanıcının sağlık değerleri, vücut ölçüleri, sakatlıkları veya başka kişisel bilgisi konuşulduysa bunları **yalnız** `../private/journal/<YYYY-MM-DD-HHMM>-<konu>.md` dosyasına yaz. Repo içindeki hiçbir dosyaya bu değerleri yazma. Repo raporunda gerekiyorsa "kişisel gözlem private/journal'a kaydedildi" de, değer verme.
4. **Oturum raporu:** `docs/sessions/<YYYY-MM-DD-HHMM>-<kisa-konu>.md` dosyasını [docs/sessions/README.md](../../../docs/sessions/README.md) şablonuyla yaz.
5. **Karar kaydı:** Oturumda mimari, ürün, araç veya süreç kararı verildiyse `docs/decisions/NNNN-<kisa-ad>.md` dosyasını [docs/decisions/README.md](../../../docs/decisions/README.md) şablonuyla aç. Sıradaki numarayı mevcut dosyalardan bul. Mevcut bir kararı değiştiriyorsa eski dosyanın durumunu "Yerini aldı: NNNN" olarak güncelle; eskiyi silme.
6. **Ders:** Tekrar yaşanabilecek bir hata veya tuzak öğrenildiyse `docs/LESSONS.md` dosyasına ilgili bölüme tek madde ekle: tarih, ders, kanıt (dosya/commit), bekçiye çevrildi mi.
7. **Literatür önerileri:** `research/inbox/` önerilerinden bu oturumda onaylanan veya reddedilen varsa öneri dosyasında durumunu güncelle (`onaylandı → sources/<id>.md` veya `reddedildi: <gerekçe>`).
8. **STATE.md:** Faz durumu, "Sıradaki işler" (en fazla 3, sıralı), açık riskler, kullanıcı işleri ve "Son oturum" satırını güncelle. Dosya 150 satırı geçerse tamamlanmış eski bölümleri `docs/archive/STATE-<YYYY-MM-DD>.md` dosyasına taşı ve STATE.md'de bağlantı bırak.
9. **CHANGELOG.md:** Uygulamaya veya altyapıya görünür bir değişiklik olduysa `## [Yayınlanmamış]` altına ekle. Yeni bir veri türü, servis veya sır eklendiyse `docs/DATA-INVENTORY.md` ve `docs/COSTS.md` güncel mi kontrol et.
10. **Faz bittiyse:** `docs/phases/faz-<N>.md` faz özetini yaz (hedef, sonuç, kararlar, ölçülen her şey, dersler, sonraki faz). ROADMAP.md'de fazı tamamlandı işaretle. Commit'ten sonra `git tag faz-<N>-tamam` at.
11. **Doğrula:** `npm run check` (araç testleri, gizlilik taraması: güncel ağaç ve tüm geçmiş, kaynak doğrulama) ve projede tanımlıysa tip denetimi ve testler. Bir şey kırmızıysa commit atma; kullanıcıya neyin kırıldığını söyle ve birlikte karar verin.
12. **Commit ve push:**
    - `git add -A` ve ardından `git status` ile eklenen dosyaları kontrol et (beklenmeyen dosya varsa dur ve sor).
    - Mesaj: `[F<faz>] oturum: <tek satır özet>` ve sistem talimatında verilen Co-Authored-By satırı.
    - Pre-commit bekçisi durdurursa `--no-verify` kullanma; sebebi düzelt.
    - `git push` (etiket varsa `git push --tags`).
13. **Yedek:** `npm run backup` (`private` klasörünü Drive'a eklemeli kopyalar). Hata verirse (ör. Drive bağlı değil) kapanış mesajında açıkça söyle.
14. **Kapanış mesajı** (en fazla 5 satır): ne kaydedildi (rapor dosyası, commit hash, yedek sonucu), varsa yeni karar/ders, sıradaki adım ve "Bu oturumu kapatabilirsin; yeni oturumda `/ac`".

## Kurallar

- Oturumda kayda değer hiçbir şey olmadıysa (değişiklik yok, karar yok) kısa bir rapor yine yazılır; boş commit atılmaz.
- Rapor ve belgeler public olacak: sır, kişisel veri, sağlık değeri yok (adım 3).
- Aynı bilgiyi birden çok dosyaya kopyalama; bağlantı ver. Tek doğruluk kaynağı STATE.md.
