// Vücut görünümündeki stilize mankenin parçaları (karar 0018): kapsül ve kürelerden yapılır.
// Bölgeli parçalar @hooplab/engine bodySpots ile birebir eşleşir; ağrı bu parçalara boyanır.
// Saf veri (testli). Birim metre; sporcu +z'ye (kameraya) bakar, sol tarafı +x'tedir. Ayak tabanı y = 0.

import { bodySpots, spotKey, type BodyRegion, type BodySpot } from '@hooplab/engine';

export type Vec3 = readonly [number, number, number];

interface PartBase {
  id: string;
  /** Bölgesiz parçalar (baş, gövde, kol...) yalnız mankenin gövdesidir, boyanmaz. */
  spot: BodySpot | null;
  /** Eksen boyunca ölçek: [x, y, z]; yumuşak, basık şekiller için. */
  scale?: Vec3;
}

export interface CapsulePart extends PartBase {
  shape: 'capsule';
  from: Vec3;
  to: Vec3;
  radius: number;
}

export interface SpherePart extends PartBase {
  shape: 'sphere';
  center: Vec3;
  radius: number;
}

/** Dikey eksen etrafında döndürülen profil (gövde): [yarıçap, y] noktaları, aşağıdan yukarı. */
export interface LathePart extends PartBase {
  shape: 'lathe';
  center: Vec3;
  profile: readonly (readonly [number, number])[];
}

export type BodyPart = CapsulePart | SpherePart | LathePart;

type Side = 'left' | 'right';

/** Sol taraf tanımları; sağ taraf x'in işareti çevrilerek üretilir. */
const limbs: ((side: Side) => BodyPart)[] = [
  // Kol (bölgesiz) ve omuz
  (side) => sphere(`shoulder-${side}`, { region: 'shoulder', side }, [0.215, 1.385, 0], 0.078),
  (side) => capsule(`upper-arm-${side}`, null, [0.245, 1.35, 0], [0.275, 1.08, -0.005], 0.05),
  (side) => capsule(`forearm-${side}`, null, [0.28, 1.06, -0.005], [0.3, 0.83, 0.035], 0.042),
  (side) => sphere(`hand-${side}`, null, [0.305, 0.775, 0.045], 0.044, [0.8, 1.35, 1]),
  // Kalça (yan-arka) ve uyluk
  (side) => sphere(`hip-${side}`, { region: 'hip', side }, [0.112, 0.88, -0.05], 0.08, [1, 1.08, 0.85]),
  (side) => capsule(`thigh-${side}`, null, [0.1, 0.86, 0], [0.105, 0.52, 0], 0.074),
  (side) => sphere(`quadriceps-${side}`, { region: 'quadriceps', side }, [0.106, 0.68, 0.03], 0.066, [1, 2.05, 0.82]),
  (side) => sphere(`hamstring-${side}`, { region: 'hamstring', side }, [0.106, 0.69, -0.03], 0.064, [1, 1.95, 0.82]),
  (side) => sphere(`adductor-${side}`, { region: 'adductor', side }, [0.07, 0.73, 0.004], 0.05, [0.85, 2, 0.95]),
  // Diz, patellar tendon, bacak
  (side) => sphere(`knee-${side}`, null, [0.106, 0.5, 0.005], 0.058),
  (side) => capsule(`patellar-${side}`, { region: 'patellar_tendon', side }, [0.106, 0.475, 0.05], [0.106, 0.425, 0.048], 0.022),
  (side) => capsule(`shin-${side}`, null, [0.106, 0.47, 0], [0.106, 0.1, 0], 0.048),
  (side) => sphere(`calf-${side}`, { region: 'calf', side }, [0.106, 0.335, -0.022], 0.056, [0.95, 2.05, 0.95]),
  (side) => capsule(`achilles-${side}`, { region: 'achilles', side }, [0.106, 0.2, -0.042], [0.106, 0.085, -0.05], 0.02),
  (side) => sphere(`ankle-${side}`, { region: 'ankle', side }, [0.106, 0.075, 0], 0.042),
  (side) => capsule(`foot-${side}`, null, [0.106, 0.035, -0.025], [0.112, 0.035, 0.135], 0.034),
];

