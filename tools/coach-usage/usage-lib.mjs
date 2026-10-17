// Koçun aylık token kullanımı raporunun saf mantığı (testli: usage-lib.test.mjs). Veritabanı okuması report.mjs'te.
//
// Karar 0032: "Her çağrının token kullanımı (`usage`) saklanır. Aylık toplam bir betikle raporlanır ve COSTS'taki
// tahminle karşılaştırılır." Kaynak tablolar `coach_summaries` (günlük özet) ve `coach_messages` (soru-cevap; yanıt
// `usage`, sınıflandırma `classifier_usage`). Rapor yalnız sayıları, durumları ve denetim sorun kodlarını okur; özet
// metni, soru, anlık değerler okunmaz.
//
// Maliyet kayıttaki `usage`'tan resmi fiyatlarla hesaplanır; Console'daki fatura esastır (yuvarlama, vergi, tablo dışı
// çağrılar). Fiyatı bilinmeyen bir model (ör. sunucu taraflı yedek) tahmin edilmez: tokenları sayılır, maliyeti boş
// kalır ve rapor uyarır.

/** Kaynak: resmi fiyat sayfası. Değişince tarih de güncellenir (LESSONS: skill tablosu sapabiliyor). */
export const PRICES_SOURCE = 'platform.claude.com/docs/en/about-claude/pricing (2026-10-13)';

/**
 * $ / milyon token. Önbellek okuma Sonnet 5.5'te taban girdinin 0,05 katı, Haiku 5.5'te 0,1 katı. Haiku 5.5'te istem
 * (girdi + önbellek yazma + önbellek okuma) 100 bin token'ı aşarsa isteğin bütün tokenları üst fiyattan.
 */
export const PRICES = {
  'claude-sonnet-5-5': { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.1, output: 10 },
  'claude-haiku-5-5': {
    input: 0.1,
    cacheWrite5m: 0.125,
    cacheWrite1h: 0.2,
    cacheRead: 0.01,
    output: 0.5,
    longContext: { above: 100_000, input: 0.5, cacheWrite5m: 0.625, cacheWrite1h: 1, cacheRead: 0.05, output: 2.5 },
  },
};

/** `inference_geo: "us"` bütün token türlerinde 1,1 kat (aynı sayfa). Koç küresel çalışır; kayıtta görünürse uygulanır. */
export const US_GEO_MULTIPLIER = 1.1;

/** İstekte istenen modeller (`_shared/coach/daily.ts` coachModel, `ask.ts` classifierModel; test eşitliği denetler). */
export const REQUESTED_MODELS = { coach: 'claude-sonnet-5-5', classifier: 'claude-haiku-5-5' };

/**
 * Kıyas noktaları. Aylık tahmin karar 0032'den ve COSTS'tan (2026-10-08; 30 günlük özet + 10 oturumda 30 soru).
 * Çağrı başı değerler ölçümden: günlük özet 0035 ölçümü (Batch fiyatı normal fiyata çevrilerek), soru-cevap
 * 2026-10-12/13 iPhone ölçümü (COSTS).
 */
export const ESTIMATE = {
  monthlyUsd: 3.5,
  source: 'karar 0032 / COSTS (2026-10-08)',
  summaryPerCallUsd: 0.113,
  questionFirstUsd: 0.19,
  questionCachedUsd: 0.009,
};

/**
 * Karar 0032'nin yeniden tartışma tetikleri: aylık harcama 10 $'a yaklaşırsa ya da iki ay üst üste tahminin iki katını
 * geçerse. "Yaklaşma" payı (%80) bilimsel eşik değil, rapor ayarı.
 */
export const TRIGGERS = { monthlyCapUsd: 10, approachShare: 0.8, overEstimateFactor: 2 };

