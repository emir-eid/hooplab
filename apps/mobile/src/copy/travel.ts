// Seyahat ve jet lag metinleri (karar 0047, research/rules/seyahat.json). Sayılar motor sabitlerinden; uyum günü
// konsensüsün kaba kuralıyla bir tahmin. Kişisel ışık penceresi ve melatonin dozu yok; günün durumu değişmez.

import { arrivalRule, jetLagRule, travelFatigueRule, type Trip, type TravelDirection, type TravelReading } from '@hooplab/engine';

import { formatShortDate } from '../utils/format-date.ts';
import { formatDecimal } from './recovery.ts';

export const directionLabels: Record<TravelDirection, string> = { east: 'doğu', west: 'batı' };

/** "+7 sa (doğu)", "−6 sa (batı)", "Saat farkı yok". */
export function offsetLabel(offsetHours: number): string {
  if (offsetHours === 0) return 'Saat farkı yok';
  const sign = offsetHours > 0 ? '+' : '−';
  return `${sign}${Math.abs(offsetHours)} sa (${directionLabels[offsetHours > 0 ? 'east' : 'west']})`;
}

/** Takvim satırı: "Pzt 10 Kas → Cmt 21 Kas" ya da "Pzt 10 Kas → dönüş belli değil". */
export function tripRowLabel(t: Trip): string {
  return `${formatShortDate(t.departDate)} → ${t.returnDate ? formatShortDate(t.returnDate) : 'dönüş belli değil'}`;
}

export interface TravelNoteLine {
  label: string;
  text: string;
}

export interface TravelNote {
  title: string;
  lines: TravelNoteLine[];
}

const rate = (d: TravelDirection) => jetLagRule.hoursPerDay[d];
/** Saat dilimi başına gün: uyum hızının tersi (doğu 1, batı 0,5). */
const perZone = (d: TravelDirection) => {
  const days = 1 / rate(d);
  return `saat dilimi başına ~${formatDecimal(days, Number.isInteger(days) ? 0 : 1)} gün`;
};

function adaptLine(r: TravelReading, lead: string): TravelNoteLine {
  const d = r.direction!;
  const text =
    r.remainingDays === 0
      ? 'Kaba kurala göre iç saatin buraya uymuş olmalı. Tahmin; kişiden kişiye değişir.'
      : `${lead} ~${r.remainingDays} gün (${directionLabels[d]}da günde ~${rate(d)} saat, ${perZone(d)}). Tahmin; kişiden kişiye değişir.`;
  return { label: 'Uyum', text };
}

const fatigueLines = (): TravelNoteLine[] => [
  { label: 'Yolculuk', text: 'Sıvı ve yemeği önceden planla; düzenli, küçük öğünler. Fırsat oldukça kısa uyu, ama uyku borcunu yolda kapatmaya çalışma.' },
  {
    label: 'Kafein ve alkol',
    text: `Kafeini yatmadan en az ${travelFatigueRule.caffeineBeforeSleepHours} saat önce kes; alkol yok.`,
  },
];

const statusLine: TravelNoteLine = {
  label: 'Günün durumu',
  text: "Bu günlerde HRV ve uyku jet lag'den etkilenebilir; günün durumu yine aynı kurallarla okunur.",
};

/** Bugün'deki seyahat kartı; okuma yoksa null. */
export function travelNote(r: TravelReading | null): TravelNote | null {
  if (!r) return null;
  const offset = offsetLabel(r.trip.offsetHours);
  const lines: TravelNoteLine[] = [];

  switch (r.phase) {
    case 'before': {
      const d = r.direction!;
      const toward = d === 'east' ? 'öne çek' : 'ileri al';
      lines.push({
        label: 'Uyum',
        text: `Varınca iç saatin ~${r.totalDays} günde uyar (${directionLabels[d]}da ${perZone(d)}). Tahmin; kişiden kişiye değişir.`,
      });
      lines.push({
        label: 'İstersen',
        text: `Uçuştan önceki ${arrivalRule.preShiftDays[0]}-${arrivalRule.preShiftDays[1]} günde yatış ve kalkışı günde ${arrivalRule.preShiftMinPerDay[0]}-${arrivalRule.preShiftMinPerDay[1]} dakika ${toward}. Takım programında olmuyorsa gerek yok.`,
      });
      if (r.eastDelayHint) lines.push(eastDelayLine);
      return { title: `Seyahat · ${r.daysUntil} gün sonra · ${offset}`, lines };
    }
    case 'departure':
    case 'return': {
      lines.push(...fatigueLines());
      if (!r.jetLag) {
        lines.push({
          label: 'Saat farkı',
          text: r.zones === 0 ? 'Yok. Bu tür yolculuk performansı belirgin düşürmüyor; uyanıklık, ruh hali ve yorgunluk hissi kötüleşebilir.' : 'Az; jet lag beklenmez.',
        });
      } else {
        lines.push(adaptLine(r, r.phase === 'return' ? 'Eve dönünce uyum:' : 'Uyum:'));
        lines.push({ label: 'Varınca', text: 'Uyku ve yemeği varılan yerin saatine göre ayarla.' });
        if (r.eastDelayHint) lines.push(eastDelayLine);
      }
      return { title: `${r.phase === 'return' ? 'Bugün dönüş' : 'Bugün yolculuk'} · ${offset}`, lines };
    }
    case 'away':
    case 'after': {
      lines.push(adaptLine(r, 'Kalan uyum:'));
      if (r.firstHours) {
        lines.push({
          label: 'Antrenman',
          text:
            r.direction === 'east'
              ? `İlk günlerde düşük-orta yoğunluk. Doğuya uzun yolculuktan sonra sürat ve aralıklı koşu en çok ilk ${arrivalRule.firstHours} saatte düşüyor.`
              : 'İlk günlerde düşük-orta yoğunluk.',
        });
      }
      lines.push({ label: 'Kafein', text: 'Yerel sabahta; öğleden sonra geç ve akşam yok.' });
      lines.push(statusLine);
      const title = r.phase === 'away' ? `Seyahat · ${r.dayAway}. gün · ${offset}` : `Dönüş sonrası · ${offset}`;
      return { title, lines };
    }
  }
}

const eastDelayLine: TravelNoteLine = {
  label: 'Büyük fark',
  text: `Doğuya ${jetLagRule.eastDelayAboveHours} saatten fazla farkta iç saati geri alarak uymak daha kolay olabilir.`,
};

export const tripCalendarFooter = `${jetLagRule.minTimeZones} saat ve üstü farkta Bugün'de jet lag uyum tahmini çıkar; daha az farkta yalnız yolculuk günü notu. Şehir saklanmaz, yalnız saat farkı.`;
