// Koçun günlük özet kartının metinleri (karar 0032). Modelin yazdığı metin dışındaki her şey burada sabit:
// bekleme, ret, hata ve sınır mesajları, yönlendirme notları. Yönlendirme notlarının metni modele bırakılmaz;
// Bugün'deki notlarla aynı cümleler kullanılır. Alıntılar dokununca ilgili ölçümün açıklama sayfasına gider.

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import { dailyAttemptLimit, weeklyAttemptLimit, type RoutingNote } from '../../../../supabase/functions/_shared/coach/contract.ts';
import { metricKeys, type MetricKey } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import { explainers, type ExplainerId } from './explainers.ts';
import { illnessSignsFooter, illnessSignsTitle } from './illness-signs.ts';
import { respirationHighFooter, respirationHighTitle } from './personal-baseline.ts';
import { painNoteFooter } from './region-load.ts';

export const coachCardLabel = 'Koçun özeti';
export const coachBadge = 'Yapay zeka';
export const coachFooter = 'Sayılar uygulamanın hesabından, yorumlar kanıt tabanındaki kaynaklardan. Tanı değil.';
export const coachBasisAction = 'Dayanaklar';
export const coachRegenerateAction = 'Yeniden yaz';
/** Özet yazıldıktan sonra maç işareti değiştiyse (karar 0036). */
export const coachMatchDayChanged = 'Bu özet maç işareti değişmeden önce yazıldı. Yeniden yazarsan bugünkü işarete göre olur.';

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

/** Kısmi kabul (karar 0034): kaynak denetiminden geçmeyen cümleler gösterilmez; kullanıcıya söylenir. */
export function coachOmittedNote(count: number): string {
  return `Kaynak denetiminden geçmeyen ${count} cümle gösterilmedi.`;
}

/** Durum yedeği (karar 0056): ilk cümle koçun değil, uygulamanın hesapladığı durum metni. */
export const coachEngineStatusNote = 'İlk cümle uygulamanın kendi durum metni.';

/** Haftalık yorum 7 cümleyi aşınca kırpılan, denetimden geçmiş cümleler (contract.ts WeeklyResponse.trimmed). */
export function weeklyCoachTrimmedNote(count: number): string {
  return `Yorum kısa kalsın diye ${count} cümle daha gösterilmedi.`;
}

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
  if (code === 'classifier_invalid') return 'Soru sınıflandırılamadı. Yeniden dene.';
  return 'Beklenmeyen bir hata oluştu.';
}

export const routingNoteTexts: Record<RoutingNote, { title: string; body: string }> = {
  respiration_high: { title: respirationHighTitle, body: respirationHighFooter },
  illness_signs: { title: illnessSignsTitle, body: illnessSignsFooter },
  pain_high: { title: 'Sabah ağrısı yüksek', body: painNoteFooter },
};

/**
 * Kartta gösterilecek notlar: gece işaretleri notu solunum notunu da kapsar (Bugün'deki kartta da tek kart, karar 0039),
 * ikisi birlikte gelirse yalnız o gösterilir.
 */
export function visibleRoutingNotes(notes: readonly RoutingNote[]): RoutingNote[] {
  return notes.includes('illness_signs') ? notes.filter((n) => n !== 'respiration_high') : [...notes];
}

/** Günün sayıları bloğunun açılacağı yer: açıklama sayfası ya da günün durumunun yöntem ekranı. */
export type BasisTarget = { kind: 'explainer'; id: ExplainerId } | { kind: 'method' } | null;

const metricTargets: Record<MetricKey, BasisTarget> = {
  status: { kind: 'method' },
  hrv: { kind: 'explainer', id: 'hrv' },
  rhr: { kind: 'explainer', id: 'rhr' },
  sleep: { kind: 'explainer', id: 'sleep' },
  respiration: { kind: 'explainer', id: 'respiration' },
  signs: { kind: 'explainer', id: 'illnessSigns' },
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
  if (blockId === 'day') return 'Maç takvimi';
  if (blockId === 'travel') return explainers.travel.title;
  const target = basisTarget(blockId);
  if (!target) return 'Günün sayıları';
  return target.kind === 'method' ? 'Günün durumu' : explainers[target.id].title;
}