/** Ölçülen çağrı başı değerlerle 0032 senaryosu: 30 günlük özet + 10 oturumda 30 soru (ilk soru yazar, 20'si okur). */
export function measuredScenarioUsd() {
  return 30 * ESTIMATE.summaryPerCallUsd + 10 * ESTIMATE.questionFirstUsd + 20 * ESTIMATE.questionCachedUsd;
}

/** Bundan kısa dönemde 30 günlük karşılık oynaktır; rapor bunu söyler. Bilimsel eşik değil, rapor ayarı. */
export const SHORT_PERIOD_DAYS = 14;

// Tek komut (CLI çoklu komut kabul etmiyor, LESSONS "Supabase"). Metin sütunları (özet, soru, yanıt, anlık değerler)
// seçilmez; denetimden yalnız cümle sayıları ve sorun kodları gelir.
const AUDIT_COLUMNS = `
  coalesce(jsonb_array_length(audit->'sentences'), 0) as sentences,
  case
    when audit is null then 0
    when audit->'shown' is not null then jsonb_array_length(audit->'shown')
    when (audit->>'ok')::boolean then coalesce(jsonb_array_length(audit->'sentences'), 0)
    else 0
  end as shown,
  coalesce((select jsonb_agg(p->>'code') from jsonb_array_elements(audit->'problems') p), '[]'::jsonb) as problems`;

export const USAGE_SQL = `
select 'summary' as kind, local_date::text as local_date, status, null::text as category, model, fallback, usage,
  null::jsonb as classifier_usage, error, ${AUDIT_COLUMNS}
from public.coach_summaries
union all
select 'question', local_date::text, status, category, model, fallback, usage, classifier_usage, error, ${AUDIT_COLUMNS}
from public.coach_messages
union all
select 'weekly', created_at::date::text, status, null, model, fallback, usage, null, error, ${AUDIT_COLUMNS}
from public.coach_weekly_summaries`;

/** Console'daki ön ödemeli kredi (COSTS). Yükleme yapılınca güncellenir ya da `--kredi` ile verilir. */
export const CREDIT_USD = 10;

/** Aynı krediden harcanan, tablolara girmeyen çağrılar (COSTS). */
export const OFF_TABLE_SPEND = [{ date: '2026-10-10', usd: 1.42, what: 'tools/coach-eval maliyet ölçümü (Batch API, 24 istek)' }];

const MTOK = 1_000_000;

