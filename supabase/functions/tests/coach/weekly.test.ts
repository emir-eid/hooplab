// Koçun haftalık yorumu (karar 0052): şema, biten hafta, belge, kaynak seçimi ve akış (sahte Anthropic sunucusuyla).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import Anthropic from '@anthropic-ai/sdk';

import { weeklyAttemptLimit } from '../../_shared/coach/contract.ts';
import { coachModel } from '../../_shared/coach/daily.ts';
import type { DocumentEntry } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import type { Kb } from '../../_shared/coach/kb.ts';
import {
  buildWeeklyRequest,
  isCompletedWeek,
  parseWeeklySnapshot,
  runWeekly,
  weeklyNumbersTitle,
  weeklyRuleIds,
  type NewWeeklyRow,
  type WeeklyRow,
  type WeeklySnapshot,
  type WeeklyStore,
} from '../../_shared/coach/weekly.ts';
import { createFakeAnthropic, message } from './fake-anthropic.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const USER = '11111111-1111-4111-8111-111111111111';
// 2026-01-12 pazartesi; hafta 18'inde biter. NOW pazartesi 19'u.
const WEEK = '2026-01-12';
const NOW = new Date('2026-01-19T08:00:00Z');

function weekSnapshot(): WeeklySnapshot {
  return {
    version: 1,
    weekStart: WEEK,
    status: { ready: 3, caution: 3, recover: 1, insufficient: 0 },
    hrv: { mean: 48, band: { low: 52, high: 66 }, position: 'below' },
    rhr: { mean: 47, band: { low: 44, high: 50 }, position: 'within' },
    sleep: { meanHours: 6.6, nights: 7, short: true },
    signs: { respiration: 0, rhr: 1, spo2: 0, skinTemp: 0 },
    checkin: { days: 6, meanTotal: 17.5, baselineMean: 19.2, lowDays: 2 },
    load: {
      week: 5915,
      previousWeek: 4501,
      weekChange: 0.31,
      weeklyAverage: 4856,
      ratio: 1.6,
      spike: true,
      monotony: 1.8,
      strain: 10534,
      sessions: 10,
      games: 1,
      minutesPlayed: 24,
    },
    pain: [{ region: 'patellar_tendon', side: 'right', maxPain: 6, days: 4, daysAbove: 1 }],
    nutrition: { mealDays: 6, carbs: { below: 5, within: 1, above: 0 }, protein: { below: 0, within: 3, above: 3 }, noTarget: 0, matchDays: 1, sweatTests: 1 },
    fluid: { meanL: 2.4, days: 5 },
  };
}

const body = (s: unknown = weekSnapshot()) => JSON.parse(JSON.stringify(s));

test('şema: geçerli hafta kabul edilir; bilinmeyen alan, pazartesi olmayan gün ve eksik günler reddedilir', () => {
  assert.equal(parseWeeklySnapshot(body()).ok, true);
  const bad = (patch: Record<string, unknown>) => parseWeeklySnapshot({ ...body(), ...patch });
  assert.equal(bad({ weight: 80 }).ok, false);
  assert.equal(bad({ weekStart: '2026-01-14' }).ok, false);
  assert.equal(bad({ status: { ready: 3, caution: 3, recover: 0, insufficient: 0 } }).ok, false);
  assert.equal(bad({ hrv: { mean: 900, band: null, position: null } }).ok, false);
  const r = bad({ load: { ...weekSnapshot().load, extra: 1 } });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.startsWith('snapshot.load.extra')));
});

test('yalnız biten hafta: pazar günü bitmeden yazılmaz (bir gün saat dilimi payı)', () => {
  assert.equal(isCompletedWeek(WEEK, new Date('2026-01-17T12:00:00Z')), false);
  assert.equal(isCompletedWeek(WEEK, new Date('2026-01-18T12:00:00Z')), true);
  assert.equal(isCompletedWeek(WEEK, NOW), true);
});

