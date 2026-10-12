import assert from 'node:assert/strict';
import { test } from 'node:test';

import Anthropic from '@anthropic-ai/sdk';

import {
  askDailyLimit,
  askTimeouts,
  buildAskRequest,
  classifierModel,
  noSourceSentence,
  parseAskBody,
  runAsk,
  type AskStore,
  type NewAskRow,
} from '../../_shared/coach/ask.ts';
import { auditResponse } from '../../_shared/coach/audit.ts';
import { coachModel, fallbackBeta } from '../../_shared/coach/daily.ts';
import type { DocumentEntry } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import type { Kb } from '../../_shared/coach/kb.ts';
import { createFakeAnthropic, message } from './fake-anthropic.ts';
import { asRequestBody, fullSnapshot } from './fixtures.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const USER = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-01-15T07:30:00Z');
const DATE = '2026-01-15';
const QUESTION = 'Maçtan önce ne kadar karbonhidrat almalıyım?';

function memoryStore() {
  const rows: NewAskRow[] = [];
  const store: AskStore = {
    async countDay(userId, localDate) {
      return rows.filter((r) => r.user_id === userId && r.local_date === localDate).length;
    },
    async insert(row) {
      rows.push(structuredClone(row));
    },
  };
  return { store, rows };
}

function setup() {
  const fake = createFakeAnthropic();
  const client = new Anthropic({ apiKey: 'sk-ant-test', baseURL: 'https://anthropic.test', fetch: fake.fetch, maxRetries: 0 });
  const { store, rows } = memoryStore();
  const run = (body: unknown = { date: DATE, question: QUESTION, snapshot: asRequestBody(fullSnapshot()) }) =>
    runAsk({ userId: USER, body, now: NOW }, { store, messages: client.beta.messages, kb });
  return { fake, rows, run };
}

const classified = (category: string) => message([{ type: 'text', text: JSON.stringify({ category }) }], { model: classifierModel });

// Yanıt belgelerinin düzeni: önce bütün kaynaklar (kimlik sırasıyla), en sonda günün sayıları.
const { layout } = buildAskRequest(QUESTION, fullSnapshot(), kb);
const numbersIndex = layout.findIndex((e) => e.kind === 'numbers');
const blocks = (layout[numbersIndex] as Extract<DocumentEntry, { kind: 'numbers' }>).blocks;

// Özetinde "g/kg" geçen bir kaynak ve oradaki ilk sayı: kaynaktan sayı alıntısı için.
const gramSource = kbSources.findIndex((s) => /\d+,\d+ g\/kg/.test(s.summary));
const gramText = kbSources[gramSource]!.summary.match(/\d+,\d+ g\/kg/)![0];

const src = (i: number, cited = '…') => ({ type: 'char_location', document_index: i, document_title: kbSources[i]!.id, start_char_index: 0, end_char_index: 10, cited_text: cited, file_id: null });
const num = (id: string) => {
  const i = blocks.findIndex((b) => b.id === id);
  return { type: 'content_block_location', document_index: numbersIndex, document_title: 'Günün sayıları', start_block_index: i, end_block_index: i + 1, cited_text: blocks[i]!.text, file_id: null };
};

function goodAnswer() {
  return [
    { type: 'thinking', thinking: '', signature: 'sig' },
    { type: 'text', text: `Maç öncesi öğünde karbonhidrat ${gramText} düzeyinde önerilir`, citations: [src(gramSource, `karbonhidrat ${gramText}`)] },
    { type: 'text', text: '. ' },
    { type: 'text', text: 'Bugünkü beslenme hedefin uygulamada hesaplandı', citations: [num('nutrition')] },
    { type: 'text', text: '.' },
  ];
}

test('istek gövdesi: geçerli soru, eksik alanlar, uzunluk, bilinmeyen alan, tarih', () => {
  const ok = parseAskBody({ date: DATE, question: `  ${QUESTION}  `, snapshot: null }, NOW);
  assert.deepEqual(ok, { ok: true, date: DATE, question: QUESTION, snapshot: null });

  const bad = (body: unknown) => {
    const r = parseAskBody(body, NOW);
    assert.equal(r.ok, false);
    return r.ok ? [] : r.errors;
  };
  assert.match(bad({ date: DATE }).join(), /question/);
  assert.match(bad({ date: DATE, question: 'ab' }).join(), /3-500/);
  assert.match(bad({ date: DATE, question: 'x'.repeat(501) }).join(), /3-500/);
  assert.match(bad({ date: DATE, question: QUESTION, userId: USER }).join(), /bilinmeyen alan/);
  assert.match(bad({ date: '2026-01-20', question: QUESTION }).join(), /sapabilir/);
  assert.match(bad({ date: DATE, question: 'ne\u0007yemeli' }).join(), /denetim karakteri/);
  assert.match(bad({ date: '2026-01-14', question: QUESTION, snapshot: asRequestBody(fullSnapshot()) }).join(), /body.date ile aynı/);
  assert.match(bad({ date: DATE, question: QUESTION, snapshot: { version: 1 } }).join(), /snapshot/);
});

