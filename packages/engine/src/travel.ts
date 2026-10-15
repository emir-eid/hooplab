// Seyahat ve jet lag (karar 0047, research/rules/seyahat.json). Kullanıcı seyahati gidiş günü, dönüş günü ve saat
// farkıyla kaydeder; motor bugünün evresini (yaklaşıyor, yolculuk günü, varış yerinde, dönüşten sonra) ve jet lag
// varsa kalan uyumu konsensüsün kaba kuralıyla tahmin eder. Kişisel ışık penceresi hesaplanmaz; günün durumu değişmez.

import { addIsoDays } from './recovery.ts';

/** İki yerel tarih arasındaki gün farkı (b − a). */
function daysBetween(a: string, b: string): number {
  const t = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
  return Math.round((t(b) - t(a)) / 86_400_000);
}

export interface Trip {
  /** Veritabanı kimliği; yeni seyahatte yok. */
  id?: string;
  /** Gidiş günü (yerel tarih). */
  departDate: string;
  /** Dönüş günü; bilinmiyorsa null. */
  returnDate: string | null;
  /** Varış yerinin saati evin saatinden kaç saat ileri (+, doğu) ya da geri (−, batı). */
  offsetHours: number;
}

/** Saat farkı girişi (saat); veritabanındaki CHECK ile aynı, bilimsel eşik değil. */
export const tripOffsetLimits = { min: -12, max: 14 } as const;

/** rules/seyahat.json → seyahat-yorgunlugu */
export const travelFatigueRule = { caffeineBeforeSleepHours: 6, alcohol: false } as const;

/** rules/seyahat.json → jet-lag-uyum */
export const jetLagRule = {
  minTimeZones: 3,
  hoursPerDay: { west: 2, east: 1 },
  eastDelayAboveHours: 8,
} as const;

/** rules/seyahat.json → jet-lag-varis */
export const arrivalRule = {
  firstHours: 72,
  preShiftMinPerDay: [30, 60] as readonly [number, number],
  preShiftDays: [3, 4] as readonly [number, number],
} as const;

export type TravelDirection = 'east' | 'west';
export type TravelPhase = 'before' | 'departure' | 'away' | 'return' | 'after';

export interface TravelReading {
  trip: Trip;
  phase: TravelPhase;
  /** Saat farkı yoksa null. */
  direction: TravelDirection | null;
  /** Geçilen saat dilimi (saat farkının mutlak değeri). */
  zones: number;
  /** 3 veya daha fazla saat dilimi: jet lag beklenir. */
  jetLag: boolean;
  /** Yaklaşıyorsa gidişe kalan gün. */
  daysUntil: number | null;
  /** Varış yerinde kaçıncı gün (gidiş günü 1). */
  dayAway: number | null;
  /** Tahmini toplam uyum (gün, yukarı yuvarlı); jet lag yoksa null. */
  totalDays: number | null;
  /** Tahmini kalan uyum (gün, yukarı yuvarlı); jet lag yoksa null, bittiyse 0. */
  remainingDays: number | null;
  /** Doğuya 8 saatten fazla: geri alarak uyum daha kolay olabilir (yalnız not). */
  eastDelayHint: boolean;
  /** Varıştan sonraki ilk 72 saat içinde mi (gidiş günü dahil). */
  firstHours: boolean;
}

export function isValidOffset(hours: number): boolean {
  return Number.isInteger(hours) && hours >= tripOffsetLimits.min && hours <= tripOffsetLimits.max;
}

export function directionOf(offsetHours: number): TravelDirection | null {
  return offsetHours > 0 ? 'east' : offsetHours < 0 ? 'west' : null;
}

const opposite = (d: TravelDirection): TravelDirection => (d === 'east' ? 'west' : 'east');

/** `shift` saatlik uyumun `direction` yönünde kaç gün süreceği (kaba kural, yukarı yuvarlı). */
export function adaptationDays(shift: number, direction: TravelDirection): number {
  return Math.max(0, Math.ceil(shift / jetLagRule.hoursPerDay[direction] - 1e-9));
}

