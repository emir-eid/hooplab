import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auditResponse,
  extractNumbers,
  isAdviceOrInterpretation,
  numberCandidates,
  salvageAudit,
  type AuditProblemCode,
  type ResponseBlock,
  type ResponseCitation,
} from '../../_shared/coach/audit.ts';
import { dailyDocuments, type DocumentEntry } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import { selectForRules, type Kb } from '../../_shared/coach/kb.ts';
import { snapshotRuleIds } from '../../_shared/coach/snapshot.ts';
import { fullSnapshot } from './fixtures.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const snapshot = fullSnapshot();
const { layout } = dailyDocuments(snapshot, kb, selectForRules(kb, snapshotRuleIds(snapshot)).sources);
const numbers = layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>;
const sourceIndex = (id: string) => layout.findIndex((e) => e.kind === 'source' && e.sourceId === id);

/** Günün sayıları bloğuna alıntı (blok kimliğiyle). */
function num(...ids: string[]): ResponseCitation[] {
  return ids.map((id) => {
    const i = numbers.blocks.findIndex((b) => b.id === id);
    assert.ok(i >= 0, id);
    return { type: 'content_block_location', document_index: 0, start_block_index: i, end_block_index: i + 1, cited_text: numbers.blocks[i]!.text };
  });
}

/** Kaynak belgesine alıntı. */
function src(id: string): ResponseCitation {
  const i = sourceIndex(id);
  assert.ok(i > 0, id);
  return { type: 'char_location', document_index: i, cited_text: '…' };
}

const t = (text: string, citations?: ResponseCitation[]): ResponseBlock => (citations ? { type: 'text', text, citations } : { type: 'text', text });
const codes = (content: ResponseBlock[]) => auditResponse(content, layout).problems.map((p) => p.code);

test('sayı yazımları: binlik nokta, ondalık virgül, yüzde, aralık, bölü', () => {
  assert.deepEqual(extractNumbers('son 7 gün 2.450 AU (+%24), oran 1,2× ve 5–7 g/kg; 16/25'), ['7', '2.450', '24', '1,2', '5', '7', '16', '25']);
  assert.deepEqual(numberCandidates('2.450').sort(), [2.45, 2450]);
  assert.deepEqual(numberCandidates('1,2'), [1.2]);
  assert.deepEqual(numberCandidates('1.2'), [1.2]);
  assert.deepEqual(numberCandidates('1.250,5'), [1250.5]);
  assert.deepEqual(numberCandidates('09'), [9]);
});

test('öneri / yorum: kökler, -meli, -abilir, cümle sonu emir kipi', () => {
  for (const s of [
    'Bugün yoğunluğu azaltman önerilir.',
    'Uykuna dikkat etmen iyi olur.',
    'Bugün hafif çalışmalısın.',
    'Bu, yorgunluğun birikmeye başladığını gösteriyor.',
    'Bu düşüş birikmiş yükten olabilir.',
    'Bu akşam erken yat.',
    'Antrenmandan sonra karbonhidrat ye.',
    'Isınmayı atlama.',
    'Bugün sprintleri sınırlayın.',
  ]) {
    assert.ok(isAdviceOrInterpretation(s), s);
  }
  for (const s of ['Günün durumu Kontrollü.', 'HRV ortalaman bandın altında.', 'Bugün maç günü.', 'Dinlenik nabzın bandın içinde.']) {
    assert.ok(!isAdviceOrInterpretation(s), s);
  }
});

test('geçen yanıt: sayılar alıntılı bloklarda, öneri kaynaklı, tahmin anılmış, geçiş cümlesi serbest', () => {
  const content: ResponseBlock[] = [
    { type: 'thinking' },
    t('Günün özeti şöyle. '),
    t('HRV ortalaman 48 ms ile 50–62 ms bandının altında', num('hrv')),
    t(' ve son 7 gecenin uyku ortalaman 6,4 saat.', num('sleep')),
    t(' Bugün yüksek yoğunluklu blokları azaltman önerilir', [src('plews-2013')]),
    t('. Tahmin olarak, bu hafta yükün alıştığın seviyenin 1,2 katı', num('load.ratio')),
    t('.\n- Sol patellar tendonda sabah ağrısı 3/10 ve dünden azalmadı; ağrı izleme modeli bir tahmindir', [...num('pain.0'), src(kb.rules.find((r) => r.id === 'bolge-agri-izleme')!.sources[0]!)]),
    t('.'),
  ];
  const result = auditResponse(content, layout);
  assert.deepEqual(result.problems, []);
  assert.ok(result.ok);
  assert.equal(result.sentences.length, 5);
  assert.deepEqual(result.sentences[1]!.numbers, ['hrv', 'sleep']);
  assert.deepEqual(result.sentences[2]!.sources, ['plews-2013']);
  assert.equal(result.sentences[4]!.text, 'Sol patellar tendonda sabah ağrısı 3/10 ve dünden azalmadı; ağrı izleme modeli bir tahmindir.');
});

