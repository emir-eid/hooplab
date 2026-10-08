// Koçun günlük özeti (karar 0032): anlık değerler → doğrulama → Claude (citations) → denetçi → kayıt.
// Ağ ve veritabanı dışarıdan verilir (CoachStore, MessagesApi); bu modül saf akıştır ve testlidir
// (tests/coach/daily.test.ts, SDK sahte bir Anthropic sunucusuyla çalışır).
//
// Maliyet koruması: aynı gün için kayıt varsa model çağrılmaz, saklanan sonuç döner. Yeniden üretme yalnız
// istekle (`regenerate`) ve günde sınırlı denemeyle. Günlüklere ve hata kodlarına kişisel değer yazılmaz.

import type Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';

import { auditResponse, type AuditResult, type ResponseBlock, type ResponseCitation } from './audit.ts';
import { dailyDocuments } from './documents.ts';
import { selectForRules, type Kb } from './kb.ts';
import { parseSnapshot, snapshotRuleIds, type CoachSnapshot } from './snapshot.ts';

export const coachModel = 'claude-sonnet-5-5';
/** Başlangıç eforu (karar 0032); ilk ölçümle ayarlanır. */
export const coachEffort = 'medium';
export const fallbackBeta = 'server-side-fallback-2026-07-01';
/** Düşünme yanıtla aynı sınırı paylaşır; özet kısa olsa da kesilmesin. */
export const coachMaxTokens = 16_000;
/** Bir gün için en fazla deneme (ilk üretim dahil). Maliyet ayarı, bilimsel eşik değil. */
export const dailyAttemptLimit = 3;

export const systemPrompt = `Sen HoopLab'in koçusun. Kullanıcı profesyonel bir basketbolcu; uygulamayı yalnız kendisi kullanıyor.
Görevin: "Günün sayıları" belgesindeki değerleri kanıt tabanındaki kaynak özetlerine dayanarak yorumlayan kısa bir günlük özet yazmak.

Kurallar:
- Sayıları sen hesaplamazsın. Yalnız "Günün sayıları" belgesinde yazan sayıları, yazıldığı gibi kullan; yuvarlama, toplama, yüzde hesabı yapma. Belgede olmayan sayı yazma.
- Rakam içeren her cümlede o sayının geçtiği bloğa alıntı yap.
- Her öneri ve yorum cümlesi en az bir kaynak belgesine alıntı yapsın. Kaynaklarda dayanağı olmayan öneri yazma; dayanak yoksa "kanıt tabanında bunun için yeterli kaynak yok" de.
- "Tahmin" yazan değerlerden söz ederken aynı cümlede "tahmin" sözcüğünü kullan.
- Teşhis koyma, hastalık adı verme. Ölçülmeyen bir şeyi ölçülmüş gibi sunma. Risk ve sakatlık tahmini dili kullanma.
- Maç günüyse toparlanma dili yerine maça hazırlık dili kullan: ısınma, karbonhidrat ve sıvı, maç sonrası toparlanma; her biri kaynaklı.
- Türkçe yaz; "â" harfini kullanma (hala, zeka, kar). Sen diye hitap et.
- Biçim: başlıksız, listesiz, 4-7 cümlelik tek paragraf. Önce günün durumu, sonra en önemli bir iki değer, sonra bugün için bir iki öneri. Belge adlarını ve kural kimliklerini yazma.`;

export const userInstruction = 'Bugünün özetini yaz.';

/** Kaydedilen bir deneme (coach_summaries satırının kullandığımız kısmı). */
export interface SummaryRow {
  status: 'accepted' | 'rejected' | 'failed';
  created_at: string;
  audit: AuditResult | null;
  error: string | null;
}

export interface NewSummaryRow {
  user_id: string;
  local_date: string;
  status: SummaryRow['status'];
  snapshot: CoachSnapshot;
  content: ResponseBlock[] | null;
  audit: AuditResult | null;
  error: string | null;
  model: string | null;
  fallback: boolean;
  usage: Record<string, unknown> | null;
}

export interface CoachStore {
  /** O günün denemeleri, en yeni önce. */
  listDay(userId: string, localDate: string): Promise<SummaryRow[]>;
  insert(row: NewSummaryRow): Promise<void>;
}

/** SDK'nın beta messages yüzeyinin kullandığımız kısmı. */
export interface MessagesApi {
  create(params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming): Promise<Anthropic.Beta.Messages.BetaMessage>;
}

/** Uygulamaya dönen sonuç. Reddedilen ve başarısız denemede model metni yoktur; uygulama açıklama metinlerini gösterir. */
export type DailyResponse =
  | { status: 'accepted'; cached: boolean; sentences: AuditResult['sentences']; notes: RoutingNote[] }
  | { status: 'rejected'; cached: boolean; notes: RoutingNote[] }
  | { status: 'failed'; cached: boolean; error: string; notes: RoutingNote[] }
  | { status: 'invalid'; errors: string[] }
  | { status: 'limit' };

