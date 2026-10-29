// Haftalık rapor metinleri (karar 0040): motorun ve görünümün sayılarından cümle kurar, sayı hesaplamaz.
// Eşik yok; pencere sayıları motor sabitlerinden (hardcoded-numbers.test.ts).

import { checkinBaseline, loadRatioRule, loadWeek, painMonitoringRule, type TrainingLoadReading, type DayLevel, type DayType, type RangePosition } from '@hooplab/engine';

import { formatDecimal, levelLabels, weeks } from './recovery.ts';
import { dayTypeLabels } from './nutrition.ts';
import { averagePendingNote, formatChange, formatLoad } from './training-load.ts';
import type { NightNoteKind, WeeklyReportView } from '../data/weekly-report-view.ts';

const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'] as const;

function parts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

/** "5–11 Ekim", ay sınırında "28 Eylül – 4 Ekim", yıl sınırında yıllarıyla. */
export function weekRangeText(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  if (a.y !== b.y) return `${a.d} ${months[a.m - 1]} ${a.y} – ${b.d} ${months[b.m - 1]} ${b.y}`;
  if (a.m !== b.m) return `${a.d} ${months[a.m - 1]} – ${b.d} ${months[b.m - 1]}`;
  return `${a.d}–${b.d} ${months[b.m - 1]}`;
}

export const weeklyTitle = 'Haftalık rapor';
export const weekDayCount = loadWeek.days;

/** PDF paylaşımı (karar 0051). */
export const shareRowLabel = 'PDF olarak paylaş';
export const shareFooter =
  'PDF telefonda hazırlanır ve yalnız paylaşım menüsünde seçtiğin yere gider. Adın ya da hesabın yazmaz. Gönderdiğin dosya artık alıcıdadır.';
/** Web'de (PWA) PDF tarayıcının yazdırma penceresinden kaydedilir (lib/share-pdf.web.ts). */
export const shareFooterWeb =
  'PDF bu tarayıcıda hazırlanır, sunucuya gitmez. Açılan yazdırma penceresinden PDF olarak kaydedersin. Adın ya da hesabın yazmaz.';

export function phaseText(v: WeeklyReportView): string {
  return v.phase === 'complete' ? 'Biten hafta' : `Sürüyor · ${v.dates.length}. gün`;
}

/** Trend'deki giriş satırının alt metni. */
export function entryDetail(v: WeeklyReportView): string {
  const range = weekRangeText(v.weekStart, v.weekEnd);
  const total = v.load.reading.total;
  return total === null ? range : `${range} · ${formatLoad(total)} AU`;
}

// --- Yük ---

export function previousWeekText(v: WeeklyReportView): string {
  const r = v.load.reading;
  if (r.previousTotal === null) return 'önceki hafta: kayıt az';
  const change = r.change !== null ? ` · ${formatChange(r.change)}` : '';
  return `önceki hafta ${formatLoad(r.previousTotal)}${change}`;
}

export function sessionsText(v: WeeklyReportView): string {
  const l = v.load;
  if (l.sessions === 0) return 'Seans kaydı yok';
  const games = l.games ? ` · ${l.games} maç` : '';
  const played = l.minutesPlayed !== null ? ` · ${l.minutesPlayed} dk oynadın` : '';
  return `${l.sessions} seans${games}${played}`;
}

/** Önceki haftaların değeri, yeniden eskiye: "1,4 · 1,2 · – · 1,3". */
export function historyText(values: readonly (number | null)[], format: (n: number) => string): string {
  return values.map((x) => (x === null ? '–' : format(x))).join(' · ');
}

export const historyLabel = `Önceki ${loadWeek.averageWeeks} hafta (yeniden eskiye)`;

/** Kart altındaki önceki haftalar; hiçbiri hesaplanamadıysa neden. */
export function historyNote(values: readonly (number | null)[], format: (n: number) => string): string {
  return values.every((x) => x === null) ? 'önceki haftalar: kayıt az' : historyText(values, format);
}

/** Yük kartlarının altındaki not: önceki haftaların toplamları ya da henüz neden yok. */
export function historyFooter(totals: readonly (number | null)[]): string {
  if (totals.every((x) => x === null)) return 'Önceki haftalarla kıyas, seans kaydı biriktikçe gelir.';
  return `Kart altındaki sayılar: ${historyLabel.toLocaleLowerCase('tr')}. Toplamlar: ${historyText(totals, formatLoad)} AU.`;
}

export function averageNote(end: TrainingLoadReading): string {
  return end.weeklyAverage === null ? averagePendingNote : 'haftanın sonunda';
}

export function ratioTileNote(end: TrainingLoadReading): string {
  if (end.ratio === null) return `${loadRatioRule.minHistoryDays} günlük kayıttan sonra`;
  return end.spike ? 'belirgin üstünde · tahmin' : 'pazar günü · bağlam';
}
export const currentLoadNote = 'Değişim, oran, monotonluk ve gerilim hafta bitince hesaplanır.';

