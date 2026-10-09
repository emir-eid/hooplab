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
export type RoutingNote = 'respiration_high' | 'pain_high';

export function routingNotes(snapshot: CoachSnapshot): RoutingNote[] {
  const notes: RoutingNote[] = [];
  if (snapshot.respiration?.nightHigh === true) notes.push('respiration_high');
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
  | { status: 'accepted'; cached: boolean; sentences: AuditSentence[]; notes: RoutingNote[] }
  | { status: 'rejected'; cached: boolean; notes: RoutingNote[] }
  | { status: 'failed'; cached: boolean; error: string; notes: RoutingNote[] }
  | { status: 'none'; notes: RoutingNote[] }
  | { status: 'invalid'; errors: string[] }
  | { status: 'limit' };
