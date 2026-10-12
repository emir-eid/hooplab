// Demo sporcunun soru-cevabı (karar 0022, 0037): örnek sorulara önceden yazılmış, sentetik yanıtlar. API çağrılmaz.
// Yanıtlar gerçek yanıtla aynı yapıda: her cümle kaynaklara alıntı yapar, sayılar kaynak özetinde yazdığı gibidir.
// demo-ask.test.ts her yanıtı sunucudaki denetçiden (audit.ts, soru-cevap kipi) geçirir. Kaynakların söylediği,
// kaynak özetlerindeki kadardır (research/sources).

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import type { StoredAskResponse } from '../../../../supabase/functions/_shared/coach/contract.ts';
import { askSamples } from '../copy/coach-ask.ts';

const sentence = (text: string, sources: string[]): AuditSentence => ({ text, numbers: [], sources });

const answered = (category: 'in_scope' | 'supplement', sentences: AuditSentence[]): StoredAskResponse => ({
  status: 'answered',
  category,
  sentences,
  omitted: 0,
  withNumbers: true,
});

export const demoAnswers: Record<(typeof askSamples)[number], StoredAskResponse> = {
  'Maç günü ne kadar karbonhidrat almalıyım?': answered('in_scope', [
    sentence('Maç gibi yoğun günlerde karbonhidrat ihtiyacı yaklaşık 8-10 g/kg/gün olarak veriliyor.', ['kerksick-2018']),
    sentence('Bu aralık genel sporcu önerilerinden; basketbola özgü bir deneyden gelmiyor.', ['kerksick-2018']),
    sentence('Maç sırasında amaç, terle vücut ağırlığının %2 düzeyini aşan kaybı önlemek.', ['sawka-2007']),
    sentence('Kişisel bir beslenme planı için spor diyetisyenine danışman öneriliyor.', ['thomas-2016']),
  ]),
  'Uykum kısa, ne yapmalıyım?': answered('in_scope', [
    sentence('Elit sporcularda gecede 7 saatten az ve parçalı uyku yaygın bir durum.', ['walsh-2021']),
    sentence('Bir ya da daha fazla uykusuz gece performansı düşürüyor.', ['walsh-2021']),
    sentence('Herkese aynı süre yerine kendi uyku ihtiyacını gözeten kişisel bir yaklaşım öneriliyor.', ['walsh-2021']),
  ]),
  'Kreatin kullanmalı mıyım?': { status: 'no_source', category: 'supplement' },
  'Dizim şişti, ne yapmalıyım?': { status: 'routed', category: 'medical_red_flag' },
};

/** Örnek soruysa önceden yazılmış yanıt; değilse null (demo yapay zeka çağırmaz). */
export function demoAnswer(question: string): StoredAskResponse | null {
  const key = askSamples.find((q) => q.toLocaleLowerCase('tr') === question.trim().toLocaleLowerCase('tr'));
  return key ? demoAnswers[key] : null;
}
