// Ölçüm kartlarının küçük renk işareti (karar 0057). Renk yalnız kaynağı olan bir eşiğe ya da kişisel aralığa göre:
// aralığın içi sakin, yönü kaynaklı sapma dikkat, yönü belirsiz sapma "farklı". Eşiği olmayan ölçüm işaretsiz kalır.
// Renk tek başına anlam taşımaz: kartın notu aynı şeyi yazıyla söyler.

import type { MetricReading, SleepReading, TrainingLoadReading } from '@hooplab/engine';

export type TileMark = 'calm' | 'attention' | 'notice';

/**
 * Uyku nabzı: aralığın üstü dikkat (`rhr_high`, karar 0041; tek başına durumu değiştirmez), altı yönü kaynakta
 * olmadığı için "farklı". Aralık henüz yoksa işaret yok.
 */
export function sleepHrMark(r: MetricReading): TileMark | null {
  switch (r.position) {
    case 'within':
      return 'calm';
    case 'above':
      return 'attention';
    case 'below':
      return 'notice';
    case null:
      return null;
  }
}

/** Solunum: aralık dışı iki yönde de "her zamankinden farklı"; iyi ya da kötü denmez (karar 0028). */
export function respirationMark(r: MetricReading): TileMark | null {
  if (r.position === null) return null;
  return r.position === 'within' ? 'calm' : 'notice';
}

/** Uyku: 7 gecelik ortalama kısa eşiğin altındaysa dikkat (`uyku-kisa`), değilse sakin; veri azsa işaret yok. */
export function sleepMark(s: SleepReading): TileMark | null {
  if (s.short === null) return null;
  return s.short ? 'attention' : 'calm';
}

/**
 * Yük oranı: yalnız bilgi notunun eşiğinde (≥ 1,5, karar 0025) dikkat. Altında işaret yok: güvenli bölge
 * kaynakta doğrulanmadı, oran sakinlik de söylemez.
 */
export function loadRatioMark(r: Pick<TrainingLoadReading, 'spike'>): TileMark | null {
  return r.spike ? 'attention' : null;
}
