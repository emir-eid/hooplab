// Maç takvimi ve maç çevresi metinleri (karar 0046, research/rules/mac.json). Sayılar motor sabitlerinden; kişisel doz
// yok, gram ve mililitre kaynaktaki g/kg ve mL/kg aralığı × sabah kilosu. Günün durumu değişmez, notlar bağlamdır.

import {
  carbTargets,
  expectedSleepLossMin,
  isNightMatch,
  matchNapRule,
  postMatchCarbs,
  postMatchRule,
  preMatchMealRule,
  preMatchPlan,
  type Match,
  type MatchesAround,
  type Venue,
} from '@hooplab/engine';

import { formatShortDate } from '../utils/format-date.ts';

export const venueLabels: Record<Venue, string> = { home: 'İç saha', away: 'Deplasman' };

const range = (r: readonly [number, number], unit = '') => `${r[0]}–${r[1]}${unit}`;
const matchCarbs = range(carbTargets.match, ' g/kg');

/** "19:00 · Deplasman"; ikisi de yoksa boş. */
export function matchMeta(m: Match): string {
  return [m.startTime, m.venue ? venueLabels[m.venue] : null].filter(Boolean).join(' · ');
}

/** Takvim satırı: "Cmt 18 Ekim" ve sağda "19:00 · Deplasman". */
export function matchRowLabel(m: Match, today: string, tomorrow: string): string {
  if (m.date === today) return `Bugün · ${formatShortDate(m.date)}`;
  if (m.date === tomorrow) return `Yarın · ${formatShortDate(m.date)}`;
  return formatShortDate(m.date);
}

export interface MatchNoteLine {
  label: string;
  text: string;
}

export interface MatchNote {
  /** Kartın başlığı: "Bugün maç · 19:00 · Deplasman". */
  title: string;
  lines: MatchNoteLine[];
  /** Maç saati girilmemişse saati girmeye çağıran satır. */
  askTime: boolean;
}

/** Bugün'deki maç çevresi kartı: bugün maç (MD), yarın maç (MD-1), dün maç (MD+1); hiçbiri yoksa null. */
export function matchNote(around: MatchesAround, weightKg: number | null): MatchNote | null {
  const { today, tomorrow, yesterday } = around;
  if (!today && !tomorrow && !yesterday) return null;
  const lines: MatchNoteLine[] = [];
  let title: string;
  let askTime = false;

  if (today) {
    title = withMeta('Bugün maç', today);
    const plan = preMatchPlan(today, weightKg);
    if (plan) {
      const carbs = plan.mealCarbsG ? `${range(plan.mealCarbsG)} g karbonhidrat` : `${range(preMatchMealRule.mealCarbsPerKg, ' g/kg')} karbonhidrat`;
      lines.push({ label: `Öğün ${plan.meal.from}–${plan.meal.to}`, text: `Karbonhidratlı, kolay sindirilen ana öğün: ${carbs}. Maçtan ${range(preMatchMealRule.mealHoursBefore)} saat önce.` });
      const ml = plan.fluidMl ? `${range(plan.fluidMl)} mL` : `${range(preMatchMealRule.fluidMlPerKg, ' mL/kg')}`;
      lines.push({ label: `Sıvı ${plan.fluid.from}–${plan.fluid.to}`, text: `Maça susuz başlamamak için ${ml} sıvı.` });
      if (plan.nap) {
        lines.push({
          label: `Şekerleme ${plan.nap.from}–${plan.nap.to}`,
          text: `İstersen ${range(matchNapRule.minutes)} dakika; uyanış maçtan en az ${matchNapRule.wakeBeforeHours} saat önce olsun.`,
        });
      }
    } else {
      askTime = today.startTime === null;
    }
    const post = postMatchCarbs(weightKg);
    const perHour = post.gramsPerHour ? `saatte ~${post.gramsPerHour} g` : `saatte ~${postMatchRule.postCarbsPerKgPerHour} g/kg`;
    lines.push({ label: 'Maçtan sonra', text: `${post.hours} saat boyunca ${perHour} karbonhidrat. ${sleepAfter(today)}` });
  } else if (tomorrow) {
    title = withMeta('Yarın maç', tomorrow);
    lines.push({ label: 'Karbonhidrat', text: `Bugün maç çevresi günü: ${matchCarbs}. Amaç maça dolu depoyla başlamak.` });
    lines.push({ label: 'Uyku', text: 'Maçtan önceki gece uykuya dalmak zorlaşabilir; sporcularda sık görülür ve maça özgüdür. Uykuya zaman ayır.' });
  } else {
    title = withMeta('Dün maç', yesterday!);
  }

  if (yesterday) {
    const loss = expectedSleepLossMin(yesterday);
    const sleep =
      loss === null
        ? 'Maç gecesi uyku sık kısalır.'
        : isNightMatch(yesterday)
          ? `Akşam maçından sonraki gece uyku ortalama ~${loss} dakika kısalır.`
          : `Gündüz maçından sonraki gece uyku ortalama ~${loss} dakika kısalır.`;
    lines.push({
      label: 'Dünkü maç',
      text: `${sleep} Bugünkü HRV ve uykun bundan etkilenmiş olabilir; günün durumu yine aynı kurallarla okunur.`,
    });
    lines.push({
      label: 'Toparlanma',
      text: `Sıçrama ve sürat ${range(postMatchRule.performanceHours)} saat düşük kalabilir; kas ağrısı en çok bu sürede.${today ? '' : ` Karbonhidrat bugün de ${matchCarbs}.`}`,
    });
  }
  return { title, lines, askTime };
}

function withMeta(head: string, m: Match): string {
  const meta = matchMeta(m);
  return meta ? `${head} · ${meta}` : head;
}

function sleepAfter(m: Match): string {
  const loss = expectedSleepLossMin(m);
  if (loss === null) return 'Maç gecesi uyku sık kısalır.';
  return isNightMatch(m) ? `Akşam maçı gecesi uyku ortalama ~${loss} dakika kısalır.` : `Maç gecesi uyku ortalama ~${loss} dakika kısalır.`;
}

export const matchAskTime = 'Maç saatini girersen öğün, sıvı ve şekerleme saatleri burada yazar.';
export const matchCalendarFooter = `Maç günü ile bir gün öncesi ve sonrası beslenmede maç çevresi sayılır (${matchCarbs} karbonhidrat). Günün durumu değişmez.`;