function num(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Bir `usage` nesnesinin token dökümü ve maliyeti. `usage.iterations` varsa her tur kendi modeliyle fiyatlanır
 * (yedek modelin turu `fallback_message`, modeli kayıtlı); tur modeli boşsa istekte istenen model. Yoksa üst düzey
 * alanlar istenen modelle fiyatlanır.
 */
export function costOfUsage(usage, requestedModel) {
  const out = { usd: 0, unknownModels: [], input: 0, cacheWrite: 0, cacheRead: 0, output: 0, thinking: 0 };
  if (!usage || typeof usage !== 'object') return { ...out, usd: 0 };
  const iterations = Array.isArray(usage.iterations) && usage.iterations.length > 0 ? usage.iterations : [usage];
  const geo = usage.inference_geo === 'us' ? US_GEO_MULTIPLIER : 1;
  let priced = true;
  for (const it of iterations) {
    const model = typeof it.model === 'string' && it.model ? it.model : requestedModel;
    const input = num(it.input_tokens);
    const write = num(it.cache_creation_input_tokens);
    const write1h = Math.min(write, num(it.cache_creation?.ephemeral_1h_input_tokens));
    const write5m = write - write1h;
    const read = num(it.cache_read_input_tokens);
    const output = num(it.output_tokens);
    out.input += input;
    out.cacheWrite += write;
    out.cacheRead += read;
    out.output += output;
    const base = PRICES[model];
    if (!base) {
      priced = false;
      if (!out.unknownModels.includes(model)) out.unknownModels.push(model);
      continue;
    }
    const p = base.longContext && input + write + read > base.longContext.above ? base.longContext : base;
    out.usd += (geo * (input * p.input + write5m * p.cacheWrite5m + write1h * p.cacheWrite1h + read * p.cacheRead + output * p.output)) / MTOK;
  }
  out.thinking = num(usage.output_tokens_details?.thinking_tokens);
  if (!priced) out.usd = null;
  return out;
}

function addTokens(into, part) {
  for (const k of ['input', 'cacheWrite', 'cacheRead', 'output', 'thinking']) into[k] += part[k];
  if (part.usd === null) into.unpriced += 1;
  else into.usd += part.usd;
  for (const m of part.unknownModels) if (!into.unknownModels.includes(m)) into.unknownModels.push(m);
}

function emptyTotals() {
  return { calls: 0, usd: 0, unpriced: 0, unknownModels: [], input: 0, cacheWrite: 0, cacheRead: 0, output: 0, thinking: 0 };
}

function countBy(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** YYYY-MM-DD → gün sayısı (UTC gece yarısı; yalnız tarih farkı için). */
function dayNumber(date) {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function monthBounds(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(`Ay YYYY-AA biçiminde olmalı: ${month}`);
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(days).padStart(2, '0')}`, days };
}

/** Denetim özeti: gösterilen ve atılan cümle sayısı (kısmi kabul, karar 0034). */
function sentenceStats(rows) {
  let sentences = 0;
  let shown = 0;
  for (const r of rows) {
    sentences += num(r.sentences);
    shown += num(r.shown);
  }
  return { sentences, shown, dropped: sentences - shown };
}

/**
 * Bir ayın raporu. `today` yerel tarih (YYYY-MM-DD); `firstDate` koçun ilk kaydı (izlemenin başladığı gün).
 * 30 günlük karşılık = ayın kapsanan günlerindeki maliyet / kapsanan gün × 30; tahminle bununla kıyaslanır.
 */
export function monthReport(rows, month, { today, firstDate }) {
  const bounds = monthBounds(month);
  const inMonth = rows.filter((r) => typeof r.local_date === 'string' && r.local_date.startsWith(`${month}-`));
  const coverStart = firstDate && firstDate > bounds.start ? firstDate : bounds.start;
  const coverEnd = today < bounds.end ? today : bounds.end;
  const coveredDays = coverEnd >= coverStart ? dayNumber(coverEnd) - dayNumber(coverStart) + 1 : 0;

  const summaries = inMonth.filter((r) => r.kind === 'summary');
  const questions = inMonth.filter((r) => r.kind === 'question');
  // Haftalık yorum (karar 0052): yazıldığı (UTC) güne sayılır.
  const weeklies = inMonth.filter((r) => r.kind === 'weekly');
  const weeklyTotals = emptyTotals();
  for (const r of weeklies) {
    if (!r.usage) continue;
    weeklyTotals.calls += 1;
    addTokens(weeklyTotals, costOfUsage(r.usage, REQUESTED_MODELS.coach));
  }

  const summaryTotals = emptyTotals();
  for (const r of summaries) {
    if (!r.usage) continue;
    summaryTotals.calls += 1;
    addTokens(summaryTotals, costOfUsage(r.usage, REQUESTED_MODELS.coach));
  }
  const answerTotals = emptyTotals();
  const classifierTotals = emptyTotals();
  let cacheWrites = 0;
  let cacheHits = 0;
  for (const r of questions) {
    if (r.usage) {
      answerTotals.calls += 1;
      const c = costOfUsage(r.usage, REQUESTED_MODELS.coach);
      addTokens(answerTotals, c);
      if (c.cacheWrite > 0) cacheWrites += 1;
      if (c.cacheRead > 0) cacheHits += 1;
    }
    if (r.classifier_usage) {
      classifierTotals.calls += 1;
      addTokens(classifierTotals, costOfUsage(r.classifier_usage, REQUESTED_MODELS.classifier));
    }
  }

  const total = summaryTotals.usd + answerTotals.usd + classifierTotals.usd + weeklyTotals.usd;
  const per30 = coveredDays > 0 ? (total / coveredDays) * 30 : null;
  const unknownModels = [...new Set([...summaryTotals.unknownModels, ...answerTotals.unknownModels, ...classifierTotals.unknownModels, ...weeklyTotals.unknownModels])];

  return {
    month,
    coverStart,
    coverEnd,
    coveredDays,
    usd: total,
    per30,
    unpriced: summaryTotals.unpriced + answerTotals.unpriced + classifierTotals.unpriced + weeklyTotals.unpriced,
    unknownModels,
    summaries: {
      rows: summaries.length,
      days: new Set(summaries.map((r) => r.local_date)).size,
      status: countBy(summaries.map((r) => r.status)),
      fallback: summaries.filter((r) => r.fallback).length,
      errors: countBy(summaries.filter((r) => r.error).map((r) => r.error)),
      totals: summaryTotals,
      perCall: summaryTotals.calls > 0 ? summaryTotals.usd / summaryTotals.calls : null,
      // Kısmi kabul yalnız kabul edilen özette anlamlı: reddedilen özet hiç gösterilmez.
      acceptedSentences: sentenceStats(summaries.filter((r) => r.status === 'accepted')),
      problems: countBy(summaries.flatMap((r) => (Array.isArray(r.problems) ? r.problems : []))),
    },
    weekly: {
      rows: weeklies.length,
      status: countBy(weeklies.map((r) => r.status)),
      errors: countBy(weeklies.filter((r) => r.error).map((r) => r.error)),
      totals: weeklyTotals,
      problems: countBy(weeklies.flatMap((r) => (Array.isArray(r.problems) ? r.problems : []))),
    },
    questions: {
      rows: questions.length,
      status: countBy(questions.map((r) => r.status)),
      category: countBy(questions.map((r) => r.category ?? 'sınıfsız')),
      fallback: questions.filter((r) => r.fallback).length,
      errors: countBy(questions.filter((r) => r.error).map((r) => r.error)),
      answer: answerTotals,
      classifier: classifierTotals,
      cacheWrites,
      cacheHits,
      perQuestion: questions.length > 0 ? (answerTotals.usd + classifierTotals.usd) / questions.length : null,
      answeredSentences: sentenceStats(questions.filter((r) => r.status === 'answered')),
      problems: countBy(questions.flatMap((r) => (Array.isArray(r.problems) ? r.problems : []))),
    },
  };
}

/** Kayıtlardaki aylar (eskiden yeniye). */
export function monthsOf(rows) {
  return [...new Set(rows.map((r) => r.local_date?.slice(0, 7)).filter((m) => typeof m === 'string' && /^\d{4}-\d{2}$/.test(m)))].sort();
}

/**
 * Karar 0032 tetikleri. Bir ay tamamlanmamışsa 30 günlük karşılık kullanılır (erken uyarı); "iki ay üst üste" yalnız
 * ardışık takvim aylarına bakar.
 */
export function triggerFlags(reports) {
  const flags = [];
  const approach = TRIGGERS.monthlyCapUsd * TRIGGERS.approachShare;
  const over = ESTIMATE.monthlyUsd * TRIGGERS.overEstimateFactor;
  for (const r of reports) {
    const v = Math.max(r.usd, r.per30 ?? 0);
    if (v >= approach) flags.push(`${r.month}: aylık harcama ${usd(v, 2)} (30 günlük karşılık dahil) ${usd(TRIGGERS.monthlyCapUsd, 0)} sınırına yaklaşıyor (karar 0032)`);
  }
  for (let i = 1; i < reports.length; i++) {
    const a = reports[i - 1];
    const b = reports[i];
    const consecutive = dayNumber(monthBounds(b.month).start) - dayNumber(monthBounds(a.month).end) === 1;
    if (consecutive && Math.max(a.usd, a.per30 ?? 0) > over && Math.max(b.usd, b.per30 ?? 0) > over) {
      flags.push(`${a.month} ve ${b.month}: iki ay üst üste tahminin iki katının (${usd(over, 2)}) üstünde (karar 0032)`);
    }
  }
  return flags;
}

/** Bütün kayıtların harcaması + tablo dışı harcama → krediden kalan (tahmin; Console bakiyesi esastır). */
export function creditStatus(rows, { credit = CREDIT_USD, offTable = OFF_TABLE_SPEND } = {}) {
  let tables = 0;
  let unpriced = 0;
  for (const r of rows) {
    for (const [u, model] of [
      [r.usage, REQUESTED_MODELS.coach],
      [r.classifier_usage, REQUESTED_MODELS.classifier],
    ]) {
      if (!u) continue;
      const c = costOfUsage(u, model);
      if (c.usd === null) unpriced += 1;
      else tables += c.usd;
    }
  }
  const off = offTable.reduce((s, x) => s + x.usd, 0);
  return { credit, tables, offTable: off, remaining: credit - tables - off, unpriced };
}

// --- Biçim ---

/** Sınıflandırma gibi çok küçük tutarlar sıfır görünmesin diye 0,01 $'ın altında dört basamak. */
export function usd(value, digits = 3) {
  if (value === null || value === undefined) return '—';
  const d = value > 0 && value < 0.01 ? Math.max(digits, 4) : digits;
  return `${value.toFixed(d).replace('.', ',')} $`;
}

function tok(value) {
  return Math.round(value).toLocaleString('tr-TR');
}

function pct(part, whole) {
  return whole > 0 ? `%${Math.round((part / whole) * 100)}` : '—';
}

function list(counts) {
  const entries = Object.entries(counts);
  return entries.length > 0 ? entries.map(([k, v]) => `${k} ${v}`).join(', ') : '—';
}

function ratio(actual, reference) {
  if (actual === null || !reference) return '';
  return ` (kıyas ${usd(reference)}; ${(actual / reference).toFixed(2).replace('.', ',')}×)`;
}

/** Markdown rapor. Kişisel veri yok: yalnız tarih aralığı, sayılar, durumlar, sorun kodları. */
export function formatReport(report, { allMonths = [], credit, flags = [] } = {}) {
  const s = report.summaries;
  const q = report.questions;
  const lines = [];
  lines.push(`# Koç token kullanımı — ${report.month}`, '');
  lines.push(`Kapsanan günler: ${report.coverStart} → ${report.coverEnd} (${report.coveredDays} gün). Fiyatlar: ${PRICES_SOURCE}.`, '');
  lines.push('## Maliyet', '');
  lines.push('| | Çağrı | Girdi | Önbellek yazma | Önbellek okuma | Çıktı (düşünme) | Maliyet |', '|---|---|---|---|---|---|---|');
  const row = (name, t) => `| ${name} | ${t.calls} | ${tok(t.input)} | ${tok(t.cacheWrite)} | ${tok(t.cacheRead)} | ${tok(t.output)} (${tok(t.thinking)}) | ${usd(t.usd)} |`;
  lines.push(row('Günlük özet (Sonnet)', s.totals));
  lines.push(row('Haftalık yorum (Sonnet)', report.weekly.totals));
  lines.push(row('Soru yanıtı (Sonnet)', q.answer));
  lines.push(row('Soru sınıflandırma (Haiku)', q.classifier));
  lines.push(`| **Toplam** | | | | | | **${usd(report.usd)}** |`, '');
  lines.push(
    `- 30 günlük karşılık: **${usd(report.per30, 2)}**; tahmin ${usd(ESTIMATE.monthlyUsd, 2)} (${ESTIMATE.source})${report.per30 === null ? '' : `, ${(report.per30 / ESTIMATE.monthlyUsd).toFixed(2).replace('.', ',')}×`}; ölçülen çağrı başı değerlerle aynı senaryo ${usd(measuredScenarioUsd(), 2)}.`,
  );
  if (report.coveredDays > 0 && report.coveredDays < SHORT_PERIOD_DAYS) {
    lines.push(`- Dönem kısa (${report.coveredDays} gün): 30 günlük karşılık oynaktır; deneme amaçlı çağrılar da dahildir.`);
  }
  lines.push(`- Günlük özet, çağrı başına: ${usd(s.perCall)}${ratio(s.perCall, ESTIMATE.summaryPerCallUsd)}; ${s.days} günde özet var (${report.coveredDays} günün ${pct(s.days, report.coveredDays)}'i).`);
  lines.push(
    `- Soru başına (yanıt + sınıflandırma): ${usd(q.perQuestion)}; önbelleğe yazan ${q.cacheWrites}, önbellekten okuyan ${q.cacheHits} yanıt (ölçüm: ilk soru ${usd(ESTIMATE.questionFirstUsd)}, önbellekten ${usd(ESTIMATE.questionCachedUsd)}).`,
  );
  if (report.unpriced > 0) lines.push(`- **Fiyatı bilinmeyen ${report.unpriced} çağrı** (${report.unknownModels.join(', ')}): maliyete katılmadı; PRICES tablosuna resmi fiyatla eklenmeli.`);
  lines.push('');
  lines.push('## Kalite (maliyetle birlikte okunur)', '');
  lines.push(`- Günlük özet: ${s.rows} deneme (${list(s.status)}); yedek model ${s.fallback}; hata: ${list(s.errors)}.`);
  lines.push(
    `- Kabul edilen özetlerde atılan cümle (kısmi kabul, 0034): ${s.acceptedSentences.dropped} / ${s.acceptedSentences.sentences} (${pct(s.acceptedSentences.dropped, s.acceptedSentences.sentences)}). Sorun kodları (bütün denemeler): ${list(s.problems)}.`,
  );
  lines.push(`- Haftalık yorum: ${report.weekly.rows} deneme (${list(report.weekly.status)}); hata: ${list(report.weekly.errors)}; sorun kodları: ${list(report.weekly.problems)}.`);
  lines.push(`- Soru-cevap: ${q.rows} soru (${list(q.status)}); sınıf: ${list(q.category)}; yedek model ${q.fallback}; hata: ${list(q.errors)}.`);
  lines.push(
    `- Yanıtlanan sorularda atılan cümle: ${q.answeredSentences.dropped} / ${q.answeredSentences.sentences} (${pct(q.answeredSentences.dropped, q.answeredSentences.sentences)}). Sorun kodları (bütün sorular): ${list(q.problems)}.`,
  );
  lines.push('');
  if (allMonths.length > 1) {
    lines.push('## Aylar', '', '| Ay | Gün | Maliyet | 30 günlük karşılık |', '|---|---|---|---|');
    for (const m of allMonths) lines.push(`| ${m.month} | ${m.coveredDays} | ${usd(m.usd)} | ${usd(m.per30, 2)} |`);
    lines.push('');
  }
  lines.push('## Tetikler ve kredi', '');
  lines.push(flags.length > 0 ? flags.map((f) => `- **${f}**`).join('\n') : `- Karar 0032 tetiklerinden hiçbiri yok (aylık ${usd(TRIGGERS.monthlyCapUsd, 0)} sınırına yaklaşma, iki ay üst üste tahminin ${TRIGGERS.overEstimateFactor} katı).`);
  if (credit) {
    lines.push(
      `- Kredi (tahmin): ${usd(credit.credit, 2)} − tablolardaki çağrılar ${usd(credit.tables, 2)} − tablo dışı ${usd(credit.offTable, 2)} = **${usd(credit.remaining, 2)}** kaldı. Console bakiyesi esastır.`,
    );
  }
  return `${lines.join('\n')}\n`;
}