test('belge: haftanın sayıları başlığı, kural değerleri kanıt tabanından, tahmin blokları işaretli', () => {
  const s = weekSnapshot();
  const { params, layout } = buildWeeklyRequest(s, kb);
  const numbers = layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>;
  assert.equal((params.messages[0]!.content as { title?: string }[])[0]!.title, weeklyNumbersTitle);
  const ids = numbers.blocks.map((b) => b.id);
  assert.deepEqual(ids, ['status', 'hrv', 'rhr', 'sleep', 'signs', 'checkin', 'load', 'load.ratio', 'pain.0', 'nutrition', 'nutrition.days', 'fluid']);
  const text = (id: string) => numbers.blocks.find((b) => b.id === id)!.text;
  assert.match(text('status'), /3 gün Hazır, 3 gün Kontrollü, 1 gün Toparlan/);
  assert.match(text('load'), /5\.915 AU.*Önceki hafta 4\.501 AU \(\+%31\)/);
  assert.match(text('pain.0'), /Sağ patellar tendon, 4 gün ağrı girildi, en yüksek 6\/10; 1 gün 5\/10'un üstünde/);
  for (const id of ['signs', 'load.ratio', 'pain.0', 'nutrition']) assert.equal(numbers.blocks.find((b) => b.id === id)!.estimate, true, id);
  // Kilo, enerji, tarih ve kullanıcı modele gitmez.
  const raw = JSON.stringify(params);
  assert.doesNotMatch(raw, new RegExp(WEEK));
  assert.doesNotMatch(raw, /kcal/);
  assert.equal(params.model, coachModel);
});

test('kaynak seçimi: yalnız dikkat isteyen ölçümlerin kuralları', () => {
  const s = weekSnapshot();
  const rules = weeklyRuleIds(s);
  assert.ok(rules.includes('gunun-durumu'));
  assert.ok(rules.includes('uyku-kisa'));
  assert.ok(rules.includes('yuk-artis-notu'));
  assert.ok(rules.includes('bolge-agri-izleme'));
  assert.ok(!rules.includes('sivi-alim-kaydi'), 'sıvı yalnız sayı, kaynak gitmez');
  const calm: WeeklySnapshot = { ...s, hrv: { ...s.hrv!, position: 'within' }, sleep: { ...s.sleep!, short: false }, load: { ...s.load!, spike: false }, pain: [], signs: { respiration: 0, rhr: 0, spo2: 0, skinTemp: 0 }, checkin: { ...s.checkin!, lowDays: 0 } };
  const calmRules = weeklyRuleIds(calm);
  assert.ok(!calmRules.includes('hrv-olcu') && !calmRules.includes('yuk-artis-notu') && !calmRules.includes('bolge-agri-izleme'));
});

function memoryStore() {
  const rows: (NewWeeklyRow & { created_at: string })[] = [];
  let clock = 0;
  const store: WeeklyStore = {
    async listWeek(userId, weekStart) {
      return rows
        .filter((r) => r.user_id === userId && r.week_start === weekStart)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r): WeeklyRow => ({ status: r.status, created_at: r.created_at, audit: r.audit, error: r.error }));
    },
    async insert(row) {
      rows.push({ ...structuredClone(row), created_at: new Date(NOW.getTime() + ++clock * 1000).toISOString() });
    },
  };
  return { store, rows };
}

function setup() {
  const fake = createFakeAnthropic();
  const client = new Anthropic({ apiKey: 'sk-ant-test', baseURL: 'https://anthropic.test', fetch: fake.fetch, maxRetries: 0 });
  const { store, rows } = memoryStore();
  const run = (opts: { regenerate?: boolean; peek?: boolean; input?: unknown; now?: Date } = {}) =>
    runWeekly(
      { userId: USER, body: opts.input ?? body(), regenerate: opts.regenerate ?? false, peek: opts.peek ?? false, now: opts.now ?? NOW },
      { store, messages: client.beta.messages, kb },
    );
  return { fake, rows, run };
}

