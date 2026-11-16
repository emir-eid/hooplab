// Adım metinleri (karar 0061 sıra 6, fitness profili). Saf modül (Node testleriyle denetlenir): sayılar
// @hooplab/engine'den (rules/aktivite.json → adim-gunluk). Hedef, renk ve uyarı yok.

import { stepsRule, type StepsReading } from '@hooplab/engine';

import type { ValueRow } from './recovery.ts';

/** 7842 → "7.842" (binlik ayırıcı nokta). */
export function formatSteps(steps: number): string {
  return String(Math.round(steps)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const dash = '–';
export const stepsText = (v: number | null) => (v === null ? dash : `${formatSteps(v)} adım`);

/** "7 gün ort." ya da eksik günde "7 gün ort. (5 gün)". */
export function stepsAverageLabel(n: number): string {
  const base = `${stepsRule.averageDays} gün ort.`;
  return n > 0 && n < stepsRule.averageDays ? `${base} (${n} gün)` : base;
}

function clockOf(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

export const stepsTitle = 'Adım';

/** Büyük sayının ne olduğu ve kartta görünen tek sade cümle (başvuru noktası; hedef değil). */
export function stepsNote(reading: StepsReading, updatedAt: string | null): string {
  const ref = `Araştırmalarda günde ${formatSteps(stepsRule.referenceSteps)} civarı adım, çok az adıma göre daha iyi sağlıkla ilişkili.`;
  if (reading.today === null) return `Bugün için henüz veri yok. ${ref}`;
  const clock = clockOf(updatedAt);
  return `${clock ? `Bugün şu ana kadar · ${clock} itibarıyla` : 'Bugün şu ana kadar'}. ${ref}`;
}

export function stepsRows(reading: StepsReading): ValueRow[] {
  return [
    { label: 'Dün (tam gün)', value: stepsText(reading.yesterday) },
    { label: stepsAverageLabel(reading.averageN), value: stepsText(reading.average) },
  ];
}

/** Açıklama sayfasının "Senin değerlerin" satırları: bugünün değeri de yazılır. */
export function stepsPageRows(reading: StepsReading): ValueRow[] {
  return [{ label: 'Bugün şu ana kadar', value: stepsText(reading.today) }, ...stepsRows(reading)];
}
