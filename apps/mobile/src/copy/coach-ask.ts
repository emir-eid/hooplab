// Koçta soru-cevap ekranının metinleri (karar 0032, 0037). Modelin yazdığı metin dışındaki her şey burada sabit:
// yönlendirme (tıbbi, kapsam dışı), "kaynak yok", ret, sınır ve doping uyarısı. Güvenlik metinleri modele
// bırakılmaz (0032 "kodla yönlendirme"); hangisinin gösterileceğine sunucudaki sınıflandırma karar verir.

import { askDailyLimit, questionLength, type QuestionCategory } from '../../../../supabase/functions/_shared/coach/contract.ts';

export { askDailyLimit, questionLength };

export const askTitle = 'Koç';
export const askIntro =
  'Sorunu kanıt tabanındaki kaynak özetlerine dayanarak yanıtlar; bugünkü değerlerin de soruyla gider. Dayanağı yoksa yanıt uydurmaz.';
export const askPlaceholder = 'Örneğin: Maç günü ne kadar karbonhidrat almalıyım?';
export const askFieldLabel = 'Koça sorun';
export const askAction = 'Sor';
export const askSamplesLabel = 'Örnek sorular';
export const askHistoryLabel = 'Önceki sorular';
export const askThinking = 'Koç kaynaklara bakıyor. Yarım dakika kadar sürebilir.';
export const askLoadingHistory = 'Önceki sorular yükleniyor…';
export const askBasisAction = 'Dayanaklar';
export const askFooter = 'Yanıt kanıt tabanındaki kaynak özetlerinden. Tanı değil.';
export const askGeneralNote = 'Bugünkü değerlerin henüz yüklenmemişti; yanıt genel.';
export const askDemoNote = 'Demo: önceden yazılmış sentetik yanıt; yapay zeka çağrılmadı.';
export const askDemoOnlySamples = 'Demoda yapay zeka çağrılmaz; örnek sorulardan birini seç.';

/** Kalan soru hakkı (sunucu da sayar; bu yalnız bilgi). */
export function askRemaining(used: number): string {
  const left = Math.max(askDailyLimit - used, 0);
  return left === 0 ? `Bugünkü ${askDailyLimit} soru hakkın doldu.` : `Bugün ${left} soru hakkın kaldı.`;
}

export const askLimitBody = `Bugün için ${askDailyLimit} soru hakkın doldu; yarın yeniden sorabilirsin.`;
export const askTooShort = `Soru en az ${questionLength.min} karakter olmalı.`;
export const askTooLong = `Soru en fazla ${questionLength.max} karakter olabilir.`;
export const askInvalidBody = 'Soru biçim denetiminden geçmedi, koça gönderilmedi.';

export const askNoSource = {
  title: 'Kanıt tabanında kaynak yok',
  body: 'Bu soruyu yanıtlayacak bir kaynak kanıt tabanında yok. Koç dayanaksız yanıt vermez.',
};
export const askRejected = {
  title: 'Yanıt gösterilmiyor',
  body: 'Koçun yazdığı metin kaynak denetiminden geçmedi: bir sayı ya da yorum dayanaksız kaldı. Soruyu başka sözcüklerle yeniden sorabilirsin.',
};
export const askFailedTitle = 'Koç yanıt veremedi';

/** Sınıflandırmanın yönlendirdiği sorular (model çağrılmaz). */
export const askRouted: Record<Extract<QuestionCategory, 'medical_red_flag' | 'out_of_scope'>, { title: string; body: string }> = {
  medical_red_flag: {
    title: 'Bu bir sağlık sorusu',
    body: 'Belirti, ağrı, ilaç ya da teşhis sorularını koç yanıtlamaz; doktora ya da takımının sağlık ekibine danış. Göğüs ağrısı, bayılma, nefes darlığı ya da çarpıntı varsa beklemeden acil yardım al.',
  },
  out_of_scope: {
    title: 'Koçun konusu dışında',
    body: 'Koç antrenman yükü, toparlanma, uyku, beslenme, sıvı, kas ve tendon yükü ve maç hazırlığı sorularını yanıtlar.',
  },
};

/**
 * Takviye sorusunda yanıtın altına her zaman eklenir (CLAUDE.md §3); modelin hatırlamasına bırakılmaz. Kural
 * `takviye-doping-riski`, kaynak IOC uzlaşı bildirgesi (karar 0038); coach-ask.test.ts bağı denetler.
 */
export const dopingWarning = {
  title: 'Takviyede doping riski',
  body: 'Takviyeler etiketinde yazmayan, WADA yasaklılar listesindeki maddeleri içerebilir; bilmeden alınsa da doping ihlali sayılır. Bağımsız kuruluşça test edilmiş (batch-tested) ürün riski azaltır ama sıfırlamaz. Başlamadan önce takımının doktoruna ya da diyetisyenine danış.',
  rule: 'takviye-doping-riski',
  sources: ['maughan-2018'],
} as const;

/**
 * Ekranda dokununca alana yazılan örnek sorular. Demo bunları önceden yazılmış yanıtlarla gösterir (demo-ask.ts);
 * gerçek hesapta koça gider. Kaynaklı yanıtlar, takviye (yanıt + doping uyarısı) ve tıbbi yönlendirme örneği.
 */
export const askSamples = [
  'Maç günü ne kadar karbonhidrat almalıyım?',
  'Uykum kısa, ne yapmalıyım?',
  'Kreatin kullanmalı mıyım?',
  'Dizim şişti, ne yapmalıyım?',
] as const;

const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** Sorunun zamanı: bugünse saat ("14:05"), değilse gün ve ay ("11 Eki"). Cihazın yerel saatine göre. */
export function askWhen(createdAt: string, localDate: string, today: string): string {
  const d = new Date(createdAt);
  if (localDate === today) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const [, m, day] = localDate.split('-').map(Number);
  return `${day} ${months[(m ?? 1) - 1]}`;
}
