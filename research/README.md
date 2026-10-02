# Kanıt tabanı

HoopLab'in beslendiği bilim burada durur. Uygulamadaki her sayısal eşik veya hedef bir **kurala**, her kural da doğrulanmış bir **kaynağa** bağlıdır. Geliştirme süreci arşivi ayrıdır: [docs/](../docs/).

```
research/
├── sources/    kaynak başına bir dosya (künye, DOI/PMID, kanıt düzeyi, kendi özetimiz)
├── rules/      makinenin okuduğu kurallar (JSON); her kural kaynak kimliklerine işaret eder
├── inbox/      aylık literatür taramasının önerileri (onaysız kütüphaneye girmez)
└── WATCHLIST.md  literatür taramasının konu ve sorgu listesi
```

## Kanıt hiyerarşisi

| Düzey | `type` değeri | Not |
|---|---|---|
| 1 | `consensus`, `position-stand` | IOC, ACSM, ISSN, NATA vb. kurum bildirgeleri |
| 2 | `systematic-review`, `meta-analysis` | |
| 3 | `rct`, `cohort`, `cross-sectional` | Basketbola veya elit sporculara özgü olanlar öncelikli |
| 4 | `narrative-review`, `expert-opinion` | Yalnız bir çalışmaya dayanıyorsa; podcast ve sosyal medya kaynak değildir |

Bir kural mümkün olan en yüksek düzeye dayanır. Daha düşük düzeyde bir kaynak kullanılıyorsa kural dosyasındaki `notes` alanında gerekçesi yazılır.

## Kaynak dosyası

Ad: `sources/<ilkyazar-yıl[-ek]>.md` (ör. `walsh-2021.md`). Şablon: [sources/_TEMPLATE.md](sources/_TEMPLATE.md).

Kurallar:
- **DOI veya PMID zorunlu**, eklenmeden önce Crossref/PubMed'de bulunur ve başlık/yıl eşleşmesi kontrol edilir. Doğrulanamayan kaynak eklenmez.
- **Kendi cümlelerimizle özet.** Abstract veya tam metin kopyalanmaz; doğrudan alıntı en fazla tek cümle ve tırnak içinde.
- **Popülasyon açıkça yazılır** (ör. "elit erkek basketbolcular, n=…", "sağlıklı yetişkinler"). Sedanter popülasyondan gelen bir bulgu sporcuya aktarılıyorsa bu belirtilir.
- **Uygulamada kullanılan sayılar** ayrı bölümde, birimiyle ve hangi bağlamda geçerli olduğuyla yazılır.

## Kural dosyası

`rules/<modul>.json`:

```json
{
  "module": "beslenme",
  "rules": [
    {
      "id": "protein-gunluk",
      "description": "Günlük protein alımı hedef aralığı",
      "value": { "min": 0, "max": 0, "unit": "g/kg/gün" },
      "applies_to": "antrenman dönemindeki sporcu",
      "sources": ["kaynak-id"],
      "notes": "Daha düşük kanıt düzeyi kullanıldıysa gerekçe"
    }
  ]
}
```

Hesap motoru (`packages/engine`) eşikleri bu dosyalardan okur; kodda sabit sayı olarak eşik yazılmaz.

## Doğrulama

- Yerelde: `npm run research:check` (biçim ve kural-kaynak bağları), `npm run research:check:online` (DOI/PMID, başlık/yıl, geri çekilme).
- CI: her push'ta ve her pazartesi çevrimiçi doğrulama. Geri çekilen bir makale CI'ı kırmızıya çevirir.

## Literatür takibi

Aylık zamanlanmış görev, [WATCHLIST.md](WATCHLIST.md) konularında yeni konsensüs bildirgesi, sistematik derleme ve meta-analizleri arar, DOI'lerini doğrular ve `inbox/<tarih>.md` dosyasına öneri olarak yazar. Öneriler `/ac` sırasında gösterilir; kullanıcı onaylarsa kaynak dosyası açılır.
