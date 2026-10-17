// Demo sporcunun haftalık koç yorumu (karar 0022, 0052): önceden yazılmış, sentetik; API çağrılmaz. Cümleler gerçek
// yanıtla aynı yapıda: haftanın sayıları bloklarına ve kaynaklara alıntı yapar, sayılar anlık değerlerden ve belgedeki
// yazımla. demo-coach-weekly.test.ts her senaryonun yorumunu sunucudaki denetçiden geçirir.

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import type { WeeklySnapshot } from '../../../../supabase/functions/_shared/coach/weekly-snapshot.ts';
import { formatDecimal, levelLabels } from '../copy/recovery.ts';
import { formatChange, formatLoad } from '../copy/training-load.ts';

const sentence = (text: string, numbers: string[], sources: string[] = []): AuditSentence => ({ text, numbers, sources });

const levelOrder = ['ready', 'caution', 'recover', 'insufficient'] as const;

export function demoWeeklyComment(s: WeeklySnapshot): AuditSentence[] {
  const out: AuditSentence[] = [];
  const levels = levelOrder.filter((l) => s.status[l] > 0).map((l) => `${s.status[l]} gün ${levelLabels[l]}`);
  out.push(sentence(`Bu hafta ${levels.join(', ')} geçti.`, ['status']));

  const l = s.load;
  if (l && l.week !== null) {
    const prev = l.previousWeek !== null ? `, önceki hafta ${formatLoad(l.previousWeek)} AU${l.weekChange === null ? '' : ` (${formatChange(l.weekChange)})`}` : '';
    out.push(sentence(`Haftanın yükü ${formatLoad(l.week)} AU${prev}.`, ['load']));
  }

  const hrv = s.hrv?.mean != null && s.hrv.band ? s.hrv : null;
  if (hrv) {
    out.push(
      sentence(
        `HRV haftanın ortalaması ${formatDecimal(hrv.mean!, 0)} ms, kişisel bandın ${formatDecimal(hrv.band!.low, 0)}–${formatDecimal(hrv.band!.high, 0)} ms.`,
        ['hrv'],
      ),
    );
    out.push(
      sentence(
        hrv.position === 'below'
          ? "HRV bandın altındayken yoğunluğu düşük tutmak, HRV'ye göre yönlendirilen antrenman çalışmalarında kullanılan yaklaşım."
          : "Bant içindeki günlerde planlanan yoğunlukta çalışmak, HRV'ye göre yönlendirilen antrenman çalışmalarındaki yaklaşımla örtüşür.",
        [],
        ['vesterinen-2016'],
      ),
    );
  }

  if (s.sleep?.short === true) {
    out.push(
      sentence(
        'Uzman uzlaşısı kısa uykunun sporcularda yaygın olduğunu söylüyor ve uyku ihtiyacının kişiye göre değerlendirilmesini öneriyor.',
        [],
        ['walsh-2021'],
      ),
    );
  }

  const n = s.nutrition;
  if (n && n.mealDays > 0) {
    out.push(sentence(`Öğün kaydı ${n.mealDays} gün ve kayıtlı alım bir tahmin.`, ['nutrition']));
    out.push(sentence('Karbonhidratı günün antrenman yüküne göre ayarlamak sporcu beslenmesi önerileriyle örtüşür.', [], ['kerksick-2018']));
  }
  return out;
}
