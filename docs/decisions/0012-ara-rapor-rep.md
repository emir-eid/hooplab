# 0012. Ara rapor: /rep

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** [0006](0006-calisma-sistemi.md) (bu kararı genişletir, yerini almaz)

## Bağlam
[0006](0006-calisma-sistemi.md) her oturumu `/ac` ile açıp `/kapat` ile kapatıyordu. Pratikte bir oturumda birden çok küçük iş bitiyor. Her işten sonra `/kapat` → `/clear` → `/ac` yapmak yavaş: `/ac` her seferinde STATE, raporlar, git, CI ve LESSONS'u yeniden okuyor, bağlam sıfırlanıyor. Öte yandan kayıt tutmadan devam etmek, oturum çökerse işin STATE'e hiç girmemesi demek ("STATE'te yazmıyorsa yapılmamış sayılır").

## Seçenekler
1. **Her iş sonunda `/kapat`:** en güvenli; en yavaş, bağlam her seferinde sıfırlanıyor.
2. **Yalnız oturum sonunda `/kapat`:** hızlı; ama uzun oturumda işler kayda geç giriyor, çökmede kayıp riski var, rapor tek seferde hatırlanarak yazılıyor.
3. **Ara komut `/rep`:** her iş sonunda `/kapat` kadar eksiksiz kayıt (rapor bloğu, karar, ders, STATE, commit + push), oturum açık kalır; `/kapat` → `/clear` → `/ac` yalnız bağlam dolunca.

## Karar
Seçenek 3 (kullanıcının önerisi). Oturum başına tek rapor dosyası tutulur: ilk `/rep` raporu "açık" durumuyla açar, sonraki her `/rep` bir blok ekler, `/kapat` son bloğu ekleyip raporu "kapandı" yapar. Böylece `/ac`'in okuduğu "en yeni iki rapor" hala son iki oturum demektir. `/rep` push yapar (push tek yedek) ama Drive yedeğini yapmaz; o SessionEnd hook'unda ve `/kapat`'ta kalır. `/rep` sonunda bağlamın dolup dolmadığına işaretlere bakarak (token/compact uyarısı, 3+ blok, büyük ve bağımsız yeni iş) "devam" ya da "/kapat" önerir.

## Sonuçlar
- Bağlam doluluğu kesin ölçülemiyor; karar işaretlere dayanıyor.
- Oturum `/kapat`'sız biterse rapor "açık" kalır; `/ac` bunu uyarı olarak gösterir.
- Her iş ayrı bir `[F<faz>] rep:` commit'i olur; geçmiş daha ayrıntılı ama daha kalabalık.
- **Yeniden değerlendirme tetikleyicisi:** raporlar çok uzar ve `/ac` okuması ağırlaşırsa ya da açık kalan raporlar sık görülürse.
