// Formdaki ağrı haritası durumu: yalnız 0'dan büyük değerler tutulur; 0 = o gün ağrı yok, kayıt yazılmaz.
// Saf fonksiyonlar (testli); veritabanı biçimine çeviri burada.

import {
  bodySpots,
  isOnScale,
  painScale,
  spotKey,
  type BodyRegion,
  type BodySpot,
} from '@hooplab/engine';

export interface PainEntry extends BodySpot {
  pain: number;
}

/** Anahtar: spotKey ("achilles:left"). */
export type PainMap = Readonly<Record<string, number>>;

export function setPain(map: PainMap, spot: BodySpot, pain: number): PainMap {
  const key = spotKey(spot);
  const { [key]: _removed, ...rest } = map;
  if (!isOnScale(painScale, pain) || pain === 0) return rest;
  return { ...rest, [key]: pain };
}

export function painOf(map: PainMap, spot: BodySpot): number {
  return map[spotKey(spot)] ?? 0;
}

/** Bir bölgenin taraflarındaki en yüksek ağrı (çipteki rozet). */
export function regionMax(map: PainMap, region: BodyRegion): number {
  return bodySpots.filter((s) => s.region === region).reduce((max, s) => Math.max(max, painOf(map, s)), 0);
}

/** Veritabanına gidecek liste, bölge sırasıyla. */
export function painEntries(map: PainMap): PainEntry[] {
  return bodySpots.flatMap((spot) => {
    const pain = painOf(map, spot);
    return pain > 0 ? [{ ...spot, pain }] : [];
  });
}

/** Veritabanı satırlarından harita; tanınmayan veya ölçek dışı satır atlanır. */
export function painMapFromRows(rows: readonly { region: string; side: string; pain: number }[]): PainMap {
  let map: PainMap = {};
  for (const row of rows) {
    const spot = bodySpots.find((s) => s.region === row.region && s.side === row.side);
    if (spot) map = setPain(map, spot, row.pain);
  }
  return map;
}
