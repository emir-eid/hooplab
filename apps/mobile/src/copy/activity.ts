// Haftalık aktivite metinleri (karar 0061 sıra 6, fitness profili). Saf modül (Node testleriyle denetlenir): sayılar
// @hooplab/engine'den (rules/aktivite.json → haftalik-aktivite). Orta ve yüksek dakikalar toplanmaz.

import { weeklyActivityRule as r, type WeeklyActivityReading } from '@hooplab/engine';

import type { ValueRow } from './recovery.ts';

export const activityTitle = 'Haftalık aktivite';

export const activityFooter =
  'Yalnız kaydettiğin kondisyon ve kuvvet seansları sayılır; yürüyüş ve günlük hareket girmez. Öneri Dünya Sağlık Örgütü 2020 kılavuzundan.';

/** Üst satır: aerobik önerinin durumu, sade dille. Süren haftada "şu ana kadar". */
export function aerobicSummary(a: WeeklyActivityReading, current: boolean): string {
  if (a.aerobicMet) return current ? 'Aerobik öneri bu hafta karşılandı' : 'Aerobik öneri karşılandı';
  return `Öneri: ${r.moderateMinutes[0]} dk orta ya da ${r.vigorousMinutes[0]} dk yüksek yoğunluk`;
}

export function strengthSummary(a: WeeklyActivityReading): string {
  return a.strengthMet ? 'Kuvvet önerisi karşılandı' : `Öneri: haftada en az ${r.strengthDaysMin} gün`;
}

const min = (n: number) => `${Math.round(n)} dk`;

/** Dakika satırları: orta, yüksek ve (varsa) öneriye sayılmayan düşük puanlı dakikalar. */
export function activityRows(a: WeeklyActivityReading): ValueRow[] {
  const rows: ValueRow[] = [
    { label: `Orta yoğunluk (RPE ${r.moderateRpe[0]}-${r.moderateRpe[1]})`, value: min(a.moderateMinutes) },
    { label: `Yüksek yoğunluk (RPE ${r.vigorousRpeMin}+)`, value: min(a.vigorousMinutes) },
  ];
  if (a.lightMinutes > 0) rows.push({ label: `Hafif (RPE ${r.moderateRpe[0]} altı, sayılmaz)`, value: min(a.lightMinutes) });
  return rows;
}

export function strengthDaysText(a: WeeklyActivityReading): string {
  return `${a.strengthDays} / ${r.strengthDaysMin} gün`;
}

export const noActivityText = 'Bu hafta kondisyon ya da kuvvet seansı kaydı yok';