const axial: BodyPart[] = [
  sphere('head', null, [0, 1.665, 0.005], 0.105, [0.92, 1.12, 1]),
  capsule('neck', null, [0, 1.47, -0.005], [0, 1.56, 0], 0.05),
  // Atletik V gövde: kalçadan bele daralır, göğüs ve omuzda genişler.
  lathe('torso', null, [0, 0, 0], [
    [0, 0.8],
    [0.1, 0.81],
    [0.15, 0.85],
    [0.158, 0.9],
    [0.148, 0.96],
    [0.136, 1.03],
    [0.142, 1.1],
    [0.163, 1.2],
    [0.178, 1.3],
    [0.172, 1.37],
    [0.14, 1.43],
    [0.075, 1.47],
    [0, 1.48],
  ], [1.18, 1, 0.66]),
  sphere('lower-back', { region: 'lower_back', side: 'center' }, [0, 1.03, -0.07], 0.07, [1.45, 1.15, 0.5]),
];

export const bodyParts: readonly BodyPart[] = [
  ...axial,
  ...limbs.map((make) => make('left')),
  ...limbs.map((make) => mirror(make('left'))),
];

/** Kamera hedefi ve boy: sahne bunlara göre kadrajlanır. */
export const bodyFrame = { centerY: 0.88, height: 1.78 } as const;

/**
 * Bölgeyi kameraya döndüren bakış açısı (radyan, dikey eksen). 0: önden, π: arkadan.
 * Sporcunun solu +x olduğu için sol yan -π/2 ile görünür. Tablo sol taraf içindir; sağda işaret çevrilir.
 */
const leftFacing: Record<BodyRegion, number> = {
  quadriceps: 0,
  patellar_tendon: 0,
  ankle: 0,
  adductor: 0.6,
  shoulder: -Math.PI / 4,
  hip: (-3 * Math.PI) / 4,
  hamstring: Math.PI,
  calf: Math.PI,
  achilles: Math.PI,
  lower_back: Math.PI,
};

export function facingYaw({ region, side }: BodySpot): number {
  const yaw = leftFacing[region];
  if (side !== 'right' || yaw === 0 || yaw === Math.PI) return yaw;
  return -yaw;
}

/** Bir bölge-taraf çiftine ait parçalar. */
export function partsOf(spot: BodySpot): BodyPart[] {
  const key = spotKey(spot);
  return bodyParts.filter((part) => part.spot !== null && spotKey(part.spot) === key);
}

/** Model tutarlılığı: her bodySpot'un en az bir parçası var, tanımsız bölge yok. */
export function unmappedSpots(): BodySpot[] {
  return bodySpots.filter((spot) => partsOf(spot).length === 0);
}

function capsule(id: string, spot: BodySpot | null, from: Vec3, to: Vec3, radius: number, scale?: Vec3): CapsulePart {
  return { id, spot, shape: 'capsule', from, to, radius, ...(scale ? { scale } : {}) };
}

function lathe(id: string, spot: BodySpot | null, center: Vec3, profile: LathePart['profile'], scale?: Vec3): LathePart {
  return { id, spot, shape: 'lathe', center, profile, ...(scale ? { scale } : {}) };
}

function sphere(id: string, spot: BodySpot | null, center: Vec3, radius: number, scale?: Vec3): SpherePart {
  return { id, spot, shape: 'sphere', center, radius, ...(scale ? { scale } : {}) };
}

function flipX([x, y, z]: Vec3): Vec3 {
  return [-x, y, z];
}

function mirror(part: BodyPart): BodyPart {
  const id = part.id.replace(/-left$/, '-right');
  const spot = part.spot ? { region: part.spot.region, side: 'right' as const } : null;
  return part.shape === 'capsule'
    ? { ...part, id, spot, from: flipX(part.from), to: flipX(part.to) }
    : { ...part, id, spot, center: flipX(part.center) };
}
