// Antrenman yükü metinleri (karar 0025). Oran sakatlık riski değil, "alıştığın seviyeye göre" bağlamdır;
// not tahmin olarak etiketlenir. Risk rengi ve "güvenli bölge" dili yok; renk yalnız seans türünü gösterir (karar 0026).

import { loadEwma, loadRatioRule, loadSpikeRule, loadWeek, monotonyRule, type TrainingLoadReading } from '@hooplab/engine';
import type { LoadGroup } from '@hooplab/theme';

import { formatDecimal, weeks } from './recovery.ts';

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
  if (r.ratio !== null) return `son ${loadEwma.acuteN} gün / ${weeks(loadEwma.chronicN)} hafta · bağlam, risk değil`;
  if (r.historyDays < loadRatioRule.minHistoryDays) {
    const left = loadRatioRule.minHistoryDays - r.historyDays;
    return `${loadRatioRule.minHistoryDays} günlük kayıttan sonra hesaplanır; ${left} gün kaldı.`;
  }
  return `Son ${weeks(loadEwma.chronicN)} haftada yük yok; oran hesaplanmaz.`;
}

export const spikeTitle = 'Bu hafta yük alıştığın seviyenin belirgin üstünde';
export const spikeBody = `Son ${loadEwma.acuteN} günün ağırlıklı yükü, ${weeks(loadEwma.chronicN)} haftada alıştığın seviyenin ${formatDecimal(loadSpikeRule.ratioMin)} katını geçti. Bu bir sakatlık tahmini değil; yalnız ani bir artışı gösterir.`;
export const estimateLabel = 'Tahmin';

export function untaggedLabel(count: number): string {
  return `Saatte ${count} oturum etiketlenmedi`;
}
export const untaggedDetail = 'Etiketlenmeyen oturum yüke girmez; yük eksik görünebilir.';

export const monotonyEmpty = `son ${monotonyRule.windowDays} günde değişim yok veya kayıt az`;
export const monotonyNote = 'Ortalama / gün gün değişim. Eşik yok; kendi geçmişinle kıyas haftalar biriktikçe.';
export const strainNote = 'Haftalık yük × monotonluk.';

export const loadMethodNote = `Yük = RPE × dakika (AU). Ortalamalar üstel ağırlıklı: yakın günler daha ağır sayılır (${loadEwma.acuteN} ve ${loadEwma.chronicN} gün). Oran ve not tahmindir; basketbolda doğrulanmış bir sakatlık eşiği yok. Renkler yalnız seans türünü gösterir. Saha: takım antrenmanı ve şut; hafif: mobilite ve rehabilitasyon.`;

/** Trend'deki pencere metinleri (rules/yuk.json → yuk-haftalik). */
export const lastWeekLabel = `Son ${loadWeek.days} gün`;
export const previousWeekLabel = `önceki ${loadWeek.days} gün`;
export const averageWeeksLabel = `${loadWeek.averageWeeks} hafta ort.`;
export const averageWindowNote = `son ${loadWeek.days * loadWeek.averageWeeks} gün / ${loadWeek.averageWeeks}`;
export const averagePendingNote = `${loadWeek.days * loadWeek.averageWeeks} günlük kayıttan sonra`;
export const loadSectionNote = `RPE × dakika · ${loadWeek.averageWeeks} hafta`;
export const previousWeekEmpty = `${previousWeekLabel}: kayıt az`;
export const lastWeekLegend = `Gölgeli alan ve yukarıdaki değerler: son ${loadWeek.days} gün`;
export const weekPartsLabel = `Son ${loadWeek.days} günün türlere göre yükü`;

/** Grafikteki seans türü grupları (karar 0026). */
export const loadGroupLabels: Record<LoadGroup, string> = {
  game: 'Maç',
  court: 'Saha',
  gym: 'Kuvvet / kondisyon',
  light: 'Hafif',
};
