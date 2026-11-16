// Aktivite (karar 0061 sıra 6, fitness profili): günlük adım ve haftalık aktivite özeti. rules/aktivite.json.
// Adımda hedef, renk ve uyarı yok; açıklama yalnız kaynaklı başvuru noktalarını anar. Haftalık özet yalnız kaydedilen
// seanslardan sayar: yürüyüş ve günlük hareket girmez, etkinliği eksik sayar. Tarihler "YYYY-AA-GG" yerel günler.

import { addIsoDays, type DayValue } from './recovery.ts';
import { weekLength } from './weekly.ts';

/** rules/aktivite.json → adim-gunluk. */
export const stepsRule = {
  /** Kartta "ortalama" penceresi: bugünden önceki tam günler. */
  averageDays: 7,
  /** Açıklamadaki başvuru noktası (ding-2025, garber-2011); hedef ya da uyarı değil. */
  referenceSteps: 7000,
  /** Faydanın düzleştiği aralık, 60 yaş altı ve 60 yaş ve üstü (paluch-2022); açıklama metni. */
  plateauUnder60: [8000, 10000],
  plateau60Plus: [6000, 8000],
} as const;

/** rules/aktivite.json → haftalik-aktivite. */
export const weeklyActivityRule = {
  moderateMinutes: [150, 300],
  vigorousMinutes: [75, 150],
  strengthDaysMin: 2,
  /** Seans RPE'si (CR10) ile DSÖ'nün 0-10 algılanan zorluk ölçeği: orta 5-6, yüksek 7 ve üstü. */
  moderateRpe: [5, 6],
  vigorousRpeMin: 7,
  strengthRpeMin: 5,
  /** Aynı kas grubunu çalıştıran iki seans arası, en az (garber-2011); açıklama metni, eşik değil. */
  sameMuscleRestHours: 48,
  aerobicKinds: ['conditioning'],
  strengthKinds: ['strength'],
} as const;

/** Sıfır ya da geçersiz değer veri yok sayılır (saat takılı değilken gün sıfır görünebilir). */
function valid(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function valueOn(days: readonly DayValue[], date: string): number | null {
  const v = days.find((d) => d.date === date)?.value;
  return valid(v) ? v : null;
}

export interface StepsReading {
  /** Bugün şu ana kadar (son eşitlemeye kadar); gün bitmeden günün tamamından düşüktür. */
  today: number | null;
  /** Dünün tamamı. */
  yesterday: number | null;
  /** Bugünden önceki 7 günün (tam günler) ortalaması; verisi olan günlerden. */
  average: number | null;
  /** Ortalamaya giren gün sayısı (en çok 7). */
  averageN: number;
}

export function readSteps(days: readonly DayValue[], today: string): StepsReading {
  const window = Array.from({ length: stepsRule.averageDays }, (_, i) => valueOn(days, addIsoDays(today, -(i + 1))));
  const present = window.filter(valid);
  return {
    today: valueOn(days, today),
    yesterday: valueOn(days, addIsoDays(today, -1)),
    average: present.length ? present.reduce((a, b) => a + b, 0) / present.length : null,
    averageN: present.length,
  };
}

export interface ActivitySession {
  /** Seansın yerel günü. */
  date: string;
  /** training_sessions.kind */
  kind: string;
  durationMin: number;
  rpe: number;
}

export interface WeeklyActivityReading {
  weekStart: string;
  /** Orta yoğunlukta (RPE 5-6) kondisyon dakikası. */
  moderateMinutes: number;
  /** Yüksek yoğunlukta (RPE 7 ve üstü) kondisyon dakikası. */
  vigorousMinutes: number;
  /** RPE 5'in altındaki kondisyon dakikası (öneriye sayılmaz, gösterilir). */
  lightMinutes: number;
  /** Kuvvet seansı (RPE 5 ve üstü) olan farklı gün sayısı. */
  strengthDays: number;
  /** Orta ya da yüksek dakikalardan biri alt sınırı geçti mi (ikisi toplanmaz). */
  aerobicMet: boolean;
  strengthMet: boolean;
  /** Haftada sayılan seans var mı? Yoksa özet "kayıt yok" der. */
  hasSessions: boolean;
}

const inList = (list: readonly string[], v: string) => list.includes(v);

/** Haftanın (weekStart'tan 7 gün) kaydedilen seanslarından aktivite özeti; bugünden sonraki günler sayılmaz. */
export function readWeeklyActivity(sessions: readonly ActivitySession[], weekStart: string, today: string): WeeklyActivityReading {
  const end = addIsoDays(weekStart, weekLength - 1);
  const last = today < end ? today : end;
  const r = weeklyActivityRule;
  let moderate = 0;
  let vigorous = 0;
  let light = 0;
  const strengthDates = new Set<string>();
  let counted = 0;
  for (const s of sessions) {
    if (s.date < weekStart || s.date > last) continue;
    if (!Number.isFinite(s.durationMin) || s.durationMin <= 0 || !Number.isFinite(s.rpe)) continue;
    if (inList(r.aerobicKinds, s.kind)) {
      counted++;
      if (s.rpe >= r.vigorousRpeMin) vigorous += s.durationMin;
      else if (s.rpe >= r.moderateRpe[0]) moderate += s.durationMin;
      else light += s.durationMin;
    } else if (inList(r.strengthKinds, s.kind)) {
      counted++;
      if (s.rpe >= r.strengthRpeMin) strengthDates.add(s.date);
    }
  }
  return {
    weekStart,
    moderateMinutes: moderate,
    vigorousMinutes: vigorous,
    lightMinutes: light,
    strengthDays: strengthDates.size,
    aerobicMet: moderate >= r.moderateMinutes[0] || vigorous >= r.vigorousMinutes[0],
    strengthMet: strengthDates.size >= r.strengthDaysMin,
    hasSessions: counted > 0,
  };
}
