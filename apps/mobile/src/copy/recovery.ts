// Toparlanma metinleri: motorun okumalarından cümle kurar, sayı hesaplamaz (karar 0021).
// Dil izleme dilidir, tanı dili değil (bellenger-2016, CLAUDE.md §3).

import type { DayState } from '@hooplab/theme';
import {
  dayStatusRuleApple,
  recoveryBand,
  recoveryMinValues,
  shortSleep,
  type DataSource,
  type DayLevel,
  type MetricReading,
  type RecoverySignal,
  type SleepReading,
  type Sport,
} from '@hooplab/engine';

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

/** Takvim haftası; gün pencerelerini "4 hafta" diye yazmak için. */
export const weeks = (days: number) => days / 7;

/** Toparlanma bölümündeki pencere metinleri (rules/toparlanma.json → toparlanma-bant, uyku-kisa). */
export const bandSectionNote = `aralığın: önceki ${weeks(recoveryBand.baselineDays)} hafta`;
export const hrvChartTitle = 'HRV · derin uyku';
/** Apple profilinde HRV gecelik SDNN ortalaması ve tahmin (rules/toparlanma.json → hrv-olcu-apple, karar 0061). */
export const hrvChartTitleApple = 'HRV · uyku';
export const estimateTag = 'Tahmin';

export function hrvTitleFor(source: DataSource = 'google_health'): string {
  return source === 'apple_health' ? hrvChartTitleApple : hrvChartTitle;
}
export const rollingSpoken = `${recoveryBand.rollingDays} günlük ortalama`;
export const hrvLineLegend = `Çizgi: ${recoveryBand.rollingDays} günlük ort.`;
export const rollingLabel = `${recoveryBand.rollingDays} gün ort.`;
export const sleepRollingLabel = `${shortSleep.rollingNights} gece ort.`;

const signalChips: Record<RecoverySignal, string> = {
  hrv_low: 'HRV düşük',
  hrv_high: 'HRV yüksek',
  rhr_high: 'Uyku nabzı yüksek',
  sleep_short: 'Uyku kısa',
};

