import assert from 'node:assert/strict';
import { test } from 'node:test';

import Anthropic from '@anthropic-ai/sdk';

import { dailyDocuments, type DocumentEntry } from '../../_shared/coach/documents.ts';
import {
  coachModel,
  dailyAttemptLimit,
  fallbackBeta,
  isPlausibleDate,
  routingNotes,
  runDaily,
  type CoachStore,
  type NewSummaryRow,
  type SummaryRow,
} from '../../_shared/coach/daily.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import { selectForRules, type Kb } from '../../_shared/coach/kb.ts';
import { snapshotRuleIds } from '../../_shared/coach/snapshot.ts';
import { createFakeAnthropic, message } from './fake-anthropic.ts';
import { asRequestBody, fullSnapshot } from './fixtures.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const USER = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-01-15T07:30:00Z');

function memoryStore() {
  const rows: (NewSummaryRow & { created_at: string })[] = [];
  let clock = 0;
  const store: CoachStore = {
    async listDay(userId, localDate) {
      return rows
        .filter((r) => r.user_id === userId && r.local_date === localDate)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r): SummaryRow => ({ status: r.status, created_at: r.created_at, audit: r.audit, error: r.error }));
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
  const run = (body: unknown = asRequestBody(fullSnapshot()), regenerate = false) =>
    runDaily({ userId: USER, body, regenerate, now: NOW }, { store, messages: client.beta.messages, kb });
  return { fake, rows, run };
}

// İstekteki belge düzeni: 0 günün sayıları, sonra seçilen kaynaklar.
const snapshot = fullSnapshot();
const sources = selectForRules(kb, snapshotRuleIds(snapshot)).sources;
// Fonksiyonun kuracağı günün sayıları blokları; sahte yanıtın alıntıları bunlara göre yazılır.
const blocks = (dailyDocuments(snapshot, kb, sources).layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>).blocks;

function goodContent() {
  const hrv = blocks.findIndex((b) => b.id === 'hrv');
  const sleep = blocks.findIndex((b) => b.id === 'sleep');
  const status = blocks.findIndex((b) => b.id === 'status');
  const cite = (i: number) => ({ type: 'content_block_location', document_index: 0, document_title: 'Günün sayıları', start_block_index: i, end_block_index: i + 1, cited_text: blocks[i]!.text, file_id: null });
  const src = { type: 'char_location', document_index: 1, document_title: sources[0]!.id, start_char_index: 0, end_char_index: 20, cited_text: '…', file_id: null };
  return [
    { type: 'thinking', thinking: '', signature: 'sig' },
    { type: 'text', text: 'Günün durumu Kontrollü', citations: [cite(status)] },
    { type: 'text', text: '. ' },
    { type: 'text', text: 'HRV ortalaman 48 ms ile bandının altında', citations: [cite(hrv)] },
    { type: 'text', text: ' ve uyku ortalaman 6,4 saat', citations: [cite(sleep)] },
    { type: 'text', text: '. ' },
    { type: 'text', text: 'Bugün yüklenmeyi hafifletmen önerilir', citations: [src] },
    { type: 'text', text: '.' },
  ];
}

/** Gönderilen isteğin günün sayıları bloklarını kimlikleriyle geri kurar (sahte yanıtın alıntıları için). */
function sentBlocks(body: Record<string, any>) {
  const doc = body.messages[0].content[0];
  assert.equal(doc.title, 'Günün sayıları');
  const texts: string[] = doc.source.content.map((c: { text: string }) => c.text);
  const ids = ['day', 'status', 'hrv', 'rhr', 'sleep', 'respiration', 'checkin', 'load', 'load.ratio', 'regions.0', 'regions.1', 'pain.0', 'nutrition', 'nutrition.intake', 'fluid', 'sweatTest'];
  assert.equal(texts.length, ids.length);
  return ids.map((id, i) => ({ id, text: texts[i]! }));
}