test('kapsamdaki soru: Haiku sınıflandırır, Sonnet tam tabanla (önbellekli) yanıtlar, kaydedilir', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'message', message: message(goodAnswer(), { usage: { input_tokens: 900, output_tokens: 300, cache_creation_input_tokens: 55000, cache_read_input_tokens: 0, iterations: null } }) });

  const result = await run();
  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.status, 'answered');
  if (result.body.status !== 'answered') return;
  assert.equal(result.body.category, 'in_scope');
  assert.equal(result.body.withNumbers, true);
  assert.equal(result.body.omitted, 0);
  assert.deepEqual(result.body.sentences.map((s) => [s.sources, s.numbers]), [
    [[kbSources[gramSource]!.id], []],
    [[], ['nutrition']],
  ]);

  // Sınıflandırma isteği: Haiku, yapılandırılmış çıktı, soru etiket içinde.
  assert.equal(fake.requests.length, 2);
  const cls = fake.requests[0]!.body;
  assert.equal(cls.model, classifierModel);
  assert.equal(cls.output_config.format.type, 'json_schema');
  assert.deepEqual(cls.output_config.format.schema.properties.category.enum, ['in_scope', 'supplement', 'medical_red_flag', 'out_of_scope']);
  assert.match(cls.messages[0].content, /<soru>\nMaçtan önce/);

  // Yanıt isteği: Sonnet, yedek açık, kaynaklar kimlik sırasıyla ve yalnız sonuncusunda önbellek işareti.
  const req = fake.requests[1]!;
  assert.match(req.headers['anthropic-beta'] ?? '', new RegExp(fallbackBeta));
  assert.equal(req.body.model, coachModel);
  assert.equal(req.body.fallbacks, 'default');
  assert.deepEqual(req.body.output_config, { effort: 'medium' });
  const content = req.body.messages[0].content as Record<string, any>[];
  assert.equal(content.length, kbSources.length + 2);
  assert.deepEqual(content.slice(0, kbSources.length).map((d) => d.title), kbSources.map((s) => s.id));
  const marked = content.flatMap((d, i) => (d.cache_control ? [i] : []));
  assert.deepEqual(marked, [kbSources.length - 1]);
  assert.equal(content[kbSources.length]!.title, 'Günün sayıları');
  assert.deepEqual(content.at(-1), { type: 'text', text: `Soru: ${QUESTION}` });
  assert.doesNotMatch(JSON.stringify(req.body), new RegExp(USER));

  // Kayıt
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.status, 'answered');
  assert.equal(row.category, 'in_scope');
  assert.equal(row.question, QUESTION);
  assert.equal(row.usage?.cache_creation_input_tokens, 55000);
  assert.equal(row.classifier_usage?.input_tokens, 4200);
  assert.deepEqual(row.answer, result.body);
  assert.ok(row.content!.every((b) => b.type === 'text'), 'düşünme blokları saklanmaz');
});

test('önbellek öneki soru ve günün sayılarıyla değişmez', () => {
  const a = buildAskRequest(QUESTION, fullSnapshot(), kb).params;
  const b = buildAskRequest('Uykum kısa, ne yapmalıyım?', null, kb).params;
  assert.equal(a.system, b.system);
  const prefix = (p: typeof a) => JSON.stringify((p.messages[0]!.content as unknown[]).slice(0, kbSources.length));
  assert.equal(prefix(a), prefix(b));
});

test('kaynağın sayısı yalnız alıntılanan metinde geçiyorsa kabul; geçmeyen cümle atılır (kısmi kabul)', async () => {
  const { fake, run } = setup();
  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({
    kind: 'message',
    message: message([
      { type: 'text', text: `Maç öncesi karbonhidrat ${gramText} düzeyinde önerilir`, citations: [src(gramSource, `karbonhidrat ${gramText}`)] },
      { type: 'text', text: '. ' },
      { type: 'text', text: 'Maçtan 4 saat önce yemek yemen önerilir', citations: [src(gramSource, 'maçtan önce yemek')] },
      { type: 'text', text: '.' },
    ]),
  });
  const result = await run();
  assert.equal(result.body.status, 'answered');
  if (result.body.status !== 'answered') return;
  assert.equal(result.body.sentences.length, 1);
  assert.equal(result.body.omitted, 1);
});

test('günlük özet kipinde kaynağın sayısı yine kabul edilmez', () => {
  const content = [{ type: 'text', text: `Karbonhidrat ${gramText} önerilir.`, citations: [src(gramSource, `karbonhidrat ${gramText}`)] }];
  assert.equal(auditResponse(content, layout).problems[0]?.code, 'number_uncited');
  assert.equal(auditResponse(content, layout, { sourceNumbers: true }).ok, true);
});