function goodContent() {
  const { layout } = buildWeeklyRequest(weekSnapshot(), kb);
  const blocks = (layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>).blocks;
  const cite = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    return { type: 'content_block_location', document_index: 0, document_title: weeklyNumbersTitle, start_block_index: i, end_block_index: i + 1, cited_text: blocks[i]!.text, file_id: null };
  };
  const srcIndex = layout.findIndex((e) => e.kind === 'source' && e.sourceId === 'walsh-2021');
  assert.ok(srcIndex > 0);
  const src = { type: 'char_location', document_index: srcIndex, document_title: 'walsh-2021', start_char_index: 0, end_char_index: 20, cited_text: '…', file_id: null };
  return [
    { type: 'text', text: 'Bu hafta 3 gün Hazır, 3 gün Kontrollü ve 1 gün Toparlan geçti', citations: [cite('status')] },
    { type: 'text', text: '. ' },
    { type: 'text', text: 'Haftanın yükü 5.915 AU ile önceki haftanın 4.501 AU üstünde', citations: [cite('load')] },
    { type: 'text', text: '. ' },
    { type: 'text', text: 'Uyku ihtiyacını kişisel olarak değerlendirmen önerilir', citations: [src] },
    { type: 'text', text: '.' },
  ];
}

test('akış: önce bakma (model çağrılmaz), sonra yazma; kayıt, önbellek ve hafta başına sınır', async () => {
  const { fake, rows, run } = setup();

  const peek = await run({ peek: true });
  assert.deepEqual(peek.body, { status: 'none' });
  assert.equal(fake.requests.length, 0);

  fake.reply({ kind: 'message', message: message(goodContent()) });
  const written = await run();
  assert.equal(written.body.status, 'accepted');
  if (written.body.status === 'accepted') {
    assert.equal(written.body.cached, false);
    assert.equal(written.body.sentences.length, 3);
    assert.deepEqual(written.body.sentences[2]!.sources, ['walsh-2021']);
  }
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.week_start, WEEK);
  assert.doesNotMatch(JSON.stringify(fake.requests[0]!.body), new RegExp(USER));

  // Saklanan döner, model yeniden çağrılmaz.
  const again = await run({ peek: true });
  assert.equal(again.body.status, 'accepted');
  if (again.body.status === 'accepted') assert.equal(again.body.cached, true);
  assert.equal(fake.requests.length, 1);

  // Yeniden yazma: sınıra kadar.
  fake.reply({ kind: 'error', status: 529, type: 'overloaded_error' });
  const failed = await run({ regenerate: true });
  assert.deepEqual(failed.body, { status: 'failed', cached: false, error: 'anthropic_529' });
  assert.equal(rows.length, weeklyAttemptLimit);
  const limited = await run({ regenerate: true });
  assert.deepEqual(limited.body, { status: 'limit' });
  assert.equal(fake.requests.length, 2);

  // Kabul edilen yorum, sonraki başarısız denemeye rağmen gösterilir.
  const shown = await run({ peek: true });
  assert.equal(shown.body.status, 'accepted');
});

test('süren hafta ve geçersiz gövde modele gitmez', async () => {
  const { fake, rows, run } = setup();
  const early = await run({ now: new Date('2026-01-16T10:00:00Z') });
  assert.equal(early.httpStatus, 400);
  const invalid = await run({ input: { ...body(), weekStart: '2026-01-13' } });
  assert.equal(invalid.body.status, 'invalid');
  assert.equal(fake.requests.length, 0);
  assert.equal(rows.length, 0);
});

test('denetimden geçmeyen yorum reddedilir ve metni gösterilmez', async () => {
  const { fake, run } = setup();
  fake.reply({ kind: 'message', message: message([{ type: 'text', text: 'HRV 99 ms ile çok iyi. Yükü artırmalısın. Böyle devam et her gün.' }]) });
  const r = await run();
  assert.deepEqual(r.body, { status: 'rejected', cached: false });
});
