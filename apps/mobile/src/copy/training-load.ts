// Antrenman yükü metinleri (karar 0025). Oran sakatlık riski değil, "alıştığın seviyeye göre" bağlamdır;
// not tahmin olarak etiketlenir. Renk ve "güvenli bölge" dili yok.

import { loadRatioRule, loadSpikeRule, type TrainingLoadReading } from '@hooplab/engine';

import { formatDecimal } from '@/copy/recovery';

/** Binlik ayırıcılı tam sayı: 8027 → "8.027". */
export function formatLoad(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Haftadan haftaya değişim: 0,23 → "+%23", −0,1 → "−%10". */
export function formatChange(change: number): string {
  const pct = Math.round(change * 100);
  return pct === 0 ? '%0' : `${pct > 0 ? '+' : '−'}%${Math.abs(pct)}`;
}

export function formatRatio(ratio: number): string {
  return `${formatDecimal(ratio)}×`;
}

/** Oranın altındaki bağlam cümlesi; oran yoksa neden yok olduğu. */
export function ratioNote(r: TrainingLoadReading): string {
  if (r.ratio !== null) return 'son 7 gün / 4 hafta · bağlam, risk değil';
  if (r.historyDays < loadRatioRule.minHistoryDays) {
    const left = loadRatioRule.minHistoryDays - r.historyDays;
    return `${loadRatioRule.minHistoryDays} günlük kayıttan sonra hesaplanır; ${left} gün kaldı.`;
  }
  return 'Son 4 haftada yük yok; oran hesaplanmaz.';
}

export const spikeTitle = 'Bu hafta yük alıştığın seviyenin belirgin üstünde';
export const spikeBody = `Son 7 günün ağırlıklı yükü, 4 haftada alıştığın seviyenin ${formatDecimal(loadSpikeRule.ratioMin)} katını geçti. Bu bir sakatlık tahmini değil; yalnız ani bir artışı gösterir.`;
export const estimateLabel = 'Tahmin';

export function untaggedLabel(count: number): string {
  return `Saatte ${count} oturum etiketlenmedi`;
}
export const untaggedDetail = 'Etiketlenmeyen oturum yüke girmez; yük eksik görünebilir.';

export const monotonyNote = 'Ortalama / gün gün değişim. Eşik yok; kendi geçmişinle kıyas haftalar biriktikçe.';
export const strainNote = 'Haftalık yük × monotonluk.';

export const loadMethodNote =
  'Yük = RPE × dakika (AU). Ortalamalar üstel ağırlıklı: yakın günler daha ağır sayılır (7 ve 28 gün). Oran ve not tahmindir; basketbolda doğrulanmış bir sakatlık eşiği yok.';
