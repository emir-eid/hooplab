// coach-daily ile uygulama arasındaki sözleşme (karar 0032). Bu dosya hiçbir şey içe aktarmaz (yalnız tip):
// uygulama onu Metro'yla doğrudan paketler, Edge Function da aynı dosyayı kullanır. Böylece yanıt biçimi,
// yönlendirme notları ve deneme sınırı iki tarafta ayrı ayrı yazılmaz.

import type { AuditSentence } from './audit.ts';
import type { CoachSnapshot } from './snapshot.ts';

/** Bir gün için en fazla deneme (ilk üretim dahil). Maliyet ayarı, bilimsel eşik değil. */
export const dailyAttemptLimit = 3;

/**
 * Kodla yönlendirme (karar 0032): motorun tanı koymayan notları varsa uygulama kendi sabit yönlendirme
 * metnini gösterir. Metin modele bırakılmaz; burada yalnız hangi notun gösterileceği belirlenir.
 */
export type RoutingNote = 'respiration_high' | 'illness_signs' | 'pain_high';

export function routingNotes(snapshot: CoachSnapshot): RoutingNote[] {
  const notes: RoutingNote[] = [];
  if (snapshot.respiration?.nightHigh === true) notes.push('respiration_high');
  // Gece nabzı, SpO2, cilt sıcaklığı (karar 0039): tek not, uygulama hangi işaretin çıktığını kendi kartında yazar.
  if (snapshot.signs && Object.values(snapshot.signs).some((v) => v === true)) notes.push('illness_signs');
  if (snapshot.pain?.some((p) => p.reasons.includes('high'))) notes.push('pain_high');
  return notes;
}

/**
 * Uygulamaya dönen sonuç. Reddedilen ve başarısız denemede model metni yoktur; uygulama açıklama metinlerini
 * gösterir. `none`: yalnız bakma isteğinde (`?peek=1`) o gün için hiç deneme yok; model çağrılmadı.
 * Başarısız denemenin `error` kodu kişisel veri içermez: `anthropic_<HTTP durumu>`, `anthropic_connection`,
 * `refusal_<kategori>`, `max_tokens`.
 */
export type DailyResponse =
  | {
      status: 'accepted';
      cached: boolean;
      sentences: AuditSentence[];
      /** Denetimden geçmediği için gösterilmeyen cümle sayısı (kısmi kabul, karar 0034); tam kabulde 0. */
      omitted: number;
      /** Özet yazılırken maç işaretli miydi (karar 0036); uygulama bugünkü işaretten farklıysa yeniden yazmayı önerir. */
      matchDay: boolean;
      notes: RoutingNote[];
    }
  | { status: 'rejected'; cached: boolean; notes: RoutingNote[] }
  | { status: 'failed'; cached: boolean; error: string; notes: RoutingNote[] }
  | { status: 'none'; notes: RoutingNote[] }
  | { status: 'invalid'; errors: string[] }
  | { status: 'limit' };

// --- Soru-cevap (karar 0037) ---

/** Günde en fazla soru (kullanıcı kararı, 2026-10-12). Maliyet ayarı, bilimsel eşik değil. */
export const askDailyLimit = 10;

/** Soru metninin uzunluğu (karakter, kırpılmış). */
export const questionLength = { min: 3, max: 500 } as const;

/**
 * Sorunun sınıfı (karar 0032 "soru sınıflandırma"; Haiku yapılandırılmış çıktıyla verir).
 *   in_scope: kanıt tabanının konusu (yük, toparlanma, uyku, beslenme, sıvı, kas / tendon, ısınma, maç hazırlığı).
 *   supplement: takviye; yanıtın sonuna uygulama sabit doping uyarısını ekler.
 *   medical_red_flag: belirti, ilaç, teşhis; koç yanıt üretmez, uygulama sabit metinle doktora yönlendirir.
 *   out_of_scope: başka konu; sabit metin.
 */
export const questionCategories = ['in_scope', 'supplement', 'medical_red_flag', 'out_of_scope'] as const;
export type QuestionCategory = (typeof questionCategories)[number];
export type AnsweredCategory = Extract<QuestionCategory, 'in_scope' | 'supplement'>;
export type RoutedCategory = Extract<QuestionCategory, 'medical_red_flag' | 'out_of_scope'>;

/** coach-ask istek gövdesi. `snapshot` günlük özetle aynı anlık değerler; yoksa yanıt kişisel değildir. */
export interface AskRequest {
  date: string;
  question: string;
  snapshot: CoachSnapshot | null;
}

/**
 * coach-ask yanıtı; aynı nesne `coach_messages.answer`'da saklanır, uygulama geçmişi oradan okur.
 * `answered`: yalnız denetimden geçen cümleler (kısmi kabul); en az biri kaynağa alıntılı.
 * `no_source`: yanıt hiçbir kaynağa alıntı yapmadı; uygulama "kanıt tabanında kaynak yok" der.
 * `rejected`: kaynaklı cümlelerin hepsi denetimden düştü. `routed`: model çağrılmadı, sabit metin.
 */
export type AskResponse =
  | {
      status: 'answered';
      category: AnsweredCategory;
      sentences: AuditSentence[];
      omitted: number;
      /** Soruyla bugünün sayıları gitti mi. */
      withNumbers: boolean;
    }
  | { status: 'no_source'; category: AnsweredCategory }
  | { status: 'rejected'; category: AnsweredCategory }
  | { status: 'routed'; category: RoutedCategory }
  | { status: 'failed'; category: QuestionCategory | null; error: string }
  | { status: 'invalid'; errors: string[] }
  | { status: 'limit' };

/** Saklanan (geçmişte gösterilen) yanıt türleri. */
export type StoredAskResponse = Exclude<AskResponse, { status: 'invalid' } | { status: 'limit' }>;

// --- Haftalık yorum (karar 0052) ---

/** Bir hafta için en fazla deneme (ilk yazım dahil). Maliyet ayarı, bilimsel eşik değil. */
export const weeklyAttemptLimit = 2;

/**
 * coach-weekly yanıtı. Yalnız biten hafta; `none`: yalnız bakma isteğinde hafta için hiç deneme yok, model çağrılmadı.
 * Reddedilen ve başarısız denemede model metni yoktur.
 */
export type WeeklyResponse =
  | {
      status: 'accepted';
      cached: boolean;
      sentences: AuditSentence[];
      /** Denetimden geçmeyen (ya da alıntısız kopya) cümle sayısı. */
      omitted: number;
      /** Denetimden geçtiği halde 7 cümle sınırı yüzünden gösterilmeyen cümle sayısı. */
      trimmed: number;
    }
  | { status: 'rejected'; cached: boolean }
  | { status: 'failed'; cached: boolean; error: string }
  | { status: 'none' }
  | { status: 'invalid'; errors: string[] }
  | { status: 'limit' };
