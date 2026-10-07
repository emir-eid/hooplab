// Solunum ve sabah check-in'in kişisel kıyas metinleri (karar 0028). Tanı yok, risk dili yok;
// solunum notu olası nedenleri sayar ve belirtide doktora yönlendirir (CLAUDE.md §3).

import { checkinBaseline, recoveryBand, type CheckinReading, type RespirationReading } from '@hooplab/engine';

import { wellnessLabels } from './labels.ts';
import { bandNote, formatDecimal, rollingLabel, weeks } from './recovery.ts';

const checkinWeeks = weeks(checkinBaseline.baselineDays);
const lowSd = formatDecimal(Math.abs(checkinBaseline.zNoteMax), 0);

/** Solunum kartının alt satırı. */
export function respirationNote(r: RespirationReading): string {
  if (r.rolling === null) return bandNote(r);
  return `${rollingLabel} ${formatDecimal(r.rolling)} · ${bandNote(r)}`;
}

export const respirationHighTitle = 'Son gece solunum alıştığından belirgin yüksek';

export function respirationHighBody(r: RespirationReading): string {
  const last = r.latest ? formatDecimal(r.latest.value) : '–';
  const usual = r.band ? formatDecimal(r.band.mean) : '–';
  return `Son gece ${last} nefes/dk; önceki ${weeks(recoveryBand.baselineDays)} haftanın ortalaması ${usual}. Hastalık başlangıcında da, sıcak, alkol, stres veya yükseklikte de görülebilir. Tek gecelik artış tek başına bir şey kanıtlamaz; sonraki gecelere de bak.`;
}

export const respirationHighFooter =
  'Tanı değil. Ateş, boğaz ağrısı, öksürük, nefes darlığı gibi bir belirtin varsa ya da kendini hasta hissediyorsan doktora başvur.';

/** Check-in kartının alt satırı. */
export function checkinNote(r: CheckinReading): string {
  if (r.baselineMean === null) {
    const left = checkinBaseline.minValues - r.baselineN;
    return `Kendi geçmişinle kıyas ${left} check-in sonra başlar.`;
  }
  if (r.z === null) return `${checkinWeeks} hafta ort. ${formatDecimal(r.baselineMean)} · toplamın hep aynıydı, kıyas yok`;
  return `${checkinWeeks} hafta ort. ${formatDecimal(r.baselineMean)} · bugün ${formatZ(r.z)}`;
}

/** −1,34 → "−1,3 SD"; 0,5 → "+0,5 SD". */
export function formatZ(z: number): string {
  const v = Math.round(z * 10) / 10;
  if (v === 0) return '0 SD';
  return `${v > 0 ? '+' : '−'}${formatDecimal(Math.abs(v))} SD`;
}

export const checkinLowTitle = 'Alıştığından belirgin düşük';

export function checkinLowBody(r: CheckinReading): string {
  const top = r.drops[0];
  const lead = `Toplamın son ${checkinWeeks} haftadaki olağanının ${lowSd} SD altında.`;
  if (!top) return lead;
  return `${lead} En çok düşen: ${wellnessLabels[top.item].title.toLocaleLowerCase('tr')} (ort. ${formatDecimal(top.mean)}, bugün ${top.today}).`;
}