test('uydurma veya yuvarlanmış sayı reddedilir', () => {
  assert.deepEqual(codes([t('HRV ortalaman 49 ms.', num('hrv'))]), ['number_mismatch']);
  assert.deepEqual(codes([t('Uyku ortalaman yaklaşık 6 saat.', num('sleep'))]), []); // "6 sa 24 dk" yazımı blokta var
  assert.deepEqual(codes([t('Uyku ortalaman 6,5 saat.', num('sleep'))]), ['number_mismatch']);
  // Başka bloğun sayısı: HRV bloğuna dayanıp nabız değeri yazmak.
  assert.deepEqual(codes([t('Dinlenik nabzın 52 atım/dk.', num('hrv'))]), ['number_mismatch']);
  const r = auditResponse([t('HRV ortalaman 48 ms, bandın 50–63 ms.', num('hrv'))], layout);
  assert.deepEqual(r.problems, [{ code: 'number_mismatch', sentence: 0, detail: '63' }]);
});

test('binlik ayırıcı iki yazımla da kabul edilir', () => {
  assert.deepEqual(codes([t('Son 7 günün yükü 2.450 AU.', num('load'))]), []);
  assert.deepEqual(codes([t('Son 7 günün yükü 2450 AU.', num('load'))]), []);
});

test('sayılı cümle günün sayılarından alıntı yapmazsa reddedilir (kaynaktan sayı alınmaz)', () => {
  assert.deepEqual(codes([t('Sporcular için 7 saatin altı kısa uyku sayılır.', [src('plews-2013')])]), ['number_uncited']);
  assert.deepEqual(codes([t('HRV ortalaman 48 ms.')]), ['number_uncited']);
});

test('öneri kaynaksızsa reddedilir; yalnız günün sayılarına dayanmak yetmez', () => {
  assert.deepEqual(codes([t('Uykun kısa, bu akşam erken yat.', num('sleep'))]), ['advice_without_source']);
  assert.deepEqual(codes([t('Bugün yoğunluğu azaltmalısın.')]), ['advice_without_source']);
});

test('alıntısız uzun cümle reddedilir; kısa geçiş cümlesi serbest', () => {
  assert.deepEqual(codes([t('Genel tabloya bakınca bugün vücudun dünkünden biraz daha yorgun görünüyor ve sabah hissin de bunu destekliyor.')]), [
    'uncited_sentence',
  ]);
  assert.deepEqual(codes([t('Bugünün kısa özeti aşağıda.')]), []);
});

test('tahmin bloğuna dayanan cümle "tahmin" demezse reddedilir; önceki cümlede anılması yeter', () => {
  assert.deepEqual(codes([t('Bölge yükün patellar tendonda son 48 saatte 960 AU.', num('regions.0'))]), ['estimate_unlabeled']);
  assert.deepEqual(
    codes([t('Aşağıdaki bölge yükü bir tahmindir. '), t('Patellar tendonda son 48 saatte 960 AU.', num('regions.0'))]),
    [],
  );
});

test('geçersiz alıntı: olmayan belge, günün sayılarında yanlış konum türü veya aralık', () => {
  assert.deepEqual(codes([t('Kısa özet.', [{ type: 'char_location', document_index: 999 }])]), ['invalid_citation']);
  assert.deepEqual(codes([t('Kısa özet.', [{ type: 'char_location', document_index: 0 }])]), ['invalid_citation']);
  const n = numbers.blocks.length;
  assert.deepEqual(codes([t('Kısa özet.', [{ type: 'content_block_location', document_index: 0, start_block_index: 0, end_block_index: n + 1 }])]), [
    'invalid_citation',
  ]);
});

test('boş yanıt ve "â" reddedilir', () => {
  assert.deepEqual(codes([]), ['empty']);
  assert.deepEqual(codes([{ type: 'thinking' }, t('   ')]), ['empty']);
  assert.deepEqual(codes([t('Hala dinç görünüyorsun.'), t(' Hâlâ öyle.')]), ['forbidden_text']);
});

