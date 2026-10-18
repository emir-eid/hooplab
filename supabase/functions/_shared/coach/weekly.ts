// Koçun haftalık yorumu (karar 0052): biten pazartesi-pazar haftasının sayıları (uygulamanın haftalık rapor görünümünden)
// → doğrulama → Claude (citations) → günlük özetle aynı denetçi ve kısmi kabul → kayıt (`coach_weekly_summaries`).
// Ağ ve veritabanı dışarıdan verilir; modül saf akıştır ve testlidir (tests/coach/weekly.test.ts).
//
// Maliyet koruması: hafta için kayıt varsa model çağrılmaz; yeniden yazma yalnız istekle ve hafta başına sınırlı.
// Yalnız biten hafta. Kilo ve yakılan enerji gitmez (DATA-INVENTORY); tarih modele gitmez, kayıt anahtarıdır.

import type Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';

import { auditResponse, salvageAudit, salvageOptions, type AuditResult, type SalvageOptions, type ResponseBlock, type ResponseCitation } from './audit.ts';
import { weeklyAttemptLimit, type WeeklyResponse } from './contract.ts';
import { coachEffort, coachMaxTokens, coachModel, errorCode, fallbackBeta, type MessagesApi } from './daily.ts';
import {
  formatChange,
  formatDecimal,
  formatLoad,
  hours,
  levelLabels,
  numbersDocument,
  positionTexts,
  regionLabels,
  ruleNumber,
  sideLabels,
  sourceDocument,
  type CoachDocuments,
  type DocumentEntry,
  type DocumentParam,
  type NumbersBlock,
} from './documents.ts';
import { selectForRules, type Kb } from './kb.ts';
import { rangePositions, type DayLevel } from './snapshot.ts';
import {
  isCompletedWeek,
  parseWeeklySnapshot,
  weeklyMetricKeys,
  weeklyRules,
  type PositionCounts,
  type WeekBand,
  type WeeklyMetricKey,
  type WeeklySnapshot,
} from './weekly-snapshot.ts';

export * from './weekly-snapshot.ts';
export { weeklyAttemptLimit, type WeeklyResponse };

// --- Ölçümler ve kaynaklar ---