test('ilk açılış: istek biçimi doğru, yanıt denetimden geçer ve kaydedilir', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'message', message: message(goodContent()) });

  const result = await run();
  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.status, 'accepted');
  if (result.body.status !== 'accepted') return;
  assert.equal(result.body.cached, false);
  assert.equal(result.body.sentences.length, 3);
  assert.deepEqual(result.body.sentences[1]!.numbers, ['hrv', 'sleep']);
  assert.deepEqual(result.body.sentences[2]!.sources, [sources[0]!.id]);
  assert.deepEqual(result.body.notes, []);

  // İstek
  assert.equal(fake.requests.length, 1);
  const req = fake.requests[0]!;
  assert.equal(req.url, 'https://anthropic.test/v1/messages?beta=true');
  assert.equal(req.headers['x-api-key'], 'sk-ant-test');
  assert.match(req.headers['anthropic-beta'] ?? '', new RegExp(fallbackBeta));
  assert.equal(req.body.model, coachModel);
  assert.equal(req.body.fallbacks, 'default');
  assert.deepEqual(req.body.thinking, { type: 'adaptive' });
  assert.deepEqual(req.body.output_config, { effort: 'medium' }); // format yok: citations yapılandırılmış çıktıyla birlikte kullanılamaz
  assert.equal('betas' in req.body, false, 'beta başlıkta gider, gövdede değil');
  const content = req.body.messages[0].content as Record<string, any>[];
  assert.equal(content.length, sources.length + 2);
  assert.deepEqual(sentBlocks(req.body), blocks.map((b) => ({ id: b.id, text: b.text })));
  for (const doc of content.slice(0, -1)) assert.deepEqual(doc.citations, { enabled: true });
  assert.deepEqual(content.slice(1, -1).map((d) => d.title), sources.map((s) => s.id));
  assert.equal(content.at(-1)!.type, 'text');
  // Kişisel veri sızmasın: anlık değerlerin tarihi ve kullanıcı kimliği istekte yok.
  const raw = JSON.stringify(req.body);
  assert.doesNotMatch(raw, /2026-01-15/);
  assert.doesNotMatch(raw, new RegExp(USER));

  // Kayıt
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.status, 'accepted');
  assert.equal(row.model, 'claude-sonnet-5-5');
  assert.equal(row.fallback, false);
  assert.equal(row.usage?.input_tokens, 4200);
  assert.ok(row.content!.every((b) => b.type === 'text'), 'düşünme blokları saklanmaz');
  assert.deepEqual(row.snapshot, snapshot);
});

test('aynı gün yeniden açılış: model çağrılmaz, saklanan özet döner', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'message', message: message(goodContent()) });
  await run();
  const again = await run();
  assert.equal(fake.requests.length, 1);
  assert.equal(rows.length, 1);
  assert.equal(again.body.status, 'accepted');
  assert.ok(again.body.status === 'accepted' && again.body.cached);
});

test('uydurma sayı: yanıt reddedilir, metin uygulamaya gitmez ama denetim için saklanır', async () => {
  const { fake, rows, run } = setup();
  fake.reply({
    kind: 'message',
    message: message([{ type: 'text', text: 'HRV ortalaman 49 ms.', citations: [{ type: 'content_block_location', document_index: 0, document_title: 'Günün sayıları', start_block_index: 2, end_block_index: 3, cited_text: '…', file_id: null }] }]),
  });
  const result = await run();
  assert.deepEqual(result.body, { status: 'rejected', cached: false, notes: [] });
  assert.equal(rows[0]!.status, 'rejected');
  assert.deepEqual(rows[0]!.audit!.problems.map((p) => p.code), ['number_mismatch']);
  assert.equal(rows[0]!.content!.length, 1);
});

test('yeniden üretme günde sınırlı; sınırda model çağrılmaz', async () => {
  const { fake, rows, run } = setup();
  for (let i = 0; i < dailyAttemptLimit; i++) {
    fake.reply({ kind: 'message', message: message([{ type: 'text', text: 'Kısa.' }]) });
    await run(undefined, true);
  }
  assert.equal(rows.length, dailyAttemptLimit);
  const limited = await run(undefined, true);
  assert.equal(limited.httpStatus, 429);
  assert.deepEqual(limited.body, { status: 'limit' });
  assert.equal(fake.requests.length, dailyAttemptLimit);
});