test('alıntının kapsadığı birden çok blok birlikte sayılır', () => {
  const hrv = numbers.blocks.findIndex((b) => b.id === 'hrv');
  const span: ResponseCitation = { type: 'content_block_location', document_index: 0, start_block_index: hrv, end_block_index: hrv + 2 };
  assert.deepEqual(codes([t('HRV ortalaman 48 ms, dinlenik nabzın 52 atım/dk.', [span])]), []);
});

test('alıntı ayrı boş blokta gelirse önündeki cümleye bağlanır (Sonnet 5.5, 2026-10-09 ilk gerçek yanıt)', () => {
  // Gerçek yanıtın yapısı (sentetik metinle): cümle alıntısız blok, alıntılar hemen ardından metni boş blok.
  const content = [
    t('Günün durumu Kontrollü.'),
    t('', num('status')),
    t(' HRV ortalaman 48 ms ile bandının altında.'),
    t('', num('hrv')),
    t(' HRV tek gece yerine ortalamayla okunmalı.'),
    t('', [src('plews-2013')]),
  ];
  const a = auditResponse(content, layout);
  assert.deepEqual(a.problems, []);
  assert.deepEqual(
    a.sentences.map((s) => [s.numbers, s.sources]),
    [
      [['status'], []],
      [['hrv'], []],
      [[], ['plews-2013']],
    ],
  );
});

test('boş alıntı bloğu sonraki cümleye taşınmaz: alıntısız cümle yine yakalanır', () => {
  const content = [t('HRV ortalaman 48 ms ile bandının altında.'), t('', num('hrv')), t(' Uyku ortalaman 6,4 saat.')];
  assert.deepEqual(codes(content), ['number_uncited']);
});

test('"işaretlenmedi" yorum sayılmaz, "işaret ediyor" sayılır', () => {
  assert.equal(isAdviceOrInterpretation('Bugün maç günü işaretlenmedi.'), false);
  assert.equal(isAdviceOrInterpretation('Bu düşüş birikmiş yüke işaret ediyor.'), true);
});

// --- Kısmi kabul (karar 0034) ---

const salvage = (content: ResponseBlock[]) => {
  const a = auditResponse(content, layout);
  return { a, shown: salvageAudit(a, layout) };
};
const good = [
  t('Günün durumu Kontrollü.', num('status')),
  t(' HRV ortalaman 48 ms ile bandının altında.', num('hrv')),
  t(' Uyku ortalaman 6,4 saat.', num('sleep')),
];

test('kısmi kabul: dayanaksız öneri atılır, kalan denetlenmiş cümleler gösterilir', () => {
  const { a, shown } = salvage([...good, t(' Bugün yüklenmeyi hafiflet.')]);
  assert.equal(a.ok, false);
  assert.deepEqual(shown, [0, 1, 2]);
});

test('kısmi kabul: alıntısız kopya atılır, alıntılı asıl kalır', () => {
  const { shown } = salvage([t('Günün durumu Kontrollü. '), t('Günün durumu Kontrollü.', num('status')), ...good.slice(1)]);
  assert.deepEqual(shown, [1, 2, 3]);
});

test('kısmi kabul yok: durum cümlesi geçmezse ya da üç cümleden az kalırsa', () => {
  assert.equal(salvage([t('Günün durumu Kontrollü, HRV 49 ms.', num('status')), ...good.slice(1), t(' Ek bir 5 sayı.', num('sleep'))]).shown, null);
  assert.equal(salvage([...good.slice(0, 2), t(' Bugün yüklenmeyi hafiflet.')]).shown, null);
});

test('kısmi kabul: atılan cümleyle "tahmin" etiketini kaybeden tahmin cümlesi de atılır', () => {
  const ratio = numbers.blocks.find((b) => b.id === 'load.ratio')!;
  const value = ratio.text.match(/\d+,\d+/)![0];
  const { a, shown } = salvage([
    ...good,
    t(' Yük oranı bir tahmin ve 99 kat.', num('load.ratio')),
    t(` Oran ${value}.`, num('load.ratio')),
  ]);
  assert.deepEqual(a.problems.map((p) => [p.code, p.sentence]), [['number_mismatch', 3]]);
  assert.deepEqual(shown, [0, 1, 2]);
});

test('kısmi kabul yok: yanıt düzeyinde geçersiz alıntı', () => {
  const bad: ResponseCitation = { type: 'content_block_location', document_index: 99, start_block_index: 0, end_block_index: 1 };
  assert.equal(salvage([...good, t(' Ek.', [bad])]).shown, null);
});