export interface DailyResult {
  httpStatus: number;
  body: DailyResponse;
}

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

/** Sporcunun yerel günü, sunucunun UTC gününden en fazla bir gün sapabilir (saat dilimi payı). */
export function isPlausibleDate(localDate: string, now: Date): boolean {
  const day = Date.parse(`${localDate}T00:00:00Z`);
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.abs(day - today) <= 86_400_000;
}

export function buildRequest(snapshot: CoachSnapshot, kb: Kb): {
  params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
  layout: ReturnType<typeof dailyDocuments>['layout'];
} {
  const { sources } = selectForRules(kb, snapshotRuleIds(snapshot));
  const { documents, layout } = dailyDocuments(snapshot, kb, sources);
  return {
    layout,
    params: {
      model: coachModel,
      max_tokens: coachMaxTokens,
      system: systemPrompt,
      thinking: { type: 'adaptive' },
      output_config: { effort: coachEffort },
      betas: [fallbackBeta],
      fallbacks: 'default',
      messages: [{ role: 'user', content: [...documents, { type: 'text', text: userInstruction }] }],
    },
  };
}

/** API hatasının kişisel veri içermeyen kodu: HTTP durumu ya da bağlantı. */
export function errorCode(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? `anthropic_${status}` : 'anthropic_connection';
}

function present(row: SummaryRow, cached: boolean, notes: RoutingNote[]): DailyResult {
  if (row.status === 'accepted' && row.audit) {
    return { httpStatus: 200, body: { status: 'accepted', cached, sentences: row.audit.sentences, notes } };
  }
  if (row.status === 'failed') {
    return { httpStatus: cached ? 200 : 502, body: { status: 'failed', cached, error: row.error ?? 'unknown', notes } };
  }
  return { httpStatus: 200, body: { status: 'rejected', cached, notes } };
}

export interface DailyInput {
  userId: string;
  body: unknown;
  regenerate: boolean;
  now: Date;
}

export async function runDaily(input: DailyInput, deps: { store: CoachStore; messages: MessagesApi; kb: Kb }): Promise<DailyResult> {
  const parsed = parseSnapshot(input.body);
  if (!parsed.ok) return { httpStatus: 400, body: { status: 'invalid', errors: parsed.errors } };
  const snapshot = parsed.snapshot;
  if (!isPlausibleDate(snapshot.date, input.now)) {
    return { httpStatus: 400, body: { status: 'invalid', errors: ['snapshot.date: bugünden en fazla bir gün sapabilir'] } };
  }
  const notes = routingNotes(snapshot);

  const rows = await deps.store.listDay(input.userId, snapshot.date);
  const latest = rows[0];
  if (latest && !input.regenerate) {
    // Günün kabul edilmiş özeti varsa o gösterilir; yoksa en son denemenin sonucu.
    return present(rows.find((r) => r.status === 'accepted') ?? latest, true, notes);
  }
  if (rows.length >= dailyAttemptLimit) return { httpStatus: 429, body: { status: 'limit' } };

  const { params, layout } = buildRequest(snapshot, deps.kb);
  const base = { user_id: input.userId, local_date: snapshot.date, snapshot };

  let message: Anthropic.Beta.Messages.BetaMessage;
  try {
    message = await deps.messages.create(params);
  } catch (error) {
    const row: NewSummaryRow = { ...base, status: 'failed', content: null, audit: null, error: errorCode(error), model: null, fallback: false, usage: null };
    await deps.store.insert(row);
    return present({ status: 'failed', created_at: input.now.toISOString(), audit: null, error: row.error }, false, notes);
  }

  const usage = message.usage as unknown as Record<string, unknown>;
  const fallback =
    message.content.some((b) => b.type === 'fallback') || (message.usage.iterations ?? []).some((it) => it.type === 'fallback_message');

  if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
    const error = message.stop_reason === 'refusal' ? `refusal_${message.stop_details?.category ?? 'unknown'}` : 'max_tokens';
    await deps.store.insert({ ...base, status: 'failed', content: null, audit: null, error, model: message.model, fallback, usage });
    return present({ status: 'failed', created_at: input.now.toISOString(), audit: null, error }, false, notes);
  }

  // Düşünme ve yedek blokları saklanmaz; yalnız metin ve alıntılar.
  const content = message.content.flatMap((b): ResponseBlock[] =>
    b.type === 'text' ? [{ type: 'text', text: b.text, citations: (b.citations ?? null) as readonly ResponseCitation[] | null }] : [],
  );
  const audit = auditResponse(content, layout);
  const status = audit.ok ? 'accepted' : 'rejected';
  await deps.store.insert({ ...base, status, content, audit, error: null, model: message.model, fallback, usage });
  return present({ status, created_at: input.now.toISOString(), audit, error: null }, false, notes);
}