export function presentWeeklyMetrics(s: WeeklySnapshot): WeeklyMetricKey[] {
  return weeklyMetricKeys.filter((key) => {
    const value = s[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });
}

/**
 * Dikkat isteyen ölçümler (karar 0035'teki günlük ayarın haftalık karşılığı): durum ve beslenme her zaman; HRV, nabız
 * bandın dışındaysa; uyku kısaysa; gece notu, düşük check-in günü, yük artış notu, ağrı varsa. Olağan ölçümlerin sayıları
 * belgeye girer, yalnız kaynakları gönderilmez.
 */
export function attentionWeeklyMetrics(s: WeeklySnapshot): WeeklyMetricKey[] {
  const outside = (m: WeekBand | undefined) => m !== undefined && m.position !== null && m.position !== 'within';
  const keep: Record<WeeklyMetricKey, boolean> = {
    status: true,
    hrv: outside(s.hrv),
    rhr: outside(s.rhr),
    sleep: s.sleep?.short === true,
    signs: s.signs !== undefined && Object.values(s.signs).some((n) => n > 0),
    checkin: (s.checkin?.lowDays ?? 0) > 0,
    load: s.load?.spike === true,
    pain: (s.pain?.length ?? 0) > 0,
    nutrition: (s.nutrition?.mealDays ?? 0) > 0,
    fluid: false,
  };
  return presentWeeklyMetrics(s).filter((k) => keep[k]);
}

export function weeklyRuleIds(s: WeeklySnapshot, metrics: readonly WeeklyMetricKey[] = attentionWeeklyMetrics(s)): string[] {
  return [...new Set(metrics.flatMap((k) => weeklyRules[k]))];
}

// --- Haftanın sayıları ---

export const weeklyNumbersTitle = 'Haftanın sayıları';
const weeklyNumbersContext =
  "Sporcunun biten haftasının (pazartesi-pazar) değerleri; HoopLab'in hesap motoru hesapladı. Her blok ayrı bir ölçümdür. 'Tahmin' yazan değerler doğrulanmış ölçüm değildir.";

const levelOrder: readonly DayLevel[] = ['ready', 'caution', 'recover', 'insufficient'];

function weekBandText(m: WeekBand, name: string, unit: string, baselineDays: number): string {
  let text = m.mean === null ? `${name}: haftanın ortalaması hesaplanamadı (yeterli gece yok).` : `${name}: haftanın ortalaması ${formatDecimal(m.mean, 0)} ${unit}.`;
  if (m.band === null) text += ' Kişisel bant henüz oluşmadı.';
  else {
    text += ` Haftadan önceki ${baselineDays} günün kişisel bandı ${formatDecimal(m.band.low, 0)}–${formatDecimal(m.band.high, 0)} ${unit}`;
    text += m.position === null ? '.' : `; ortalama bandın ${positionTexts[m.position]}.`;
  }
  return text;
}

function positionsText(c: PositionCounts): string {
  return rangePositions
    .filter((p) => c[p] > 0)
    .map((p) => `${c[p]} gün aralığın ${positionTexts[p]}`)
    .join(', ');
}

export function weeklyBlocks(s: WeeklySnapshot, kb: Kb): NumbersBlock[] {
  const out: NumbersBlock[] = [];
  const add = (metric: WeeklyMetricKey, text: string, estimate = false, id: string = metric) => out.push({ id, metric, text, estimate });
  const baselineDays = ruleNumber(kb, 'toparlanma-bant', 'baseline_days');

  const levels = levelOrder.filter((l) => s.status[l] > 0).map((l) => `${s.status[l]} gün ${levelLabels[l]}`);
  add('status', `Haftanın günlerinin durumu: ${levels.join(', ')}.`);

  if (s.hrv) add('hrv', weekBandText(s.hrv, 'HRV (derin uyku, RMSSD)', 'ms', baselineDays));
  if (s.rhr) add('rhr', weekBandText(s.rhr, 'Uyku nabzı (REM dışı uyku ortalaması)', 'atım/dk', baselineDays));
  if (s.sleep) {
    const min = ruleNumber(kb, 'uyku-kisa', 'min_hours');
    let text = s.sleep.meanHours === null ? 'Uyku: haftanın gece ortalaması hesaplanamadı.' : `Uyku: haftanın gece ortalaması ${hours(s.sleep.meanHours)}, ${s.sleep.nights} gece ölçüldü.`;
    if (s.sleep.short === true) text += ` Ortalama ${formatDecimal(min, 0)} saatin altında: uyku kısa.`;
    else if (s.sleep.short === false) text += ` Ortalama ${formatDecimal(min, 0)} saatin altında değil.`;
    add('sleep', text);
  }
  if (s.signs) {
    const g = s.signs;
    const parts = [
      g.respiration && `${g.respiration} gece solunum`,
      g.rhr && `${g.rhr} gece uyku nabzı`,
      g.spo2 && `${g.spo2} gece SpO2`,
      g.skinTemp && `${g.skinTemp} gece cilt sıcaklığı`,
    ].filter(Boolean);
    add(
      'signs',
      parts.length
        ? `Gece notları (tahmin, tanı değil; değer kişisel olağanından belirgin ayrıldı): ${parts.join(', ')}. Belirti varsa doktora danışılır.`
        : 'Gece notları (tahmin, tanı değil): bu hafta not yok.',
      true,
    );
  }
  if (s.checkin) {
    const c = s.checkin;
    const max = ruleNumber(kb, 'checkin-olcek', 'total_max');
    const days = ruleNumber(kb, 'checkin-kisisel', 'baseline_days');
    let text = c.meanTotal === null ? 'Sabah check-in: bu hafta yok.' : `Sabah check-in: ${c.days} gün, ortalama toplam ${formatDecimal(c.meanTotal)} / ${max}.`;
    if (c.baselineMean !== null) text += ` Haftadan önceki ${days} günün ortalaması ${formatDecimal(c.baselineMean)}.`;
    if (c.lowDays > 0) text += ` ${c.lowDays} gün alıştığından belirgin düşük.`;
    add('checkin', text);
  }
  if (s.load) {
    const l = s.load;
    const avgWeeks = ruleNumber(kb, 'yuk-haftalik', 'average_weeks');
    let text = `Antrenman yükü (seans RPE × dakika): haftanın toplamı ${l.week === null ? 'hesaplanamadı' : `${formatLoad(l.week)} AU`}, ${l.sessions} seans`;
    if (l.games) text += `, ${l.games} maç`;
    if (l.minutesPlayed !== null) text += `, maçlarda ${l.minutesPlayed} dakika oynandı`;
    text += '.';
    if (l.previousWeek !== null) text += ` Önceki hafta ${formatLoad(l.previousWeek)} AU${l.weekChange === null ? '' : ` (${formatChange(l.weekChange)})`}.`;
    if (l.weeklyAverage !== null) text += ` Son ${avgWeeks} haftanın haftalık ortalaması ${formatLoad(l.weeklyAverage)} AU.`;
    if (l.monotony !== null) text += ` Monotonluk ${formatDecimal(l.monotony)}`;
    if (l.strain !== null) text += `${l.monotony !== null ? ',' : ' '} gerilim ${formatLoad(l.strain)} AU`;
    if (l.monotony !== null || l.strain !== null) text += ' (eşiksiz).';
    add('load', text);
    if (l.ratio !== null) {
      let ratio = `Alıştığın seviyeye göre oran, pazar günü (tahmin, yalnız bağlam, sakatlık tahmini değil): ${formatDecimal(l.ratio)}×.`;
      if (l.spike) ratio += ` Oran ${formatDecimal(ruleNumber(kb, 'yuk-artis-notu', 'ratio_min'))} veya üstünde: yük alıştığın seviyenin belirgin üstünde.`;
      add('load', ratio, true, 'load.ratio');
    }
  }
  if (s.pain) {
    const maxNrs = ruleNumber(kb, 'bolge-agri-izleme', 'max_nrs');
    s.pain.forEach((p, i) => {
      const where = p.side === 'center' ? regionLabels[p.region] : `${sideLabels[p.side]} ${regionLabels[p.region].toLocaleLowerCase('tr')}`;
      let text = `Ağrı izleme (tahmin, tanı değil): ${where}, ${p.days} gün ağrı girildi, en yüksek ${p.maxPain}/10`;
      if (p.daysAbove > 0) text += `; ${p.daysAbove} gün ${formatDecimal(maxNrs, 0)}/10'un üstünde`;
      add('pain', `${text}.`, true, `pain.${i}`);
    });
  }
  if (s.nutrition) {
    const n = s.nutrition;
    if (n.mealDays === 0) add('nutrition', 'Beslenme: bu hafta öğün kaydı yok.');
    else {
      let text = `Beslenme (tahmin; kayıt gerçek alımın altında kalabilir): ${n.mealDays} gün öğün kaydı.`;
      const carbs = positionsText(n.carbs);
      const protein = positionsText(n.protein);
      if (carbs) text += ` Karbonhidrat: ${carbs}.`;
      if (protein) text += ` Protein: ${protein}.`;
      if (n.noTarget > 0) text += ` ${n.noTarget} gün sabah kilosu olmadığı için gram hedefi yok.`;
      add('nutrition', text, true);
    }
    if (n.matchDays > 0 || n.sweatTests > 0) {
      add('nutrition', `Hafta içinde ${n.matchDays} maç günü işaretli, ${n.sweatTests} ter testi.`, false, 'nutrition.days');
    }
  }
  if (s.fluid) {
    add('fluid', s.fluid.meanL === null ? 'Sıvı: bu hafta kayıt yok.' : `Sıvı: kayıtlı ${s.fluid.days} günün ortalaması ${formatDecimal(s.fluid.meanL)} L / gün (hedefsiz kayıt).`);
  }
  return out;
}

export function weeklyDocuments(s: WeeklySnapshot, kb: Kb, sources: readonly Kb['sources'][number][]): CoachDocuments {
  const blocks = weeklyBlocks(s, kb);
  const documents: DocumentParam[] = [numbersDocument(blocks, weeklyNumbersTitle, weeklyNumbersContext), ...sources.map(sourceDocument)];
  const layout: DocumentEntry[] = [{ kind: 'numbers', blocks }, ...sources.map((x) => ({ kind: 'source' as const, sourceId: x.id }))];
  return { documents, layout };
}

// --- İstek ---

export const weeklySystemPrompt = `Sen HoopLab'in koçusun. Kullanıcı profesyonel bir basketbolcu; uygulamayı yalnız kendisi kullanıyor.
Görevin: "Haftanın sayıları" belgesindeki biten haftanın değerlerini kanıt tabanındaki kaynak özetlerine dayanarak yorumlayan kısa bir haftalık yorum yazmak. Okuyan sporcunun kendisi ya da onun kondisyoneri, fizyoterapisti veya diyetisyeni olabilir.

Kurallar:
- Sayıları sen hesaplamazsın. Yalnız "Haftanın sayıları" belgesinde yazan sayıları, yazıldığı gibi kullan; yuvarlama, toplama, yüzde hesabı yapma. Belgede olmayan sayı yazma.
- Rakam içeren her cümlede o sayının geçtiği "Haftanın sayıları" bloğuna alıntı yap. Kaynak özetlerindeki sayıları cümleye yazma: bir kaynağın sayısı gerekiyorsa aynı değer haftanın sayıları bloğunda varsa onu alıntıla, yoksa sayısız anlat.
- Her öneri ve yorum cümlesi en az bir kaynak belgesine alıntı yapsın. Kaynaklarda dayanağı olmayan öneri yazma.
- "Tahmin" yazan değerlerden söz ederken aynı cümlede "tahmin" sözcüğünü kullan.
- Teşhis koyma, hastalık adı verme. Risk ve sakatlık tahmini dili kullanma. Gece notlarını yorumlama; varsa yalnız "belirti varsa doktora danış" de.
- Türkçe yaz; "â" harfini kullanma (hala, zeka, kar). Sen diye hitap et.
- Biçim: başlıksız, listesiz düz cümleler; toplam 5-7 cümle, her cümle en fazla 22 kelime ve tek bir fikir.
- İlk cümle haftanın günlerinin durumu. Sonra haftanın en önemli iki üç konusu: yükün önceki haftaya ve alıştığına göre yeri, toparlanma, varsa ağrı ve beslenme. Son cümle gelecek hafta için kaynaklı tek bir öneri olabilir. Olağan değerleri atla.
- Parantez içinde açıklama yazma, kaynak metnini cümlede tekrar etme. Belge adlarını ve kural kimliklerini yazma.`;

export const weeklyUserInstruction = 'Biten haftanın yorumunu yaz.';

/**
 * Kısmi kabul günlükle aynı (durum cümlesi kalmalı, en az 3 cümle) ve yönergedeki 7 cümle sınırı denetçide de:
 * fazlası durum ve son (öneri) cümlesi korunarak kırpılır (2026-10-18; ilk gerçek yorum 10 cümle geldi).
 */
export const weeklySalvageOptions: SalvageOptions = { ...salvageOptions, maxSentences: 7 };

export function buildWeeklyRequest(s: WeeklySnapshot, kb: Kb): { params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming; layout: DocumentEntry[] } {
  const sources = selectForRules(kb, weeklyRuleIds(s)).sources;
  const { documents, layout } = weeklyDocuments(s, kb, sources);
  return {
    layout,
    params: {
      model: coachModel,
      max_tokens: coachMaxTokens,
      system: weeklySystemPrompt,
      thinking: { type: 'adaptive' },
      output_config: { effort: coachEffort },
      betas: [fallbackBeta],
      fallbacks: 'default',
      messages: [{ role: 'user', content: [...documents, { type: 'text', text: weeklyUserInstruction }] }],
    },
  };
}

// --- Akış ---

export interface WeeklyRow {
  status: 'accepted' | 'rejected' | 'failed';
  created_at: string;
  audit: AuditResult | null;
  error: string | null;
}

export interface NewWeeklyRow {
  user_id: string;
  week_start: string;
  status: WeeklyRow['status'];
  snapshot: WeeklySnapshot;
  content: ResponseBlock[] | null;
  audit: AuditResult | null;
  error: string | null;
  model: string | null;
  fallback: boolean;
  usage: Record<string, unknown> | null;
}

export interface WeeklyStore {
  /** Haftanın denemeleri, en yeni önce. */
  listWeek(userId: string, weekStart: string): Promise<WeeklyRow[]>;
  insert(row: NewWeeklyRow): Promise<void>;
}

export interface WeeklyResult {
  httpStatus: number;
  body: WeeklyResponse;
}

function present(row: WeeklyRow, cached: boolean): WeeklyResult {
  if (row.status === 'accepted' && row.audit) {
    const { sentences, shown, trimmed = [] } = row.audit;
    const visible = shown ? shown.flatMap((i) => (sentences[i] ? [sentences[i]] : [])) : sentences;
    const cut = trimmed.length;
    return { httpStatus: 200, body: { status: 'accepted', cached, sentences: visible, omitted: sentences.length - visible.length - cut, trimmed: cut } };
  }
  if (row.status === 'failed') return { httpStatus: cached ? 200 : 502, body: { status: 'failed', cached, error: row.error ?? 'unknown' } };
  return { httpStatus: 200, body: { status: 'rejected', cached } };
}

export interface WeeklyInput {
  userId: string;
  body: unknown;
  regenerate: boolean;
  /** Yalnız bak: hafta için deneme yoksa model çağrılmaz, `none` döner. */
  peek: boolean;
  now: Date;
}

export async function runWeekly(input: WeeklyInput, deps: { store: WeeklyStore; messages: MessagesApi; kb: Kb }): Promise<WeeklyResult> {
  const parsed = parseWeeklySnapshot(input.body);
  if (!parsed.ok) return { httpStatus: 400, body: { status: 'invalid', errors: parsed.errors } };
  const snapshot = parsed.snapshot;
  if (!isCompletedWeek(snapshot.weekStart, input.now)) {
    return { httpStatus: 400, body: { status: 'invalid', errors: ['snapshot.weekStart: hafta henüz bitmedi'] } };
  }

  const rows = await deps.store.listWeek(input.userId, snapshot.weekStart);
  const latest = rows[0];
  if (latest && !input.regenerate) return present(rows.find((r) => r.status === 'accepted') ?? latest, true);
  if (!latest && input.peek) return { httpStatus: 200, body: { status: 'none' } };
  if (input.peek) return present(latest!, true);
  if (rows.length >= weeklyAttemptLimit) return { httpStatus: 429, body: { status: 'limit' } };

  const { params, layout } = buildWeeklyRequest(snapshot, deps.kb);
  const base = { user_id: input.userId, week_start: snapshot.weekStart, snapshot };
  const now = input.now.toISOString();

  let message: Anthropic.Beta.Messages.BetaMessage;
  try {
    message = await deps.messages.create(params);
  } catch (error) {
    const code = errorCode(error);
    await deps.store.insert({ ...base, status: 'failed', content: null, audit: null, error: code, model: null, fallback: false, usage: null });
    return present({ status: 'failed', created_at: now, audit: null, error: code }, false);
  }

  const usage = message.usage as unknown as Record<string, unknown>;
  const fallback =
    message.content.some((b) => b.type === 'fallback') || (message.usage.iterations ?? []).some((it) => it.type === 'fallback_message');

  if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
    const error = message.stop_reason === 'refusal' ? `refusal_${message.stop_details?.category ?? 'unknown'}` : 'max_tokens';
    await deps.store.insert({ ...base, status: 'failed', content: null, audit: null, error, model: message.model, fallback, usage });
    return present({ status: 'failed', created_at: now, audit: null, error }, false);
  }

  const content = message.content.flatMap((b): ResponseBlock[] =>
    b.type === 'text' ? [{ type: 'text', text: b.text, citations: (b.citations ?? null) as readonly ResponseCitation[] | null }] : [],
  );
  const checked = auditResponse(content, layout);
  // Kısmi kabul (karar 0034) ve cümle sınırı (weeklySalvageOptions). Sınırsız seçim de hesaplanır ki yalnız
  // uzunluk yüzünden kırpılan cümleler denetimden düşenlerden ayrı sayılsın.
  const shown = salvageAudit(checked, layout, weeklySalvageOptions);
  const unlimited = salvageAudit(checked, layout, salvageOptions);
  const cut = shown && unlimited ? unlimited.filter((i) => !shown.includes(i)) : [];
  const partial = shown !== null && shown.length < checked.sentences.length;
  const audit: AuditResult = partial ? { ...checked, shown, ...(cut.length ? { trimmed: cut } : {}) } : checked;
  const status = checked.ok || shown ? 'accepted' : 'rejected';
  await deps.store.insert({ ...base, status, content, audit, error: null, model: message.model, fallback, usage });
  return present({ status, created_at: now, audit, error: null }, false);
}
