# Faz 0.5 özeti: tasarım yönü

- **Başlangıç / bitiş:** 2026-10-03 / 2026-10-03
- **Etiket:** `faz-0.5-tamam`

## Hedef
Faz 1 ekranlarından önce görsel dili seçmek ve TypeScript tema dosyasına çevrilebilir bir token seti çıkarmak.

## Sonuç
C · Hale yönü seçildi; açık ve koyu tema, Sistem / Açık / Koyu tercihi. Token'lar `packages/theme` paketinde ve maketle birebir olduğu testle kanıtlanıyor. Faz 1 iskeleti bu paketi doğrudan kullanacak.

## Ölçülenler
| Soru | Cevap |
|---|---|
| Üç yönden hangisi? | C · Hale ([0010](../decisions/0010-tasarim-yonu-hale.md)); maketler [design/maketler/](../../design/maketler/index.html) |
| Hale nasıl çizilecek? | `react-native-svg` radyal gradyan + Reanimated transform ([0011](../decisions/0011-hale-efekti-svg.md)) |
| Maket renkleri erişilebilir mi? | Açık temada hayır: soluk metin 2,77-3,24, sarı yazı 2,44. Ton korunarak düzeltildi, artık bütün metinler her iki temada 4,5:1 üstünde (test zorunlu kılıyor) |
| Expo font paketi maketteki gibi mi çizer? | Büyük yazıda hayır: sabit dosyalar opsz 14, maket opsz 96. Display kesimi üretildi ([0013](../decisions/0013-tasarim-tokenlari.md)) |
| Token'lar maketle aynı mı? | Evet: renk, gölge, 37 seçicinin yazı tanımı, köşe, boyut, hale ve hareket testle karşılaştırılıyor |

## Kararlar
[0010](../decisions/0010-tasarim-yonu-hale.md), [0011](../decisions/0011-hale-efekti-svg.md), [0012](../decisions/0012-ara-rapor-rep.md) (süreç: /rep), [0013](../decisions/0013-tasarim-tokenlari.md).

## Dersler
LESSONS "Önizleme ve maketler" (yerel sunucu, ekran görüntüsü tuhaflıkları), "Expo / React Native" (font optik boyutu), "Git ve süreç" (plugin kurulumu, beklenen değerin ölçülmesi).

## Faz 1'e devredilenler
- Token'ların cihazda doğrulanacak noktaları: [packages/theme/README.md](../../packages/theme/README.md) "Cihazda doğrulanacaklar".
- Metro'nun workspace paketini ve `.ts` uzantılı importları çözmesi.
- Check-in ölçeği (maketlerde 1-5 yer tutucu), dipnot metinleri (gerçek kaynaklar Faz 2).
- SessionEnd / PreCompact arşiv hook'unun doğrulanması.

## Sonraki faz
Faz 1: temel uygulama (MVP). İlk iş `apps/mobile` iskeleti.