const signalPhrases: Record<RecoverySignal, string> = {
  hrv_low: `HRV'nin ${recoveryBand.rollingDays} günlük ortalaması aralığının altında`,
  hrv_high: `HRV'nin ${recoveryBand.rollingDays} günlük ortalaması aralığının üstünde`,
  rhr_high: 'uyku nabzı aralığının üstünde',
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

/** Uyku nabzı bandın üstünde ama HRV bandında: durum değişmez (rules/toparlanma.json → gunun-durumu, karar 0041). */
export const rhrAloneNote =
  'Uyku nabzı aralığının üstünde; tek başına durumu değiştirmez. Ağır yük, geç maç, alkol, stres ya da başlayan bir hastalıkla yükselebilir.';

/** Apple Watch'ta HRV bandın dışındayken düşen not (rules/toparlanma.json → gunun-durumu-apple, note_only). */
export const hrvAloneNoteApple = "Apple Watch'ta HRV ölçümünün hatası büyük; tek başına durumu değiştirmez.";

const emptyApple = 'Henüz gece verisi yok. Apple Sağlık izni verilip saat bir gece takıldıktan sonra burada görünür.';

/**
 * Apple Health profili (karar 0061): durumun dayanağı uyku nabzı; HRV bandın dışındaysa yalnız not. "Toparlan"da
 * iki işaret birlikte nedendir.
 */
function statusReasonApple(v: RecoveryView): string {
  if (v.empty) return emptyApple;
  const { level, signals } = v.status;
  const notes = level === 'recover' ? [] : signals.filter((s) => (dayStatusRuleApple.noteOnly as readonly RecoverySignal[]).includes(s));
  const causes = signals.filter((s) => !notes.includes(s));
  const noteText = notes.length > 0 ? ` ${capitalize(joinTr(notes.map((s) => signalPhrases[s])))}. ${hrvAloneNoteApple}` : '';

  if (level === 'insufficient') {
    if (v.rhr.band === null) {
      return `Kişisel bant, son ${recoveryBand.rollingDays} günden önceki ${weeks(recoveryBand.baselineDays)} haftanın en az ${recoveryMinValues.baseline} gecesinden kurulur; şu an ${v.rhr.baselineN} gece uyku nabzı var. O zamana kadar değerler yalnız gösterilir.`;
    }
    return `${recoveryBand.rollingDays} günlük ortalama için son ${recoveryBand.rollingDays} günde en az ${recoveryMinValues.rolling} gece uyku nabzı gerekiyor; şu an ${v.rhr.rollingN} gece var.`;
  }

  if (level === 'ready') {
    const rhr = v.rhr.position === 'below' ? 'Uyku nabzı aralığının altında' : 'Uyku nabzı kendi aralığında';
    const hrv = v.hrv.position === 'within' ? ', HRV de aralığında' : '';
    return `${rhr}${hrv}${v.sleep.short === false ? ', uyku yeterli.' : '.'}${noteText}`;
  }

  return `${capitalize(joinTr(causes.map((s) => signalPhrases[s])))}.${noteText}`;
}

export function statusReason(v: RecoveryView, source: DataSource = 'google_health'): string {
  if (source === 'apple_health') return statusReasonApple(v);
  if (v.empty) return 'Henüz gece verisi yok. Ben → Google Health ile bağlan; ilk senkrondan sonra burada görünür.';
  const { level, signals } = v.status;

  if (level === 'insufficient') {
    if (v.hrv.band === null) {
      return `Kişisel bant, son ${recoveryBand.rollingDays} günden önceki ${weeks(recoveryBand.baselineDays)} haftanın en az ${recoveryMinValues.baseline} gecesinden kurulur; şu an ${v.hrv.baselineN} gece var. O zamana kadar değerler yalnız gösterilir.`;
    }
    return `${recoveryBand.rollingDays} günlük ortalama için son ${recoveryBand.rollingDays} günde en az ${recoveryMinValues.rolling} gece HRV gerekiyor; şu an ${v.hrv.rollingN} gece var.`;
  }

  if (level === 'ready') {
    const rhr =
      v.rhr.position === 'within'
        ? 'HRV ve uyku nabzı kendi aralığında'
        : v.rhr.position === 'below'
          ? 'HRV kendi aralığında, uyku nabzı aralığının altında'
          : 'HRV kendi aralığında';
    const base = `${rhr}${v.sleep.short === false ? ', uyku yeterli.' : '.'}`;
    // Uyku nabzı tek başına durumu değiştirmez, yalnız not (karar 0041).
    return signals.includes('rhr_high') ? `${base} ${rhrAloneNote}` : base;
  }

  const sentence = `${capitalize(joinTr(signals.map((s) => signalPhrases[s])))}.`;
  if (signals.length === 1 && signals[0] === 'hrv_high') return `${sentence} Bu iyi uyum da olabilir, yorgunluk da.`;
  return sentence;
}

/** Maç günü önerisi (karar 0036, rules/mac.json → mac-gunu): ısınma, karbonhidrat ve sıvı, maç sonrası toparlanma. */
export const matchDayAdvice = 'Maç günü: ısınmaya zaman ayır, karbonhidrat ve sıvıyı maça göre planla, maçtan sonra toparlanmayı öne al.';

/**
 * Bugün için tek öneri. Kural: bant içinde planlanan yoğunluk, dışında düşük yoğunluk (vesterinen-2016).
 * Maç günü yoğunluk önerilmez, maça hazırlık dili kullanılır (karar 0032, 0036); durumun kendisi değişmez.
 */
export function statusAdvice(v: RecoveryView, matchDay = false, sport: Sport = 'basketbol'): string | null {
  const sleepShort = v.status.signals.includes('sleep_short');
  if (sport === 'fitness') return fitnessStatusAdvice(v, sleepShort);
  if (matchDay) {
    const care = v.status.level === 'recover' ? ' Belirti varsa sağlık ekibine danış.' : '';
    return `${matchDayAdvice}${care}${sleepShort ? ' Bu gece uykuyu öne çek.' : ''}`;
  }
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

/**
 * Fitness profili (gunun-durumu-dil-fitness, karar 0061 sıra 4): durum bir antrenman talimatı değil, izleme özeti.
 * HRV'ye göre yönlendirilen antrenman rekreasyonel bireyde planlı antrenmandan üstün bulunmadı; öneri temkinli.
 */
function fitnessStatusAdvice(v: RecoveryView, sleepShort: boolean): string | null {
  const sleep = sleepShort ? ' Bu gece uykuyu öne çek.' : '';
  switch (v.status.level) {
    case 'ready':
      return 'Planladığın antrenmanı yapabilirsin; kendini nasıl hissettiğine göre ayarla.';
    case 'caution':
      return `İşaretler olağandan farklı; kendini yorgun hissediyorsan bugün yoğunluğu biraz azaltabilirsin.${sleep}`;
    case 'recover':
      return 'İki işaret birlikte olağandan farklı; hafif bir gün ya da dinlenme iyi gelebilir. Belirtiler sürerse doktora danış.';
    case 'insufficient':
      return sleepShort ? `Son ${shortSleep.rollingNights} gecenin uyku ortalaması ${shortSleep.minHours} saatin altında; bu gece uykuyu öne çek.` : null;
  }
}

export function statusChips(v: RecoveryView, source: DataSource = 'google_health'): string[] {
  if (source === 'apple_health' && v.status.level === 'ready') {
    // Apple'da dayanak uyku nabzı; HRV notları (bandın dışı) çip olarak da görünür (karar 0061).
    return [
      'Uyku nabzı aralığında',
      ...(v.sleep.short === false ? ['Uyku yeterli'] : []),
      ...v.status.signals.filter((s) => s === 'hrv_low' || s === 'hrv_high').map((s) => signalChips[s]),
    ];
  }
  if (v.status.level === 'ready') {
    return [
      'HRV aralığında',
      ...(v.sleep.short === false ? ['Uyku yeterli'] : []),
      ...(v.status.signals.includes('rhr_high') ? [signalChips.rhr_high] : []),
    ];
  }
  return v.status.signals.map((s) => signalChips[s]);
}

/** Kart altındaki kısa not. */
export function bandNote(r: MetricReading): string {
  if (r.rolling === null) return `son ${recoveryBand.rollingDays} günde veri az`;
  switch (r.position) {
    case 'within':
      return 'aralığında';
    case 'below':
      return 'aralığın altında';
    case 'above':
      return 'aralığın üstünde';
    case null:
      return 'aralık oluşuyor';
  }
}

/** 452 dakika → "7:32". Aşağı kesilir: 419,8 dk "7:00" görünüp "kısa" denmesin (uyku-kisa). */
export function formatSleep(minutes: number): string {
  const total = Math.floor(minutes + 1e-9);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** 14.63 → "14,6" */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

export function formatBand(r: MetricReading, digits = 0): string | null {
  return r.band ? `${formatDecimal(r.band.low, digits)}–${formatDecimal(r.band.high, digits)}` : null;
}

/** Kartta ve açıklama sayfasında etiketli satır (ör. "Son gece" · "45 ms"). */
export interface ValueRow {
  label: string;
  value: string;
}

/** Büyük sayının ne olduğu: "7 gün ort. · aralığında" (kullanıcı isteği 2026-10-14: değer ve ortalama ayrı). */
export function rollingCaption(r: MetricReading): string {
  return r.rolling === null ? bandNote(r) : `${rollingLabel} · ${bandNote(r)}`;
}

/**
 * Ortalama ile aralığın sınırı yuvarlanınca aynı görünüyor ama yeri "altında / üstünde" ise bir ondalık daha
 * gösterilir; yoksa "14,6 · aralığın üstünde, aralığın 14,1–14,6" gibi çelişkili okunur (motor ham değerle karar verir).
 */
export function bandDigits(r: MetricReading, digits = 0): number {
  if (r.rolling === null || r.band === null || r.position === 'within' || r.position === null) return digits;
  const edge = r.position === 'above' ? r.band.high : r.band.low;
  let d = digits;
  while (d < digits + 2 && formatDecimal(r.rolling, d) === formatDecimal(edge, d)) d++;
  return d;
}

/** Kartın büyük sayısı: 7 günlük ortalama, sınıra değiyorsa bir ondalık fazla. */
export function formatRolling(r: MetricReading, digits = 0): string {
  return r.rolling === null ? '–' : formatDecimal(r.rolling, bandDigits(r, digits));
}

/** Son gece ve kişisel aralık satırları; birim satırın değerinde. */
export function bandRows(r: MetricReading, unit: string, base = 0): ValueRow[] {
  const digits = bandDigits(r, base);
  const rows: ValueRow[] = [];
  if (r.latest) rows.push({ label: 'Son gece', value: `${formatDecimal(r.latest.value, base)} ${unit}` });
  const band = formatBand(r, digits);
  rows.push(band ? { label: 'Aralığın', value: `${band} ${unit}` } : { label: 'Aralığın', value: 'oluşuyor' });
  return rows;
}

/** Açıklama sayfasının "Senin değerlerin" satırları: 7 gün ort., son gece, aralık ve aralığa göre yeri. */
export function bandPageRows(r: MetricReading, unit: string, base = 0): ValueRow[] {
  const head: ValueRow[] = r.rolling === null ? [] : [{ label: rollingLabel, value: `${formatRolling(r, base)} ${unit}` }];
  return [...head, ...bandRows(r, unit, base), { label: 'Şu an', value: bandNote(r) }];
}

/** Uyku: son gece ve hedef (rules/toparlanma.json → uyku-kisa). */
export function sleepRows(s: SleepReading): ValueRow[] {
  const rows: ValueRow[] = [];
  if (s.lastNight) rows.push({ label: 'Son gece', value: `${formatSleep(s.lastNight.minutes)} sa` });
  rows.push({ label: 'Hedef', value: `en az ${formatSleep(shortSleep.minHours * 60)} sa` });
  return rows;
}

/** Uykunun "Senin değerlerin" satırları. */
export function sleepPageRows(s: SleepReading): ValueRow[] {
  const head: ValueRow[] = s.rollingHours === null ? [] : [{ label: sleepRollingLabel, value: `${formatSleep(s.rollingHours * 60)} sa` }];
  const state: ValueRow[] = s.short === null ? [] : [{ label: 'Şu an', value: s.short ? 'kısa' : 'yeterli' }];
  return [...head, ...sleepRows(s), ...state];
}

/** Uykunun büyük sayısının açıklaması: "7 gece ort. · yeterli". */
export function sleepCaption(s: SleepReading): string {
  if (s.rollingHours === null) return `${sleepRollingLabel} için veri az`;
  return `${sleepRollingLabel} · ${s.short ? 'kısa' : 'yeterli'}`;
}