test('ret ve kesilme: başarısız deneme kodla kaydedilir', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'message', message: message([], { stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'general_harms', explanation: null } }) });
  const refused = await run();
  assert.equal(refused.httpStatus, 502);
  assert.deepEqual(refused.body, { status: 'failed', cached: false, error: 'refusal_general_harms', notes: [] });

  fake.reply({ kind: 'message', message: message([{ type: 'text', text: 'Yarım' }], { stop_reason: 'max_tokens' }) });
  const cut = await run(undefined, true);
  assert.ok(cut.body.status === 'failed' && cut.body.error === 'max_tokens');
  assert.deepEqual(rows.map((r) => [r.status, r.error, r.content]), [
    ['failed', 'refusal_general_harms', null],
    ['failed', 'max_tokens', null],
  ]);
});

test('API ve ağ hataları: HTTP durumu ya da bağlantı kodu; mesaj metni saklanmaz', async () => {
  const { fake, rows, run } = setup();
  fake.reply({ kind: 'error', status: 401, type: 'authentication_error' });
  const auth = await run();
  assert.ok(auth.body.status === 'failed' && auth.body.error === 'anthropic_401');

  fake.reply({ kind: 'error', status: 400, type: 'invalid_request_error' });
  await run(undefined, true);
  fake.reply({ kind: 'network' });
  await run(undefined, true);
  assert.deepEqual(rows.map((r) => r.error), ['anthropic_401', 'anthropic_400', 'anthropic_connection']);
  // Başarısız deneme sonrası normal açılış yeniden çağırmaz; son sonucu gösterir.
  const cached = await run();
  assert.ok(cached.body.status === 'failed' && cached.body.cached);
  assert.equal(cached.httpStatus, 200);
  assert.equal(fake.requests.length, 3);
});

test('sunucu taraflı yedek devreye girerse kayıtta işaretlenir', async () => {
  const { fake, rows, run } = setup();
  fake.reply({
    kind: 'message',
    message: message([{ type: 'fallback', from: { model: 'claude-sonnet-5-5' }, to: { model: 'claude-sonnet-5' } }, { type: 'text', text: 'Kısa özet.' }], { model: 'claude-sonnet-5' }),
  });
  await run();
  assert.equal(rows[0]!.fallback, true);
  assert.equal(rows[0]!.model, 'claude-sonnet-5');
});

test('geçersiz anlık değerler ve uzak tarih: model çağrılmaz, kayıt yok', async () => {
  const { fake, rows, run } = setup();
  const bad = await run({ ...fullSnapshot(), weightKg: 88 });
  assert.equal(bad.httpStatus, 400);
  assert.equal(bad.body.status, 'invalid');
  const far = await run({ ...asRequestBody(fullSnapshot()) as object, date: '2026-01-10' });
  assert.equal(far.httpStatus, 400);
  assert.equal(fake.requests.length, 0);
  assert.equal(rows.length, 0);
});

test('yönlendirme notları kodla: solunum tek gece ve yüksek sabah ağrısı', () => {
  const s = fullSnapshot();
  assert.deepEqual(routingNotes(s), []);
  s.respiration = { ...s.respiration!, nightHigh: true };
  s.pain = [{ region: 'achilles', side: 'right', pain: 7, yesterdayPain: null, reasons: ['high'] }];
  assert.deepEqual(routingNotes(s), ['respiration_high', 'pain_high']);
});

test('tarih payı: sunucunun UTC gününden bir gün', () => {
  assert.ok(isPlausibleDate('2026-01-15', NOW));
  assert.ok(isPlausibleDate('2026-01-14', NOW));
  assert.ok(isPlausibleDate('2026-01-16', NOW));
  assert.ok(!isPlausibleDate('2026-01-17', NOW));
});