/** Gidişten `days` gün sonra iç saatin varış yerine kaç saat uyduğu (en fazla saat farkı kadar). */
function adaptedHours(zones: number, direction: TravelDirection, days: number): number {
  return Math.min(zones, Math.max(0, days) * jetLagRule.hoursPerDay[direction]);
}

/**
 * Bugünün seyahat okuması; ilgili seyahat yoksa null. Gidişten önceki günler yalnız jet lag'li seyahatte gösterilir
 * (uçuş öncesi kaydırma penceresi, jet-lag-varis). Dönüşten sonra uyum sürdükçe gösterilir. Birden çok seyahat
 * eşleşirse en yakını (yolculuk günü ve varış yerindeki önce).
 */
export function travelReading(today: string, trips: readonly Trip[]): TravelReading | null {
  const readings = trips.map((t) => readTrip(today, t)).filter((r): r is TravelReading => r !== null);
  const rank: Record<TravelPhase, number> = { departure: 0, return: 0, away: 1, after: 2, before: 3 };
  return readings.sort((a, b) => rank[a.phase] - rank[b.phase])[0] ?? null;
}

function readTrip(today: string, trip: Trip): TravelReading | null {
  if (!isValidOffset(trip.offsetHours)) return null;
  const zones = Math.abs(trip.offsetHours);
  const direction = directionOf(trip.offsetHours);
  const jetLag = direction !== null && zones >= jetLagRule.minTimeZones;
  const base = {
    trip,
    direction,
    zones,
    jetLag,
    daysUntil: null,
    dayAway: null,
    totalDays: null,
    remainingDays: null,
    eastDelayHint: direction === 'east' && zones > jetLagRule.eastDelayAboveHours,
    firstHours: false,
  };
  const sinceDepart = daysBetween(trip.departDate, today);

  if (sinceDepart < 0) {
    if (!jetLag || -sinceDepart > arrivalRule.preShiftDays[1]) return null;
    return { ...base, phase: 'before', daysUntil: -sinceDepart, totalDays: adaptationDays(zones, direction!) };
  }

  const returned = trip.returnDate !== null && today >= trip.returnDate;
  if (!returned) {
    const phase: TravelPhase = sinceDepart === 0 ? 'departure' : 'away';
    if (!jetLag) return phase === 'departure' ? { ...base, phase } : null;
    const total = adaptationDays(zones, direction!);
    const remaining = adaptationDays(zones - adaptedHours(zones, direction!, sinceDepart), direction!);
    // Dönüş günü bilinmiyorsa uyum bitince seyahat notu kalkar.
    if (phase === 'away' && trip.returnDate === null && remaining === 0) return null;
    return {
      ...base,
      phase,
      dayAway: sinceDepart + 1,
      totalDays: total,
      remainingDays: remaining,
      firstHours: sinceDepart * 24 < arrivalRule.firstHours,
    };
  }

  // Dönüş: varış yerinde ne kadar uyum sağlandıysa o kadar ters yönde, ters yönün hızıyla.
  const sinceReturn = daysBetween(trip.returnDate!, today);
  const phase: TravelPhase = sinceReturn === 0 ? 'return' : 'after';
  if (!jetLag) return phase === 'return' ? { ...base, phase } : null;
  const back = opposite(direction!);
  const shifted = adaptedHours(zones, direction!, daysBetween(trip.departDate, trip.returnDate!));
  const total = adaptationDays(shifted, back);
  const remaining = adaptationDays(Math.max(0, shifted - sinceReturn * jetLagRule.hoursPerDay[back]), back);
  if (phase === 'after' && remaining === 0) return null;
  return {
    ...base,
    phase,
    direction: back,
    totalDays: total,
    remainingDays: remaining,
    eastDelayHint: back === 'east' && shifted > jetLagRule.eastDelayAboveHours,
    firstHours: sinceReturn * 24 < arrivalRule.firstHours,
  };
}

/** Takvimde gösterilecek seyahatler: dönüşü bugünden önce bitmemiş olanlar (dönüşsüz olanlar gidişten 30 gün sonraya kadar). */
export function upcomingTrips(today: string, trips: readonly Trip[]): Trip[] {
  return trips
    .filter((t) => (t.returnDate ?? addIsoDays(t.departDate, 30)) >= today)
    .sort((a, b) => (a.departDate < b.departDate ? -1 : 1));
}
