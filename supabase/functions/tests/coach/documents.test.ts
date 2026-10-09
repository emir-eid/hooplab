import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dailyDocuments, MissingRuleValueError, numbersBlocks, numbersTitle } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import { selectForRules, type Kb } from '../../_shared/coach/kb.ts';
import { snapshotRuleIds, type CoachSnapshot } from '../../_shared/coach/snapshot.ts';
import { fullSnapshot } from './fixtures.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const text = (snapshot: CoachSnapshot, id: string) => numbersBlocks(snapshot, kb).find((b) => b.id === id)?.text;

test('bloklar: önce maç günü, sonra ölçümler sabit sırayla; tahminler işaretli', () => {
  const blocks = numbersBlocks(fullSnapshot(), kb);
  assert.deepEqual(
    blocks.map((b) => b.id),
    ['day', 'status', 'hrv', 'rhr', 'sleep', 'respiration', 'checkin', 'load', 'load.ratio', 'regions.0', 'regions.1', 'pain.0', 'nutrition', 'nutrition.intake', 'fluid', 'sweatTest'],
  );
  assert.deepEqual(
    blocks.filter((b) => b.estimate).map((b) => b.id),
    ['load.ratio', 'regions.0', 'regions.1', 'pain.0', 'nutrition.intake'],
  );
  for (const b of blocks.filter((x) => x.estimate)) assert.match(b.text, /tahmin/i, b.id);
});

test('sayılar uygulamadaki gibi yuvarlanır; eşikler kural değerlerinden', () => {
  const s = fullSnapshot();
  assert.equal(
    text(s, 'hrv'),
    'HRV (derin uyku, RMSSD): son 7 günün ortalaması 48 ms; son gece 45 ms. Kişisel bant (önceki 28 günün ortalaması ± 0,5 SD): 50–62 ms; ortalama bandın altında.',
  );
  assert.equal(
    text(s, 'sleep'),
    'Uyku: son 7 gecenin ortalaması 6,4 saat (6 sa 24 dk). Son gece 7,3 saat (7 sa 15 dk). Ortalama 7 saatin altında: uyku kısa.',
  );
  assert.equal(
    text(s, 'checkin'),
    'Sabah check-in toplamı: 16 / 25. Önceki 28 günün ortalaması 19,4; bugün −1,3 SD. Alıştığından belirgin düşük (−1 SD veya altı); en çok düşen madde: yorgunluk.',
  );
  assert.equal(
    text(s, 'load'),
    'Antrenman yükü (seans RPE × dakika): son 7 gün 2.450 AU, önceki 7 gün 1.980 AU (+%24). Son 4 haftanın haftalık ortalaması 2.106 AU. Monotonluk 1,4, gerilim 3.479 AU (eşiksiz).',
  );
  assert.equal(text(s, 'load.ratio'), 'Alıştığın seviyeye göre oran (tahmin, yalnız bağlam, sakatlık tahmini değil): 1,2×.');
  assert.equal(
    text(s, 'pain.0'),
    'Ağrı izleme (tahmin, tanı değil): Sol patellar tendon, bu sabah ağrı 3/10 (dün 3/10). Bölge dün yüklendi ve ağrı bugün azalmadı.',
  );
  assert.equal(
    text(s, 'nutrition'),
    'Beslenme hedefi (gün tipi: antrenman): karbonhidrat 5–7 g/kg (430–602 g), protein 1,2–2,0 g/kg (103–172 g).',
  );
  assert.equal(
    text(s, 'sweatTest'),
    'Bugünkü ter testi: ter kaybı 1,4 L, ter oranı 0,9 L/saat, seans boyunca kilo değişimi −%1,1. Sonraki seansa 4 saatten az varsa 1,4–2,1 L sıvı.',
  );
});

