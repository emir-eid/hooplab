# Oturum raporları

Her oturumun kaydı; oturum başına tek dosya. Oturum içinde her `/rep` yeni bir blok ekler, `/kapat` raporu kapatır (`/rep` hiç kullanılmadıysa tek bloklu raporu kendisi yazar). `/ac` en yeni ikisini okur. Ad: `YYYY-AA-GG-SSDD-<kisa-konu>.md` (ilk `/rep` ya da `/kapat` anının zaman damgası, `date` komutundan).

Durum **açık** ise oturum `/kapat`'sız bitmiştir; `/ac` bunu uyarı olarak gösterir.

Bu klasör public olacak: **sağlık değeri, kişisel bilgi veya sır yazılmaz.** Kişisel gözlemler `../private/journal/` klasörüne gider.

## Şablon

```markdown
# YYYY-AA-GG SS:DD — <konu>

- **Faz:** N
- **Durum:** açık (/rep) | kapandı (/kapat)
- **Model / efor:** (kullanılan)
- **Commit'ler:** `abc1234` … `def5678` (veya "yok")

## Blok 1 — <iş> (SS:DD)

### Amaç
Bu blokta hedeflenen iş.

### Yapılanlar
- Madde madde; ilgili dosya ve commit'lerle.

### Kararlar
- [NNNN başlık](../decisions/NNNN-....md) — tek satır (yoksa "yok").

### Sorunlar ve hatalar
- Ne oldu, nasıl fark edildi, nasıl çözüldü (yoksa "yok").

### Öğrenilenler
- LESSONS.md'ye eklenenler (yoksa "yok").

## Blok 2 — <iş> (SS:DD)
(sonraki her /rep bir blok ekler; aynı alt başlıklar)

## Açık kalanlar
- Bitmeyen işler, bekleyen kullanıcı işleri.

## Sıradaki adım
- STATE.md'deki ilk iş ile aynı olmalı.
```
