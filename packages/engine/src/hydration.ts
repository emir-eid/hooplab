// Ter testi (karar 0029, research/rules/hidrasyon.json): seans öncesi ve sonrası tartı, içilen sıvı, idrar.
// Ter kaybı = ön − son + sıvı − idrar (1 kg ≈ 1 L); ter oranı = kayıp / süre. Notlar tanı değildir.

import { durationLimits } from './session-load.ts';
import { isValidWeight } from './nutrition.ts';

/** rules/hidrasyon.json → kilo-kaybi-notu */
export const lossNoteRule = { lossPercentMin: 2 } as const;

/** rules/hidrasyon.json → kilo-artisi-notu */
export const gainNoteRule = { gainKgAbove: 0 } as const;

/** rules/hidrasyon.json → sivi-hedefi */
export const fluidTargetRule = { shortRecoveryHoursBelow: 4, litersPerKgLost: [1.0, 1.5] as readonly [number, number] } as const;

/** Giriş sınırları (L); veritabanındaki CHECK ile aynı, bilimsel eşik değil. */
export const sweatInputLimits = { fluidMaxL: 10, urineMaxL: 5 } as const;

export interface SweatTestInput {
  preKg: number;
  postKg: number;
  /** Seansta içilen sıvı (L); girilmezse 0. */
  fluidL: number;
  /** Seansta idrar (L); girilmezse 0. */
  urineL: number;
  durationMin: number;
}

export interface SweatTestResult {
  /** Ter kaybı (L). */
  lossL: number;
  /** Ter oranı (L/saat). */
  rateLPerH: number;
  /** Net kilo değişimi (son − ön, kg); negatif = kayıp. */
  changeKg: number;
  /** Net değişim, ön kilonun yüzdesi; negatif = kayıp. */
  changePercent: number;
  /** Net kayıp %2 veya üstü. */
  lossNote: boolean;
  /** Seansta kilo arttı (fazla içme). */
  gainNote: boolean;
  /** Net kayıp varsa, sonraki seansa 4 saatten az varken içilecek sıvı (L); kayıp yoksa null. */
  shortRecoveryFluidL: [number, number] | null;
}

const round = (x: number, digits: number) => Math.round(x * 10 ** digits) / 10 ** digits;

/** Girdi geçersizse (kilo, sıvı, idrar veya süre sınır dışı) null; uydurma sonuç üretilmez. */
export function sweatTest(input: SweatTestInput): SweatTestResult | null {
  const { preKg, postKg, fluidL, urineL, durationMin } = input;
  if (!isValidWeight(preKg) || !isValidWeight(postKg)) return null;
  if (!Number.isFinite(fluidL) || fluidL < 0 || fluidL > sweatInputLimits.fluidMaxL) return null;
  if (!Number.isFinite(urineL) || urineL < 0 || urineL > sweatInputLimits.urineMaxL) return null;
  if (!Number.isInteger(durationMin) || durationMin < durationLimits.min || durationMin > durationLimits.max) return null;

  // Kilo 0,01 kg hassasiyette girilir; kayan nokta artıkları sonucu oynatmasın.
  const changeKg = round(postKg - preKg, 2);
  const lossL = round(preKg - postKg + fluidL - urineL, 2);
  const changePercent = (changeKg / preKg) * 100;
  const lostKg = -changeKg;
  return {
    lossL,
    rateLPerH: lossL / (durationMin / 60),
    changeKg,
    changePercent,
    lossNote: -changePercent >= lossNoteRule.lossPercentMin,
    gainNote: changeKg > gainNoteRule.gainKgAbove,
    shortRecoveryFluidL:
      lostKg > 0 ? [round(lostKg * fluidTargetRule.litersPerKgLost[0], 1), round(lostKg * fluidTargetRule.litersPerKgLost[1], 1)] : null,
  };
}
