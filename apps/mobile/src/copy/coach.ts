// Koçun günlük özet kartının metinleri (karar 0032). Modelin yazdığı metin dışındaki her şey burada sabit:
// bekleme, ret, hata ve sınır mesajları, yönlendirme notları. Yönlendirme notlarının metni modele bırakılmaz;
// Bugün'deki notlarla aynı cümleler kullanılır. Alıntılar dokununca ilgili ölçümün açıklama sayfasına gider.

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import { dailyAttemptLimit, type RoutingNote } from '../../../../supabase/functions/_shared/coach/contract.ts';
import { metricKeys, type MetricKey } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import { explainers, type ExplainerId } from './explainers.ts';
import { respirationHighFooter, respirationHighTitle } from './personal-baseline.ts';
import { painNoteFooter } from './region-load.ts';

export const coachCardLabel = 'Koçun özeti';
export const coachBadge = 'Yapay zeka';
export const coachFooter = 'Sayılar uygulamanın hesabından, yorumlar kanıt tabanındaki kaynaklardan. Tanı değil.';
export const coachBasisAction = 'Dayanaklar';
export const coachRegenerateAction = 'Yeniden yaz';

export const coachChecking = 'Bugünün özetine bakılıyor…';
export const coachWriting = 'Koç bugünün özetini yazıyor. Yarım dakika kadar sürebilir.';

export const coachWaitTitle = "Özet sabah check-in'inden sonra yazılır";
export const coachWaitBody = 'Böylece hissin ve ağrı haritan da özete girer. Beklemek istemezsen şimdi de yazdırabilirsin.';
export const coachWriteNowAction = "Check-in'siz yaz";

export const coachRejectedTitle = 'Bugünkü özet gösterilmiyor';
export const coachRejectedBody =
  'Koçun yazdığı metin kaynak denetiminden geçmedi: bir sayı ya da yorum dayanaksız kaldı. Değerlerin açıklamaları kartlardaki "i" düğmelerinde.';
export const coachFailedTitle = 'Koç bugün özet yazamadı';
export const coachLimitBody = `Bugün için ${dailyAttemptLimit} yazma hakkı doldu; yarın yeniden yazılır.`;
export const coachInvalidBody = 'Bugünün değerleri biçim denetiminden geçmedi, koça gönderilmedi.';
export const coachOffline = 'Koça ulaşılamadı. İnternetini kontrol edip yeniden dene.';
export const coachNotConfigured = 'Koç kurulmamış: sunucuda Anthropic API anahtarı yok (npm run setup:check).';
export const coachDemoNote = 'Demo: önceden yazılmış sentetik özet; yapay zeka çağrılmadı.';

/**
 * Başarısız denemenin kodu (contract.ts DailyResponse) → kullanıcıya söylenen neden. Kod kişisel veri içermez.
 * Anthropic'in hata türleri: platform.claude.com/docs/en/api/errors (400 kredi bitince de döner).
 */
export function coachFailureReason(code: string): string {
  if (code === 'anthropic_401' || code === 'anthropic_403') return "Anthropic API anahtarı geçersiz ya da süresi dolmuş.";
  if (code === 'anthropic_400') return 'Anthropic isteği kabul etmedi; kredi bitmiş olabilir.';
  if (code === 'anthropic_429' || code === 'anthropic_529' || /^anthropic_5\d\d$/.test(code)) return 'Anthropic şu an yoğun. Biraz sonra yeniden dene.';
  if (code === 'anthropic_connection') return "Anthropic'e bağlanılamadı. Biraz sonra yeniden dene.";
  if (code.startsWith('refusal_')) return 'Model bu isteği yanıtlamadı.';
  if (code === 'max_tokens') return 'Yanıt yarıda kesildi.';
  return 'Beklenmeyen bir hata oluştu.';
}

export const routingNoteTexts: Record<RoutingNote, { title: string; body: string }> = {
  respiration_high: { title: respirationHighTitle, body: respirationHighFooter },
  pain_high: { title: 'Sabah ağrısı yüksek', body: painNoteFooter },
};

/** Günün sayıları bloğunun açılacağı yer: açıklama sayfası ya da günün durumunun yöntem ekranı. */
export type BasisTarget = { kind: 'explainer'; id: ExplainerId } | { kind: 'method' } | null;

