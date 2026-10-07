// Beslenme hedefi ve ter testi metinleri (karar 0029). Hedef bir rehber aralık, eşik değil; ter testi
// notları tanı değil. Takviye ve öğün kaydı bu kapsamda yok.

import { proteinTarget, type DayType, type NutritionTargets, type SweatTestResult, type TargetWeight } from '@hooplab/engine';

import { formatDecimal } from './recovery.ts';

export const dayTypeLabels: Record<DayType, string> = {
  rest: 'Dinlenme',
  training: 'Antrenman',
  high: 'Yoğun',
};

const range = (r: readonly [number, number], digits = 0) =>
  `${formatDecimal(r[0], digits)}–${formatDecimal(r[1], digits)}`;

export function dayTypeNote(dayType: DayType, inferred: DayType, override: DayType | null): string {
  if (override === null) {
    return dayType === 'rest' ? 'bugün seans kaydı yok' : dayType === 'high' ? 'maç ya da 3 saat ve üstü seans' : 'bugünkü seanslarından';
  }
  return `senin seçimin · kayıtlardan: ${dayTypeLabels[inferred].toLocaleLowerCase('tr')}`;
}

export function carbsValue(t: NutritionTargets): string {
  return t.carbsG ? `${range(t.carbsG)} g` : `${range(t.carbsPerKg)} g/kg`;
}

export function carbsDetail(t: NutritionTargets): string {
  return t.carbsG ? `${range(t.carbsPerKg)} g/kg` : 'kilonu girince gram olarak';
}

export function proteinValue(t: NutritionTargets): string {
  return t.proteinG ? `${range(t.proteinG)} g` : `${range(t.proteinPerKg, 1)} g/kg`;
}

export function proteinDetail(t: NutritionTargets): string {
  const meal = t.proteinPerMealG ? `öğün başı ~${t.proteinPerMealG} g` : `öğün başı ~${formatDecimal(t.proteinPerMealPerKg)} g/kg`;
  const [a, b] = proteinTarget.mealIntervalHours;
  return `${range(t.proteinPerKg, 1)} g/kg · ${meal}, ${a}-${b} saatte bir`;
}

export function weightValue(w: TargetWeight | null): string {
  return w ? `${formatDecimal(w.kg)} kg` : 'Gir';
}

export function weightDetail(w: TargetWeight | null, todayWeight: number | null): string {
  if (!w) return 'hedefler gram olarak görünsün';
  const basis = w.basis === 'average' ? `son 7 gün ort. (${w.n} ölçüm)` : 'son ölçüm, 7 günde ölçüm yok';
  return todayWeight === null ? `${basis} · bugün girilmedi` : basis;
}

export const nutritionFooter =
  'Rehber aralık, alımla karşılaştırılmıyor. Kişisel bir beslenme planı için spor diyetisyenine danış.';

// --- Ter testi ---

export function sweatSummary(r: SweatTestResult): string {
  const pct = `${r.changePercent > 0 ? '+' : r.changePercent < 0 ? '−' : ''}%${formatDecimal(Math.abs(r.changePercent))}`;
  return `ter ${formatDecimal(r.rateLPerH)} L/sa · kilo ${pct}`;
}

export function sweatLossText(r: SweatTestResult): string {
  return `Ter kaybı ${formatDecimal(r.lossL)} L, ter oranı ${formatDecimal(r.rateLPerH)} L/saat.`;
}

export const sweatLossNote = "Seans boyunca kilo kaybın %2'nin üstünde. Bu düzeyde basketbol becerisi düşebiliyor; sonraki seansta daha sık iç.";

export const sweatGainNote =
  'Seansta kilon arttı: ihtiyacından fazla içmiş olabilirsin. Fazla içmek yarar sağlamaz; baş ağrısı, bulantı veya kafa karışıklığı olursa sağlık ekibine başvur. Tartı farkı küçükse ölçüm hatası da olabilir.';

export function fluidTargetText(r: SweatTestResult): string | null {
  if (!r.shortRecoveryFluidL) return null;
  const [a, b] = r.shortRecoveryFluidL;
  return `Sonraki seansa 4 saatten az varsa ${formatDecimal(a)}–${formatDecimal(b)} L iç. Daha uzun ara varsa öğünlerle birlikte, susadıkça.`;
}