test('notlar: oran artışı, solunum tek gece, ağrı yüksek, ter kaybı ve kilo artışı', () => {
  const s = fullSnapshot();
  s.load = { ...s.load!, ratio: 1.62, spike: true };
  s.respiration = { ...s.respiration!, nightHigh: true };
  s.pain = [{ region: 'lower_back', side: 'center', pain: 7, yesterdayPain: null, reasons: ['high'] }];
  s.sweatTest = { ...s.sweatTest!, changePercent: -2.4, lossNote: true, fluidTargetL: null };
  assert.match(text(s, 'load.ratio')!, /1,6×\. Oran 1,5 veya üstünde/);
  assert.match(text(s, 'respiration')!, /ortalamasının 3 nefes\/dk veya daha fazla üstünde\. Bu bir tanı değil/);
  assert.equal(text(s, 'pain.0'), "Ağrı izleme (tahmin, tanı değil): Bel, bu sabah ağrı 7/10. Sabah ağrısı 5/10'un üstünde.");
  assert.match(text(s, 'sweatTest')!, /−%2,4\. Kayıp seans öncesi kilonun %2'si veya üstünde\.$/);

  s.sweatTest = { ...s.sweatTest, changePercent: 0.6, lossNote: false, gainNote: true };
  assert.match(text(s, 'sweatTest')!, /\+%0,6\. Seansta kilo arttı: gerekenden fazla içilmiş olabilir\.$/);
});

test('eksik değerler: bant yok, kilo yok, öğün yok, oran yok', () => {
  const s = fullSnapshot();
  s.hrv = { rolling: null, lastNight: null, band: null, position: null };
  s.status = { level: 'insufficient', signals: [] };
  s.nutrition = { ...s.nutrition!, carbsG: null, proteinG: null, meals: 0, intakeCarbsG: null, intakeProteinG: null, carbsPosition: null, proteinPosition: null };
  s.load = { ...s.load!, ratio: null };
  s.checkin = { total: 20, baselineMean: null, z: null, low: false, topDrop: null };
  assert.equal(text(s, 'hrv'), 'HRV (derin uyku, RMSSD): son 7 günün ortalaması hesaplanamadı (yeterli gece yok). Kişisel bant henüz oluşmadı (yeterli gece yok).');
  assert.equal(text(s, 'status'), 'Günün durumu: Bant oluşuyor. Kişisel bant için henüz yeterli gece yok.');
  assert.match(text(s, 'nutrition')!, /Sabah kilosu girilmediği için gram hedefi yok\.$/);
  assert.equal(text(s, 'nutrition.intake'), 'Bugün öğün kaydı yok.');
  assert.equal(numbersBlocks(s, kb).find((b) => b.id === 'nutrition.intake')?.estimate, false, 'kayıt yokluğu tahmin değil');
  assert.equal(text(s, 'load.ratio'), 'Alıştığın seviyeye göre oran (tahmin): 28 günlük kayıt geçmişi olmadan hesaplanmaz.');
  assert.equal(text(s, 'checkin'), 'Sabah check-in toplamı: 20 / 25. Kişisel kıyas için henüz yeterli check-in yok.');
});

test('maç günü bloğu', () => {
  const s = { ...fullSnapshot(), matchDay: true };
  assert.equal(numbersBlocks(s, kb)[0]!.text, 'Maç günü: bugün maç var.');
});

test('metinde "â" yok ve tarih yok (tarihteki sayılar modele izin olmasın)', () => {
  for (const b of numbersBlocks(fullSnapshot(), kb)) {
    assert.doesNotMatch(b.text, /â/, b.id);
    assert.doesNotMatch(b.text, /2026/, b.id);
  }
});

test('kural değeri yoksa hata: eşik sessizce uydurulmaz', () => {
  const broken: Kb = { sources: kb.sources, rules: kb.rules.map((r) => (r.id === 'uyku-kisa' ? { ...r, value: { rolling_nights: 7 } } : r)) };
  assert.throws(() => numbersBlocks(fullSnapshot(), broken), MissingRuleValueError);
});

test('belgeler: günün sayıları 0. belge, kaynaklar seçim sırasıyla; düzen indislerle aynı', () => {
  const snapshot = fullSnapshot();
  const { sources } = selectForRules(kb, snapshotRuleIds(snapshot));
  const { documents, layout } = dailyDocuments(snapshot, kb, sources);
  assert.equal(documents.length, sources.length + 1);
  assert.equal(layout.length, documents.length);

  const first = documents[0]!;
  assert.equal(first.title, numbersTitle);
  assert.equal(first.source.type, 'content');
  const entry = layout[0]!;
  assert.equal(entry.kind, 'numbers');
  if (first.source.type === 'content' && entry.kind === 'numbers') {
    assert.deepEqual(first.source.content.map((c) => c.text), entry.blocks.map((b) => b.text));
  }

  sources.forEach((source, i) => {
    const doc = documents[i + 1]!;
    assert.equal(doc.title, source.id);
    assert.deepEqual(layout[i + 1], { kind: 'source', sourceId: source.id });
    assert.equal(doc.source.type, 'text');
    if (doc.source.type === 'text') assert.equal(doc.source.data, source.summary);
    assert.deepEqual(doc.citations, { enabled: true });
  });
});
