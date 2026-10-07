// Kas ve tendon bölge yükü metinleri (karar 0027). Her şey tahmin; eşik, renk ve risk dili yok.
// Ağrı izleme notu tanı değildir (CLAUDE.md §3).

import { regionWindow, type BodySpot, type PainNote, type RegionLoad } from '@hooplab/engine';

import { regionLabels, sideLabels } from './labels.ts';
import { formatLoad } from './training-load.ts';

export const regionEstimateLabel = 'Tahmin';

export const regionWindowText = `Tendon ${regionWindow.tendonHours} saat · kas ${regionWindow.muscleHours} saat`;

export function spotName({ region, side }: BodySpot): string {
  return side === 'center' ? regionLabels[region] : `${regionLabels[region]} · ${sideLabels[side].toLocaleLowerCase('tr')}`;
}

/** Son yüklenme: saati biliniyorsa saat, değilse gün. */
export function lastLoadedText(r: RegionLoad): string {
  if (r.hoursSinceLoaded !== null && r.daysSinceLoaded !== null && r.daysSinceLoaded <= 3) {
    const h = Math.round(r.hoursSinceLoaded);
    return h < 1 ? 'az önce' : `${h} saat önce`;
  }
  if (r.daysSinceLoaded === null) return 'kayıtlarında yok';
  if (r.daysSinceLoaded === 0) return 'bugün';
  if (r.daysSinceLoaded === 1) return 'dün';
  return `${r.daysSinceLoaded} gün önce`;
}

export function typicalText(r: RegionLoad): string {
  return r.typical === null ? 'olağan: 4 haftalık kayıttan sonra' : `olağan ${formatLoad(r.typical)} AU`;
}

export function regionSessionsText(r: RegionLoad): string {
  return `${r.sessions} seans · ${lastLoadedText(r)}`;
}

export function windowLabel(r: RegionLoad): string {
  return `son ${r.windowHours} saat`;
}

export function defaultedNote(n: number): string {
  return `Son 3 günde ${n} seansta içerik girilmemiş; türün hazır etiketleri sayıldı.`;
}

export const notModeledNote = 'Ayak bileği ve bel modelde yok; yalnız ağrı haritasında.';

export const regionLoadFooter = 'Bölge yükü dokuya binen yük değil: o bölgeyi çalıştıran seansların yükü. Eşiği yok.';

export function painNoteText(note: PainNote): string {
  const parts: string[] = [];
  if (note.reasons.includes('high')) parts.push(`Sabah ağrısı ${note.pain} / 10, 5'in üstünde.`);
  if (note.reasons.includes('notDecreasing')) {
    parts.push(`Dün çalıştı ve ağrı azalmadı (dün ${note.yesterdayPain}, bugün ${note.pain}).`);
  }
  return parts.join(' ');
}

export const painNoteFooter =
  'Tahmin, tanı değil. Ağrı şiddetliyse, aniden başladıysa veya şişlik varsa doktora ya da fizyoterapiste başvur.';