// --- Özetin düzeni ---
// Citations yapılandırılmış çıktıyla birlikte kullanılamadığı için (karar 0032) model başlık yazmaz; kart cümleleri
// alıntıladıkları ölçüme göre kendisi gruplar. Düzen modelin keyfine bağlı değildir.

export type SummaryTopic = 'match' | 'recovery' | 'load' | 'nutrition';
export const summaryTopics = ['match', 'recovery', 'load', 'nutrition'] as const satisfies readonly SummaryTopic[];
export const summaryTopicLabels: Record<SummaryTopic, string> = {
  match: 'Maç ve seyahat',
  recovery: 'Toparlanma',
  load: 'Yük ve vücut',
  nutrition: 'Beslenme ve sıvı',
};

const metricTopics: Record<MetricKey | 'day' | 'travel', SummaryTopic> = {
  // Maç günü bloğuna alıntı yapan cümle ve ardındaki kaynaklı cümleler (ısınma, maç sonrası) ayrı konu (karar 0036).
  day: 'match',
  travel: 'match',
  status: 'recovery',
  hrv: 'recovery',
  rhr: 'recovery',
  sleep: 'recovery',
  respiration: 'recovery',
  signs: 'recovery',
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

/**
 * Yalnız maç çevresi ve seyahat kurallarına (rules/mac.json, rules/seyahat.json) bağlı kaynaklar: ısınma, maç öncesi
 * öğün, şekerleme, maç gecesi uykusu, maç sonrası toparlanma, seyahat yorgunluğu, jet lag. Yalnız bunlara alıntı yapan
 * cümle önündeki cümleden bağımsız olarak "Maç ve seyahat" konusuna girer (karar 0036, 0046, 0047; gerçek özette ısınma
 * cümleleri nabız cümlesinin ardından Toparlanma'ya düşmüştü). Liste demo-coach.test.ts'te kanıt tabanıyla denetlenir.
 */
export const matchDayOnlySources: readonly string[] = [
  'fowler-2017',
  'fox-2020',
  'fradkin-2010',
  'gentle-2014',
  'janse-van-rensburg-2020',
  'janse-van-rensburg-2021',
  'juliff-2015',
  'leota-2022',
  'mcgowan-2015',
  'mesas-2023',
  'pernigoni-2024',
  'roach-2019',
  'roberts-2019',
  'williams-2015',
];

function topicOf(s: AuditSentence): SummaryTopic | null {
  const metric = s.numbers[0]?.split('.')[0];
  if (metric === undefined) {
    return s.sources.length > 0 && s.sources.every((id) => matchDayOnlySources.includes(id)) ? 'match' : null;
  }
  return metric in metricTopics ? metricTopics[metric as MetricKey | 'day' | 'travel'] : null;
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

// --- Haftalık yorum (karar 0052) ---

export const weeklyCoachLabel = 'Koçun haftalık yorumu';
export const weeklyCoachChecking = 'Bu haftanın yorumuna bakılıyor…';
export const weeklyCoachWriting = 'Koç haftanın yorumunu yazıyor. Yarım dakika kadar sürebilir.';
export const weeklyCoachIntro = `Koç biten haftanın sayılarını kanıt tabanındaki kaynaklarla yorumlar. Hafta başına en fazla ${weeklyAttemptLimit} kez yazılır.`;
export const weeklyCoachWriteAction = 'Koç yorumu yaz';
export const weeklyCoachCurrent = 'Koç yorumu hafta bitince yazılabilir.';
export const weeklyCoachRejectedTitle = 'Bu haftanın yorumu gösterilmiyor';
export const weeklyCoachRejectedBody = 'Yorum kaynak ve sayı denetiminden geçmedi. Sayıların açıklamaları raporun "i" düğmelerinde.';
export const weeklyCoachFailedTitle = 'Koç bu hafta için yorum yazamadı';
export const weeklyCoachLimitBody = `Bu hafta için ${weeklyAttemptLimit} yazma hakkı doldu.`;
export const weeklyCoachInvalidBody = 'Haftanın değerleri biçim denetiminden geçmedi, koça gönderilmedi.';
export const weeklyCoachDemoNote = 'Demo: önceden yazılmış sentetik yorum; yapay zeka çağrılmadı.';
export const weeklyNumbersLabel = 'Haftanın sayıları';