// --- Toparlanma ---

const levelOrder: readonly DayLevel[] = ['ready', 'caution', 'recover', 'insufficient'];

export function levelCountsText(counts: Partial<Record<DayLevel, number>>): string {
  return levelOrder
    .filter((l) => (counts[l] ?? 0) > 0)
    .map((l) => `${counts[l]} ${levelLabels[l]}`)
    .join(' · ');
}

export function sleepText(v: WeeklyReportView): string {
  const r = v.recovery;
  if (r.sleepHours === null) return 'Uyku verisi yok';
  return `${r.sleepNights} gece ölçüldü${r.sleepShort === true ? ' · ortalama kısa' : ''}`;
}

export const currentRecoveryNote = 'Haftanın ortalaması ve aralık kıyası hafta bitince.';

// --- Gece notları ---

export const nightKindLabels: Record<NightNoteKind, string> = {
  respiration: 'Solunum',
  rhr: 'Uyku nabzı',
  spo2: 'SpO2',
  skinTemp: 'Cilt sıcaklığı',
};

export const nightsFooter =
  'Her not o günkü ölçümlerin kendi olağanından belirgin ayrıldığını söyler; tanı değildir. Belirtin varsa antrenmana çıkmadan doktora başvur.';

// --- Check-in ---

export function checkinCountText(v: WeeklyReportView): string {
  return `${v.checkin.n} / ${v.dates.length} gün`;
}

export function checkinBaselineText(v: WeeklyReportView): string {
  const c = v.checkin;
  if (c.baselineMean === null) return 'Kıyas için önceki haftalarda check-in az';
  return `önceki ${weeks(checkinBaseline.baselineDays)} hafta ort. ${formatDecimal(c.baselineMean)}`;
}

export function lowDaysText(n: number): string {
  return n === 0 ? 'Belirgin düşük gün yok' : `${n} gün alıştığından belirgin düşük`;
}

// --- Ağrı ---

export const painFooter = `Her gün ayrı gösterilir; kesikli boş kare o gün check-in yok demek. ${painMonitoringRule.maxNrs}'in üstündeki günler sayılır: ağrı izleme modelinde yüklenmeyi gözden geçirme sınırı. Tanı değil.`;

export function aboveText(n: number): string | null {
  return n > 0 ? `${n} gün ${painMonitoringRule.maxNrs}'in üstünde` : null;
}

// --- Beslenme ---

const positionLabels: Record<RangePosition, string> = { below: 'altında', within: 'aralıkta', above: 'üstünde' };
const positionOrder: readonly RangePosition[] = ['within', 'below', 'above'];

export function positionsText(counts: Partial<Record<RangePosition, number>>): string {
  const text = positionOrder
    .filter((p) => (counts[p] ?? 0) > 0)
    .map((p) => `${counts[p]} gün ${positionLabels[p]}`)
    .join(' · ');
  return text || '–';
}

export function mealDaysText(v: WeeklyReportView): string {
  return `Öğün kaydı ${v.nutrition.mealDays} / ${v.dates.length} gün`;
}

export function dayTypesText(counts: Partial<Record<DayType, number>>, matchDays: number): string {
  const order: readonly DayType[] = ['rest', 'training', 'high'];
  const text = order
    .filter((t) => (counts[t] ?? 0) > 0)
    .map((t) => `${counts[t]} ${dayTypeLabels[t].toLocaleLowerCase('tr')}`)
    .join(' · ');
  return matchDays ? `${text} · ${matchDays} maç günü işaretli` : text;
}

export function fluidText(v: WeeklyReportView): string {
  const n = v.nutrition;
  if (n.fluidMeanL === null) return 'Su kaydı yok';
  return `${formatDecimal(n.fluidMeanL)} L / gün · ${n.fluidDays} gün kayıtlı`;
}

export const nutritionFooter =
  'Tahmin: kayıtlı alım hedef aralığıyla yan yana konur. Kayıt eksikse alım düşük görünür; bu bir uyarı değil. Su hedefle kıyaslanmaz.';

// --- Kilo ---

export function weightChangeText(v: WeeklyReportView): string | null {
  const w = v.weight;
  if (w.change === null || w.previousMean === null) return null;
  const shown = formatDecimal(Math.abs(w.change));
  if (shown === formatDecimal(0)) return `önceki hafta ${formatDecimal(w.previousMean)} kg · değişim yok`;
  return `önceki hafta ${formatDecimal(w.previousMean)} kg · ${w.change > 0 ? '+' : '−'}${shown} kg`;
}

export const weightFooter = 'Sabah tartılarının ortalaması; eşik yok.';