test('kaynağa alıntı yoksa no_source; "kaynak yok" cümlesi kaynaklı yanıtta gösterilmez', async () => {
  const { fake, run } = setup();
  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'message', message: message([{ type: 'text', text: noSourceSentence }]) });
  const none = await run();
  assert.deepEqual(none.body, { status: 'no_source', category: 'in_scope' });

  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'message', message: message([...goodAnswer(), { type: 'text', text: ` ${noSourceSentence}` }]) });
  const mixed = await run();
  assert.equal(mixed.body.status, 'answered');
  if (mixed.body.status === 'answered') assert.equal(mixed.body.sentences.length, 2);
});

test('kaynaklı cümlelerin hepsi düşerse rejected', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'message', message: message([{ type: 'text', text: 'Maçtan 4 saat önce ye', citations: [src(gramSource, 'yemek')] }, { type: 'text', text: '.' }]) });
  const result = await run();
  assert.deepEqual(result.body, { status: 'rejected', category: 'in_scope' });
  assert.equal(rows[0]!.status, 'rejected');
  assert.equal(rows[0]!.audit?.problems[0]?.code, 'number_uncited');
});

test('takviye sorusu yanıtlanır, sınıfı uygulamaya döner (doping uyarısını uygulama ekler)', async () => {
  const { fake, run } = setup();
  fake.reply({ kind: 'message', message: classified('supplement') });
  fake.reply({ kind: 'message', message: message(goodAnswer()) });
  const result = await run();
  assert.equal(result.body.status, 'answered');
  if (result.body.status === 'answered') assert.equal(result.body.category, 'supplement');
});

for (const category of ['medical_red_flag', 'out_of_scope'] as const) {
  test(`${category}: yanıt modeli çağrılmaz, sabit metne yönlendirilir`, async () => {
    const { fake, rows, run } = setup();
    fake.reply({ kind: 'message', message: classified(category) });
    const result = await run();
    assert.equal(result.httpStatus, 200);
    assert.deepEqual(result.body, { status: 'routed', category });
    assert.equal(fake.requests.length, 1);
    assert.equal(rows[0]!.status, 'routed');
    assert.equal(rows[0]!.content, null);
    assert.equal(rows[0]!.model, null);
  });
}

test('anlık değer yoksa günün sayıları gitmez, yanıt kişisel değildir', async () => {
  const { fake, run } = setup();
  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'message', message: message(goodAnswer().slice(0, 3)) });
  const result = await run({ date: DATE, question: QUESTION, snapshot: null });
  const content = fake.requests[1]!.body.messages[0].content as Record<string, any>[];
  assert.equal(content.length, kbSources.length + 1);
  assert.equal(result.body.status, 'answered');
  if (result.body.status === 'answered') assert.equal(result.body.withNumbers, false);
});

test('günlük sınır: dolunca model çağrılmaz', async () => {
  const { fake, rows, run } = setup();
  for (let i = 0; i < askDailyLimit; i++) {
    fake.reply({ kind: 'message', message: classified('out_of_scope') });
    await run();
  }
  const result = await run();
  assert.equal(result.httpStatus, 429);
  assert.deepEqual(result.body, { status: 'limit' });
  assert.equal(rows.length, askDailyLimit);
  assert.equal(fake.requests.length, askDailyLimit);
});

test('hatalar: bağlantı, bozuk sınıf, yanıtta kredi bitti, ret; kişisel veri içermeyen kodlar', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'network' });
  assert.deepEqual((await run()).body, { status: 'failed', category: null, error: 'anthropic_connection' });

  fake.reply({ kind: 'message', message: message([{ type: 'text', text: 'tactics' }]) });
  assert.deepEqual((await run()).body, { status: 'failed', category: null, error: 'classifier_invalid' });

  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'error', status: 400, type: 'invalid_request_error' });
  const credit = await run();
  assert.equal(credit.httpStatus, 502);
  assert.deepEqual(credit.body, { status: 'failed', category: 'in_scope', error: 'anthropic_400' });

  fake.reply({ kind: 'message', message: classified('in_scope') });
  fake.reply({ kind: 'message', message: message([], { stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'bio', explanation: null } }) });
  assert.deepEqual((await run()).body, { status: 'failed', category: 'in_scope', error: 'refusal_bio' });

  assert.deepEqual(rows.map((r) => r.status), ['failed', 'failed', 'failed', 'failed']);
  assert.ok(rows.every((r) => r.error && !r.error.includes('Maç')));
  assert.equal(rows[3]!.model, 'claude-sonnet-5-5');
});

test('süreler fonksiyonun 150 sn sınırının içinde', () => {
  const worst = (t: { timeout: number; maxRetries: number }) => t.timeout * (t.maxRetries + 1);
  assert.ok(worst(askTimeouts.classifier) + worst(askTimeouts.answer) <= 140_000);
});
