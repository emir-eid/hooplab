// Vücut görünümünün verisi: seçilen aralıktaki (1 / 3 / 7 gün) ağrı haritaları.
// Çok günlü aralıkta değerler birleştirilmez (en yüksek, ortalama yok); bölge gün gün gösterilir (karar 0018).
// "Check-in yok" ile "ağrı yok" ayrı tutulur: check-in yapılmayan gün null'dır, 0 değil.

import { bodySpots, type BodySpot } from '@hooplab/engine';

import { painMapFromRows, painOf, type PainMap } from './pain-map.ts';
import { addDays, toLocalDate } from '../utils/local-date.ts';

export const bodyWindows = [1, 3, 7] as const;
export type BodyWindow = (typeof bodyWindows)[number];

export interface PainHistory {
  /** Eskiden yeniye yerel tarihler; son eleman bugün. */
  dates: readonly string[];
  /** Check-in yapılan günler. */
  checkinDates: ReadonlySet<string>;
  /** Check-in yapılan her günün ağrı haritası. */
  byDate: Readonly<Record<string, PainMap>>;
}

export interface PainDay {
  date: string;
  /** null: o gün check-in yok. */
  pain: number | null;
}

/** Bugün dahil, eskiden yeniye `days` günlük yerel tarih listesi. */
export function windowDates(today: Date, days: BodyWindow): string[] {
  return Array.from({ length: days }, (_, i) => toLocalDate(addDays(today, i - (days - 1))));
}

export function buildPainHistory(
  dates: readonly string[],
  checkinRows: readonly { local_date: string }[],
  painRows: readonly { local_date: string; region: string; side: string; pain: number }[],
): PainHistory {
  const inWindow = new Set(dates);
  const checkinDates = new Set(checkinRows.map((r) => r.local_date).filter((d) => inWindow.has(d)));
  const byDate: Record<string, PainMap> = {};
  for (const date of checkinDates) {
    byDate[date] = painMapFromRows(painRows.filter((r) => r.local_date === date));
  }
  return { dates, checkinDates, byDate };
}

/** Bir noktanın aralıktaki günleri, eskiden yeniye. */
export function painDays(history: PainHistory, spot: BodySpot): PainDay[] {
  return history.dates.map((date) => {
    const map = history.byDate[date];
    return { date, pain: map ? painOf(map, spot) : null };
  });
}

/** Aralıkta en az bir gün ağrı girilen noktalar, bölge sırasıyla. */
export function spotsWithPain(history: PainHistory): BodySpot[] {
  return bodySpots.filter((spot) => painDays(history, spot).some((d) => (d.pain ?? 0) > 0));
}

/** Aralığın son günü (bugün) için ağrı haritası; check-in yoksa null. */
export function latestPainMap(history: PainHistory): PainMap | null {
  const last = history.dates[history.dates.length - 1];
  return last ? (history.byDate[last] ?? null) : null;
}
