// Toparlanma metinleri: motorun okumalarından cümle kurar, sayı hesaplamaz (karar 0021).
// Dil izleme dilidir, tanı dili değil (bellenger-2016, CLAUDE.md §3).

import type { DayState } from '@hooplab/theme';
import { recoveryMinValues, shortSleep, type DayLevel, type MetricReading, type RecoverySignal } from '@hooplab/engine';

import type { RecoveryView } from '@/data/recovery-view';

export const levelLabels: Record<DayLevel, string> = {
  ready: 'Hazır',
  caution: 'Kontrollü',
  recover: 'Toparlan',
  insufficient: 'Bant oluşuyor',
};

/** Hale ve vurgu rengi; durum yoksa hale çizilmez. */
export const levelStates: Record<DayLevel, DayState | null> = {
  ready: 'green',
  caution: 'yellow',
  recover: 'red',
  insufficient: null,
};

const signalChips: Record<RecoverySignal, string> = {
  hrv_low: 'HRV düşük',
  hrv_high: 'HRV yüksek',
  rhr_high: 'Nabız yüksek',
  sleep_short: 'Uyku kısa',
};

const signalPhrases: Record<RecoverySignal, string> = {
  hrv_low: "HRV'nin 7 günlük ortalaması bandının altında",
  hrv_high: "HRV'nin 7 günlük ortalaması bandının üstünde",
  rhr_high: 'dinlenik nabız bandının üstünde',
  sleep_short: `son ${shortSleep.rollingNights} gecenin uyku ortalaması ${shortSleep.minHours} saatin altında`,
};

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}

/** "a", "a ve b", "a, b ve c" */
function joinTr(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} ve ${parts.at(-1)}`;
}

export function statusReason(v: RecoveryView): string {
  if (v.empty) return 'Henüz gece verisi yok. Ben → Google Health ile bağlan; ilk senkrondan sonra burada görünür.';
  const { level, signals } = v.status;

  if (level === 'insufficient') {
    if (v.hrv.band === null) {
      return `Kişisel bant, son 7 günden önceki 4 haftanın en az ${recoveryMinValues.baseline} gecesinden kurulur; şu an ${v.hrv.baselineN} gece var. O zamana kadar değerler yalnız gösterilir.`;
    }
    return `7 günlük ortalama için son 7 günde en az ${recoveryMinValues.rolling} gece HRV gerekiyor; şu an ${v.hrv.rollingN} gece var.`;
  }

  if (level === 'ready') {
    const rhr =
      v.rhr.position === 'within'
        ? 'HRV ve dinlenik nabız kendi bandında'
        : v.rhr.position === 'below'
          ? 'HRV kendi bandında, dinlenik nabız bandının altında'
          : 'HRV kendi bandında';
    return `${rhr}${v.sleep.short === false ? ', uyku yeterli.' : '.'}`;
  }

  const sentence = `${capitalize(joinTr(signals.map((s) => signalPhrases[s])))}.`;
  if (signals.length === 1 && signals[0] === 'hrv_high') return `${sentence} Bu iyi uyum da olabilir, yorgunluk da.`;
  return sentence;
}

/** Bugün için tek öneri. Kural: bant içinde planlanan yoğunluk, dışında düşük yoğunluk (vesterinen-2016). */
export function statusAdvice(v: RecoveryView): string | null {
  const sleepShort = v.status.signals.includes('sleep_short');
  switch (v.status.level) {
    case 'ready':
      return 'Planlanan antrenmanı yapabilirsin.';
    case 'caution':
      return `Bugün yüksek yoğunluğu azalt; düşük yoğunluklu işe (şut, mobilite) ağırlık ver.${sleepShort ? ' Bu gece uykuyu öne çek.' : ''}`;
    case 'recover':
      return 'Yüksek yoğunluk yerine hafif seans ya da dinlenme. Belirtiler sürerse sağlık ekibine danış.';
    case 'insufficient':
      return sleepShort ? `Son ${shortSleep.rollingNights} gecenin uyku ortalaması ${shortSleep.minHours} saatin altında; bu gece uykuyu öne çek.` : null;
  }
}

export function statusChips(v: RecoveryView): string[] {
  if (v.status.level === 'ready') return ['HRV bandında', ...(v.sleep.short === false ? ['Uyku yeterli'] : [])];
  return v.status.signals.map((s) => signalChips[s]);
}

/** Kart altındaki kısa not. */
export function bandNote(r: MetricReading): string {
  if (r.rolling === null) return 'son 7 günde veri az';
  switch (r.position) {
    case 'within':
      return 'bandında';
    case 'below':
      return 'bandın altında';
    case 'above':
      return 'bandın üstünde';
    case null:
      return 'bant oluşuyor';
  }
}

/** 452 dakika → "7:32" */
export function formatSleep(minutes: number): string {
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** 14.63 → "14,6" */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

export function formatBand(r: MetricReading): string | null {
  return r.band ? `${Math.round(r.band.low)}–${Math.round(r.band.high)}` : null;
}
