// Demo sporcunun koç özeti (karar 0022, 0032): önceden yazılmış, sentetik. API çağrılmaz; portfolyo gösterimi
// ücretsiz ve çevrimdışı kalır. Cümleler gerçek yanıtla aynı yapıda: her cümle günün sayıları bloklarına ve
// kaynaklara alıntı yapar. Sayılar anlık değerlerden, gösterimdeki gibi yazılır; demo-coach.test.ts her
// senaryonun özetini sunucudaki denetçiden (audit.ts) geçirir. Kaynakların söylediği, kaynak özetlerindeki
// kadardır (research/sources).

import { loadWeek, recoveryBand, shortSleep } from '@hooplab/engine';

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import type { CoachSnapshot } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import { dayTypeLabels } from '../copy/nutrition.ts';
import { formatDecimal, levelLabels } from '../copy/recovery.ts';
import { formatChange, formatLoad } from '../copy/training-load.ts';
import type { DemoScenario } from './demo-data.ts';

const dec = (n: number) => formatDecimal(n, Number.isInteger(n) ? 0 : 1);

function sentence(text: string, numbers: string[], sources: string[] = []): AuditSentence {
  return { text, numbers, sources };
}

export function demoCoachSummary(scenario: DemoScenario, s: CoachSnapshot): AuditSentence[] {
  const out: AuditSentence[] = [];
  const level = s.status ? levelLabels[s.status.level] : null;
  const hrv = s.hrv?.rolling != null && s.hrv.band ? s.hrv : null;
  const rhr = s.rhr?.rolling != null && s.rhr.band ? s.rhr : null;

  const hrvSentence = () => {
    if (!hrv) return;
    out.push(
      sentence(
        `Son ${recoveryBand.rollingDays} günün HRV ortalaması ${formatDecimal(hrv.rolling!, 0)} ms, kişisel bandın ${formatDecimal(hrv.band!.low, 0)}–${formatDecimal(hrv.band!.high, 0)} ms.`,
        ['hrv'],
      ),
    );
  };

  if (scenario === 'green') {
    if (level) out.push(sentence(`Günün durumu ${level}: ortalamaların kişisel bandının dışına çıkmadı.`, ['status']));
    hrvSentence();
    if (hrv) {
      out.push(
        sentence(
          "Bant içindeki günlerde planlanan yoğunlukta çalışmak, HRV'ye göre yönlendirilen antrenman çalışmalarındaki yaklaşımla örtüşür.",
          ['hrv'],
          ['vesterinen-2016'],
        ),
      );
    }
  } else if (scenario === 'yellow') {
    if (level) out.push(sentence(`Günün durumu ${level}: HRV ortalaman bandın altında ve uyku kısa.`, ['status']));
    if (s.sleep?.rollingHours != null && s.sleep.short) {
      out.push(
        sentence(
          `Son ${shortSleep.rollingNights} gecenin uyku ortalaması ${formatDecimal(s.sleep.rollingHours)} saat, ${dec(shortSleep.minHours)} saatin altında.`,
          ['sleep'],
        ),
      );
      out.push(
        sentence(
          'Uzman uzlaşısı kısa uykunun sporcularda yaygın olduğunu söylüyor ve uyku ihtiyacının kişiye göre değerlendirilmesini öneriyor.',
          [],
          ['walsh-2021'],
        ),
      );
    }
    hrvSentence();
    if (hrv) {
      out.push(
        sentence(
          "HRV bandın dışındayken yoğunluğu düşük tutmak, HRV'ye göre yönlendirilen antrenman çalışmalarında kullanılan yaklaşım.",
          [],
          ['vesterinen-2016'],
        ),
      );
    }
  } else {
    if (level) out.push(sentence(`Günün durumu ${level}: HRV ortalaman bandın altında, dinlenik nabzın bandın üstünde.`, ['status']));
    if (rhr) {
      out.push(
        sentence(
          `Dinlenik nabız ortalaman ${formatDecimal(rhr.rolling!, 0)} atım/dk, kişisel bandın ${formatDecimal(rhr.band!.low, 0)}–${formatDecimal(rhr.band!.high, 0)} atım/dk.`,
          ['rhr'],
        ),
      );
    }
    out.push(sentence('HRV düşüşü dinlenik nabız artışıyla birlikte geldiğinde tek ölçümden daha anlamlı okunur.', ['status'], ['plews-2013']));
    if (s.load?.ratio != null && s.load.spike) {
      out.push(sentence(`Bu hafta yükün alıştığın seviyenin belirgin üstünde; oran ${formatDecimal(s.load.ratio)}× ve bu bir tahmin.`, ['load.ratio']));
      out.push(
        sentence('Ani yük artışını izlemek önerilse de oranın yöntemi tartışmalı; burada yalnız bağlam olarak okunur.', [], ['gabbett-2016', 'impellizzeri-2020']),
      );
    }
    if (s.sweatTest?.lossNote) {
      const pct = s.sweatTest.changePercent;
      out.push(
        sentence(`Bugünkü ter testinde seans boyunca kilo değişimin ${pct < 0 ? '−' : ''}%${formatDecimal(Math.abs(pct))}.`, ['sweatTest']),
      );
      out.push(sentence('Seans sonrasında kaybı yerine koymak hidrasyon önerilerinin parçası.', [], ['mcdermott-2017']));
    }
  }

  // Yük cümlesi yalnız Hazır günde: öbür günlerde özet yönergedeki 4-7 cümleyi aşmasın (daily.ts systemPrompt).
  if (scenario === 'green' && s.load?.week != null) {
    const change = s.load.weekChange !== null ? `, önceki ${loadWeek.days} güne göre ${formatChange(s.load.weekChange)}` : '';
    out.push(sentence(`Son ${loadWeek.days} günün yükü ${formatLoad(s.load.week)} AU${change}.`, ['load']));
  }

  const n = s.nutrition;
  if (n) {
    out.push(
      sentence(
        `Gün tipi ${dayTypeLabels[n.dayType].toLocaleLowerCase('tr')}: karbonhidrat hedefin ${dec(n.carbsPerKg[0])}–${dec(n.carbsPerKg[1])} g/kg, protein ${formatDecimal(n.proteinPerKg[0])}–${formatDecimal(n.proteinPerKg[1])} g/kg.`,
        ['nutrition'],
      ),
    );
    out.push(sentence('Karbonhidratı günün antrenman yüküne göre ayarlamak sporcu beslenmesi önerileriyle örtüşür.', [], ['kerksick-2018']));
  }
  return out;
}
