# Oturum raporları

Her oturumun kaydı. `/kapat` yazar, `/ac` en yeni ikisini okur. Ad: `YYYY-AA-GG-SSDD-<kisa-konu>.md` (zaman damgası `date` komutundan).

Bu klasör public olacak: **sağlık değeri, kişisel bilgi veya sır yazılmaz.** Kişisel gözlemler `../private/journal/` klasörüne gider.

## Şablon

```markdown
# YYYY-AA-GG SS:DD — <konu>

- **Faz:** N
- **Model / efor:** (kullanılan)
- **Commit'ler:** `abc1234` … `def5678` (veya "yok")

## Amaç
Oturumun başında hedeflenen iş.

## Yapılanlar
- Madde madde; ilgili dosya ve commit'lerle.

## Kararlar
- [NNNN başlık](../decisions/NNNN-....md) — tek satır (yoksa "yok").

## Sorunlar ve hatalar
- Ne oldu, nasıl fark edildi, nasıl çözüldü (yoksa "yok").

## Öğrenilenler
- LESSONS.md'ye eklenenler (yoksa "yok").

## Açık kalanlar
- Bitmeyen işler, bekleyen kullanıcı işleri.

## Sıradaki adım
- STATE.md'deki ilk iş ile aynı olmalı.
```
