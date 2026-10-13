import { test } from 'node:test';
import assert from 'node:assert/strict';

import { classifierModel } from '../../supabase/functions/_shared/coach/ask.ts';
import { coachModel } from '../../supabase/functions/_shared/coach/daily.ts';
import {
  costOfUsage,
  creditStatus,
  ESTIMATE,
  formatReport,
  measuredScenarioUsd,
  monthBounds,
  monthReport,
  monthsOf,
  PRICES,
  REQUESTED_MODELS,
  triggerFlags,
  usd,
  USAGE_SQL,
} from './usage-lib.mjs';

// Sentetik kayıtlar; gerçek kullanım değildir.
const M = 1_000_000;
const sonnet = REQUESTED_MODELS.coach;
const haiku = REQUESTED_MODELS.classifier;

function close(actual, expected, msg) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg ?? ''} beklenen ${expected}, gelen ${actual}`);
}

test('istenen modeller koçun koduyla aynı ve fiyat tablosunda', () => {
  assert.equal(REQUESTED_MODELS.coach, coachModel);
  assert.equal(REQUESTED_MODELS.classifier, classifierModel);
  assert.ok(PRICES[coachModel]);
  assert.ok(PRICES[classifierModel]);
});

test('Sonnet 5.5: girdi, çıktı, önbellek yazma (5 dk / 1 sa) ve okuma ayrı fiyatlanır', () => {
  close(costOfUsage({ input_tokens: M, output_tokens: M }, sonnet).usd, 12);
  close(costOfUsage({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: M }, sonnet).usd, 0.1);
  // Döküm yoksa önbellek yazma 5 dakikalık sayılır.
  close(costOfUsage({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: M }, sonnet).usd, 2.5);
  const split = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 2 * M, cache_creation: { ephemeral_5m_input_tokens: M, ephemeral_1h_input_tokens: M } };
  close(costOfUsage(split, sonnet).usd, 2.5 + 4);
});

test('gerçek kayıt biçimi: iterations tek tur, model boş → istenen model', () => {
  const usage = {
    input_tokens: 1000,
    cache_creation_input_tokens: 60000,
    cache_read_input_tokens: 0,
    output_tokens: 800,
    output_tokens_details: { thinking_tokens: 500 },
    inference_geo: 'global',
    iterations: [{ type: 'message', model: null, input_tokens: 1000, cache_creation_input_tokens: 60000, cache_read_input_tokens: 0, output_tokens: 800 }],
  };
  const c = costOfUsage(usage, sonnet);
  close(c.usd, (1000 * 2 + 60000 * 2.5 + 800 * 10) / M);
  assert.equal(c.thinking, 500);
  assert.equal(c.cacheWrite, 60000);
});

test('Haiku 5.5: istem 100 bin token\'ı aşınca bütün tokenlar üst fiyattan; tam 100 bin taban fiyat', () => {
  close(costOfUsage({ input_tokens: 100_000, output_tokens: 0 }, haiku).usd, (100_000 * 0.1) / M);
  close(costOfUsage({ input_tokens: 50_000, cache_read_input_tokens: 50_001, output_tokens: 1000 }, haiku).usd, (50_000 * 0.5 + 50_001 * 0.05 + 1000 * 2.5) / M);
});

test('inference_geo "us" 1,1 kat', () => {
  close(costOfUsage({ input_tokens: M, output_tokens: 0, inference_geo: 'us' }, sonnet).usd, 2.2);
});

test('yedek modelin turu kendi modeliyle; fiyatı bilinmeyen model tahmin edilmez', () => {
  const usage = {
    input_tokens: 2000,
    output_tokens: 100,
    iterations: [
      { type: 'message', model: null, input_tokens: 1000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 10 },
      { type: 'fallback_message', model: 'ornek-yedek-model', input_tokens: 1000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 90 },
    ],
  };
  const c = costOfUsage(usage, sonnet);
  assert.equal(c.usd, null);
  assert.deepEqual(c.unknownModels, ['ornek-yedek-model']);
  assert.equal(c.input, 2000);
  // Yedek bilinen bir modelse iki tur da kendi fiyatıyla toplanır.
  usage.iterations[1].model = haiku;
  close(costOfUsage(usage, sonnet).usd, (1000 * 2 + 10 * 10) / M + (1000 * 0.1 + 90 * 0.5) / M);
});

test('usage yoksa maliyet sıfır', () => {
  assert.equal(costOfUsage(null, sonnet).usd, 0);
});

test('ay sınırları ve geçersiz ay', () => {
  assert.deepEqual(monthBounds('2026-02'), { start: '2026-02-01', end: '2026-02-28', days: 28 });
  assert.equal(monthBounds('2026-10').days, 31);
  assert.throws(() => monthBounds('2026-13'));
});

const summary = (date, status, usage, extra = {}) => ({ kind: 'summary', local_date: date, status, category: null, model: sonnet, fallback: false, usage, classifier_usage: null, error: null, sentences: 0, shown: 0, problems: [], ...extra });
const question = (date, status, usage, extra = {}) => ({
  kind: 'question',
  local_date: date,
  status,
  category: 'in_scope',
  model: sonnet,
  fallback: false,
  usage,
  classifier_usage: { input_tokens: 800, output_tokens: 12 },
  error: null,
  sentences: 0,
  shown: 0,
  problems: [],
  ...extra,
});

const rows = [
  summary('2026-10-09', 'accepted', { input_tokens: 50_000, output_tokens: 2000 }, { sentences: 10, shown: 8, problems: ['number_uncited', 'number_uncited'] }),
  summary('2026-10-09', 'rejected', { input_tokens: 50_000, output_tokens: 2000 }, { sentences: 6, shown: 0, problems: ['uncited_sentence'] }),
  summary('2026-10-10', 'failed', null, { model: null, error: 'anthropic_529' }),
  question('2026-10-10', 'answered', { input_tokens: 1000, cache_creation_input_tokens: 60_000, output_tokens: 800 }, { sentences: 5, shown: 5 }),
  question('2026-10-10', 'no_source', { input_tokens: 1000, cache_read_input_tokens: 60_000, output_tokens: 30 }, { category: 'supplement' }),
  question('2026-10-11', 'routed', null, { category: 'medical_red_flag', model: null }),
  summary('2026-11-02', 'accepted', { input_tokens: 40_000, output_tokens: 2000 }, { sentences: 5, shown: 5 }),
];

test('ay raporu: kapsanan gün ilk kayıttan, maliyet, 30 günlük karşılık, durumlar ve atılan cümleler', () => {
  const r = monthReport(rows, '2026-10', { today: '2026-10-13', firstDate: '2026-10-09' });
  assert.equal(r.coverStart, '2026-10-09');
  assert.equal(r.coveredDays, 5);
  const summaryUsd = 2 * (50_000 * 2 + 2000 * 10) / M;
  const answerUsd = (1000 * 2 + 60_000 * 2.5 + 800 * 10) / M + (1000 * 2 + 60_000 * 0.1 + 30 * 10) / M;
  const classifierUsd = (3 * (800 * 0.1 + 12 * 0.5)) / M;
  close(r.usd, summaryUsd + answerUsd + classifierUsd);
  close(r.per30, (r.usd / 5) * 30);
  assert.equal(r.summaries.totals.calls, 2);
  close(r.summaries.perCall, summaryUsd / 2);
  assert.deepEqual(r.summaries.status, { accepted: 1, rejected: 1, failed: 1 });
  assert.deepEqual(r.summaries.errors, { anthropic_529: 1 });
  assert.equal(r.summaries.days, 2);
  // Atılan cümle yalnız kabul edilen özette sayılır.
  assert.deepEqual(r.summaries.acceptedSentences, { sentences: 10, shown: 8, dropped: 2 });
  assert.deepEqual(r.summaries.problems, { number_uncited: 2, uncited_sentence: 1 });
  assert.equal(r.questions.rows, 3);
  assert.equal(r.questions.cacheWrites, 1);
  assert.equal(r.questions.cacheHits, 1);
  assert.equal(r.questions.classifier.calls, 3);
  assert.deepEqual(r.questions.category, { in_scope: 1, supplement: 1, medical_red_flag: 1 });
  close(r.questions.perQuestion, (answerUsd + classifierUsd) / 3);
});

test('geçmiş ay tam kapsanır; ay içinde kayıt yoksa maliyet sıfır', () => {
  const r = monthReport(rows, '2026-11', { today: '2026-12-05', firstDate: '2026-10-09' });
  assert.equal(r.coveredDays, 30);
  assert.equal(r.summaries.totals.calls, 1);
  const empty = monthReport(rows, '2026-09', { today: '2026-10-13', firstDate: '2026-10-09' });
  assert.equal(empty.coveredDays, 0);
  assert.equal(empty.per30, null);
  assert.equal(empty.usd, 0);
});

test('aylar eskiden yeniye', () => {
  assert.deepEqual(monthsOf(rows), ['2026-10', '2026-11']);
});

test('tetikler: 10 $ sınırına yaklaşma ve iki ay üst üste tahminin iki katı', () => {
  const base = { coveredDays: 30 };
  assert.deepEqual(triggerFlags([{ ...base, month: '2026-10', usd: 3, per30: 3 }]), []);
  assert.equal(triggerFlags([{ ...base, month: '2026-10', usd: 2, per30: 8.5 }]).length, 1);
  const twice = ESTIMATE.monthlyUsd * 2 + 0.5;
  assert.equal(triggerFlags([{ ...base, month: '2026-10', usd: twice, per30: twice }, { ...base, month: '2026-11', usd: twice, per30: twice }]).length, 1);
  // Ardışık olmayan aylar sayılmaz.
  assert.equal(triggerFlags([{ ...base, month: '2026-10', usd: twice, per30: twice }, { ...base, month: '2026-12', usd: twice, per30: twice }]).length, 0);
});

test('kredi: tablolar + tablo dışı harcama', () => {
  const c = creditStatus(rows, { credit: 10, offTable: [{ date: '2026-10-10', usd: 1, what: 'ornek' }] });
  const all = monthReport(rows, '2026-10', { today: '2026-10-13', firstDate: '2026-10-09' }).usd + monthReport(rows, '2026-11', { today: '2026-12-01', firstDate: '2026-10-09' }).usd;
  close(c.tables, all);
  close(c.remaining, 10 - all - 1);
});

test('ölçüme dayalı senaryo 0032 senaryosuyla aynı çağrı sayıları', () => {
  close(measuredScenarioUsd(), 30 * ESTIMATE.summaryPerCallUsd + 10 * ESTIMATE.questionFirstUsd + 20 * ESTIMATE.questionCachedUsd);
});

test('biçim: Türkçe ondalık, küçük tutar dört basamak', () => {
  assert.equal(usd(1.2346), '1,235 $');
  assert.equal(usd(0.0003), '0,0003 $');
  assert.equal(usd(null), '—');
});

test('rapor metni: tablolar, tetik yok notu, kısa dönem uyarısı', () => {
  const reports = ['2026-10', '2026-11'].map((m) => monthReport(rows, m, { today: '2026-11-04', firstDate: '2026-10-09' }));
  const text = formatReport(reports[1], { allMonths: reports, credit: creditStatus(rows), flags: triggerFlags(reports) });
  assert.match(text, /# Koç token kullanımı — 2026-11/);
  assert.match(text, /\| Günlük özet \(Sonnet\) \| 1 \|/);
  assert.match(text, /Dönem kısa \(4 gün\)/);
  assert.match(text, /tetiklerinden hiçbiri yok/);
  assert.match(text, /## Aylar/);
});

test('sorgu metin sütunu seçmez (özet, soru, yanıt, anlık değerler)', () => {
  const sql = USAGE_SQL.replace(/'[^']*'/g, "''");
  for (const column of ['content', 'question', 'answer', 'snapshot']) assert.doesNotMatch(sql, new RegExp(`\\b${column}\\b`), column);
  // Denetimden cümle metni değil yalnız sayısı, `ok` ve sorun kodu gelir.
  const textFields = [...USAGE_SQL.matchAll(/->>\s*'(\w+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(textFields)].sort(), ['code', 'ok']);
  assert.doesNotMatch(USAGE_SQL, /audit->'sentences'\s*->|jsonb_array_elements\(audit->'sentences'\)/);
});