const metricTargets: Record<MetricKey, BasisTarget> = {
  status: { kind: 'method' },
  hrv: { kind: 'explainer', id: 'hrv' },
  rhr: { kind: 'explainer', id: 'rhr' },
  sleep: { kind: 'explainer', id: 'sleep' },
  respiration: { kind: 'explainer', id: 'respiration' },
  checkin: { kind: 'explainer', id: 'checkin' },
  load: { kind: 'explainer', id: 'loadChart' },
  regions: { kind: 'explainer', id: 'regionLoad' },
  pain: { kind: 'explainer', id: 'painMonitoring' },
  nutrition: { kind: 'explainer', id: 'nutrition' },
  fluid: { kind: 'explainer', id: 'nutrition' },
  sweatTest: { kind: 'explainer', id: 'sweatTest' },
};

/** Blok kimliği (documents.ts: "hrv", "load.ratio", "regions.0") → açılacak yer. */
export function basisTarget(blockId: string): BasisTarget {
  if (blockId === 'load.ratio') return { kind: 'explainer', id: 'ratio' };
  const metric = blockId.split('.')[0] as MetricKey;
  return (metricKeys as readonly string[]).includes(metric) ? metricTargets[metric] : null;
}

/** Blok kimliğinin dayanaklar listesindeki adı. */
export function basisLabel(blockId: string): string {
  if (blockId === 'day') return 'Maç günü işareti';
  const target = basisTarget(blockId);
  if (!target) return 'Günün sayıları';
  return target.kind === 'method' ? 'Günün durumu' : explainers[target.id].title;
}

// --- Özetin düzeni ---
// Citations yapılandırılmış çıktıyla birlikte kullanılamadığı için (karar 0032) model başlık yazmaz; kart cümleleri
// alıntıladıkları ölçüme göre kendisi gruplar. Düzen modelin keyfine bağlı değildir.

export type SummaryTopic = 'recovery' | 'load' | 'nutrition';
export const summaryTopics = ['recovery', 'load', 'nutrition'] as const satisfies readonly SummaryTopic[];
export const summaryTopicLabels: Record<SummaryTopic, string> = {
  recovery: 'Toparlanma',
  load: 'Yük ve vücut',
  nutrition: 'Beslenme ve sıvı',
};

const metricTopics: Record<MetricKey | 'day', SummaryTopic> = {
  day: 'recovery',
  status: 'recovery',
  hrv: 'recovery',
  rhr: 'recovery',
  sleep: 'recovery',
  respiration: 'recovery',
  checkin: 'recovery',
  load: 'load',
  regions: 'load',
  pain: 'load',
  nutrition: 'nutrition',
  fluid: 'nutrition',
  sweatTest: 'nutrition',
};

export interface SummaryLine {
  sentence: AuditSentence;
  /** Özetteki sırası (dayanaklar sayfası bununla açılır). */
  index: number;
  /** Dayanak rozetinin numarası; alıntısız cümlede null. */
  mark: number | null;
}

export interface SummaryLayout {
  /** Günün durumunu söyleyen ilk cümle; öne çıkarılır. */
  lead: SummaryLine | null;
  sections: { topic: SummaryTopic; lines: SummaryLine[] }[];
}

function topicOf(s: AuditSentence): SummaryTopic | null {
  const metric = s.numbers[0]?.split('.')[0];
  return metric !== undefined && metric in metricTopics ? metricTopics[metric as MetricKey | 'day'] : null;
}

/**
 * Cümle, alıntıladığı ilk ölçümün konusuna girer; yalnız kaynağa alıntı yapan cümle (yorum, öneri) önündeki
 * cümlenin konusunda kalır. İlk cümle günün durumuna dayanıyorsa öne çıkar. Konu sırası sabit, konu içi sıra modelin.
 */
export function summaryLayout(sentences: readonly AuditSentence[]): SummaryLayout {
  let mark = 0;
  let topic: SummaryTopic = 'recovery';
  const lines = sentences.map((sentence, index) => {
    topic = topicOf(sentence) ?? topic;
    const cited = sentence.numbers.length + sentence.sources.length > 0;
    return { line: { sentence, index, mark: cited ? ++mark : null }, topic };
  });
  const first = lines[0];
  const lead = first && (first.line.sentence.numbers.includes('status') || first.line.sentence.numbers.includes('day')) ? first.line : null;
  const rest = lead ? lines.slice(1) : lines;
  return {
    lead,
    sections: summaryTopics
      .map((t) => ({ topic: t, lines: rest.filter((l) => l.topic === t).map((l) => l.line) }))
      .filter((s) => s.lines.length > 0),
  };
}
