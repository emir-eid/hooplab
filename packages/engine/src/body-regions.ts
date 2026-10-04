// Ağrı haritası ve (ileride) vücut görünümünün ortak bölge listesi. Bölgeler PRODUCT §4'ten; basketbolda
// sıçrama, ani duruş ve sprintin yüklediği yapılar. Sol ve sağ ayrı tutulur (karar 0017): tek taraflı
// tendon sorunları kaybolmasın. Bel orta hatta olduğu için tek.
// Kimlikler veritabanındaki CHECK listesiyle aynıdır (supabase/migrations/*_sabah_check_in.sql).

export const bodyRegions = [
  'calf',
  'achilles',
  'ankle',
  'patellar_tendon',
  'quadriceps',
  'hamstring',
  'adductor',
  'hip',
  'lower_back',
  'shoulder',
] as const;
export type BodyRegion = (typeof bodyRegions)[number];

export const bodySides = ['left', 'right', 'center'] as const;
export type BodySide = (typeof bodySides)[number];

/** Orta hattaki bölgeler: yalnız `center` tarafı alır. Diğerleri yalnız `left` / `right`. */
export const midlineRegions: readonly BodyRegion[] = ['lower_back'];

export function sidesOf(region: BodyRegion): readonly BodySide[] {
  return midlineRegions.includes(region) ? ['center'] : ['left', 'right'];
}

export interface BodySpot {
  region: BodyRegion;
  side: BodySide;
}

/** Formda ve haritada gösterilecek tüm bölge-taraf çiftleri, bölge sırasıyla. */
export const bodySpots: readonly BodySpot[] = bodyRegions.flatMap((region) =>
  sidesOf(region).map((side) => ({ region, side })),
);

export function spotKey({ region, side }: BodySpot): string {
  return `${region}:${side}`;
}
