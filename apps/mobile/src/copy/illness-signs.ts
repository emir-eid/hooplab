// Gece işaretleri notunun metinleri (karar 0039, rules/hastalik-isaretleri.json). Tanı yok, risk dili yok: işaretin
// sayısı, olası nedenler ve IOC uzlaşısının sistemik belirti listesiyle sabit yönlendirme (CLAUDE.md §3).
// Sayılar motor sabitlerinden; kural değişince metin de değişir.

import { nightRhrRule, nightSpo2Rule, skinTempRule, type IllnessSignKey, type IllnessSigns } from '@hooplab/engine';

import { formatDecimal, weeks } from './recovery.ts';

const dec = (n: number) => formatDecimal(n, Number.isInteger(n) ? 0 : 1);
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${formatDecimal(Math.abs(n), 1)}`;
const join = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ve ${xs.at(-1)}`);

export const illnessSignsTitle = 'Son gecelerde alıştığından farklı';

/** Kartta, her işaret için tek satır (eskiden yeniye geceler). */
export function illnessSignLine(key: IllnessSignKey, signs: IllnessSigns): string {
  if (key === 'rhr') {
    const s = signs.rhr;
    const values = join(s.nights.map((n) => String(Math.round(n.value))));
    const usual = s.baselineMedian === null ? '–' : dec(s.baselineMedian);
    return `Dinlenik nabız son ${s.nights.length} gece ${values} atım/dk; önceki ${weeks(nightRhrRule.baselineDays)} haftanın medyanı ${usual}. İkisi de ${dec(nightRhrRule.aboveBaselineMedian)} atım/dk veya daha fazla yüksek.`;
  }
  if (key === 'spo2') {
    const s = signs.spo2;
    const values = join(s.nights.map((n) => `%${formatDecimal(n.value, 1)}`));
    const why: string[] = [];
    if (s.reasons.includes('below_floor')) why.push(`%${formatDecimal(nightSpo2Rule.belowPct, 1)}'in altında`);
    if (s.reasons.includes('below_baseline') && s.baselineMedian !== null) {
      why.push(`kendi medyanının (%${formatDecimal(s.baselineMedian, 1)}) ${dec(nightSpo2Rule.belowBaselineMedian)} puan veya daha fazla altında`);
    }
    return `Gece SpO2 ortalaması son ${nightSpo2Rule.nightsWindow} gecede ${values}; en az ${nightSpo2Rule.nightsRequired} gecede ${why.join(' ya da ')}.`;
  }
  const s = signs.skinTemp;
  const values = join(s.nights.map((n) => `${signed(n.deviation)}\u00a0°C`));
  return `Cilt sıcaklığı son ${s.nights.length} gece tabanına göre ${values}; ikisi de ${formatDecimal(skinTempRule.aboveBaseline, 1)}\u00a0°C veya daha fazla yüksek.`;
}

export const illnessSignsCauses =
  'Hastalık başlangıcında da, ağır yük, geç maç, stres, alkol, seyahat, sıcak oda, yükseklik veya aşıdan sonra da görülebilir. SpO2 ve cilt sıcaklığı bilekliğin ölçümü: tıbbi oksimetre ya da ateş ölçümü değil.';

/** Yönlendirme (hastalik-isareti-yonlendirme; IOC uzlaşısının sistemik belirtileri, schwellnus-2022a). */
export const illnessSignsFooter =
  'Tanı değil. Ateş ya da ateşli hissetme, titreme, olağandışı halsizlik, yaygın kas ağrısı, nefes darlığı, göğüs ağrısı, istirahatte çarpıntı ya da baş dönmesi varsa, ya da antrenman yapacak kadar iyi hissetmiyorsan antrenmana çıkmadan doktora başvur. Belirtin yoksa sonraki gecelere de bak.';
