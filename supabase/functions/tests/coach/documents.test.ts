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
    'Uyku: son 7 gecenin ortalaması 6,4 saat (6 sa 24 dk). Son gece 7,2 saat (7 sa 15 dk). Ortalama 7 saatin altında: uyku kısa.',
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

test('maç çevresi bloğu (karar 0046): bugünün zamanlaması, yarın ve dün; uyku kısalması kural değerinden', () => {
  const brief = (startTime: string | null) => ({ startTime, venue: 'away' as const });
  const s: CoachSnapshot = {
    ...fullSnapshot(),
    matchDay: true,
    match: {
      yesterday: brief('20:30'),
      today: brief('19:00'),
      tomorrow: null,
      plan: { meal: ['15:00', '16:00'], mealCarbsG: [80, 240], fluid: ['15:00', '17:00'], fluidMl: [400, 560], nap: ['12:30', '16:50'], postCarbsGPerHour: 80 },
    },
  };
  const day = numbersBlocks(s, kb)[0]!.text;
  assert.match(day, /bugün maç var \(başlama 19:00, deplasman\)/);
  assert.match(day, /ana öğün 15:00–16:00 arası, 80–240 g karbonhidrat/);
  assert.match(day, /Sıvı 15:00–17:00 arası 400–560 mL/);
  assert.match(day, /Şekerleme penceresi 12:30–16:50/);
  assert.match(day, /Maçtan sonra 4 saat, saatte ~80 g/);
  assert.match(day, /Akşam maçı gecesi için grup ortalaması uyku kısalması ~80 dakika/);
  const md1: CoachSnapshot = { ...fullSnapshot(), matchDay: false, match: { yesterday: brief('13:00'), today: null, tomorrow: brief(null), plan: null } };
  const t = numbersBlocks(md1, kb)[0]!.text;
  assert.match(t, /bugün maç yok/);
  assert.match(t, /Yarın maç var \(başlama saati girilmedi, deplasman\)/);
  assert.match(t, /Gündüz maçı gecesi için grup ortalaması uyku kısalması ~20 dakika/);
  // Kurallar: bugün maç (öğün, şekerleme, sonrası), dün maç (sonrası), yarın maç (önceki gün)
  assert.deepEqual(snapshotRuleIds(s, []), ['mac-gunu', 'mac-oncesi-ogun', 'mac-gunu-sekerleme', 'mac-sonrasi']);
  assert.deepEqual(snapshotRuleIds(md1, []), ['mac-oncesi-gun', 'mac-sonrasi']);
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

test('durum: uyku nabzı tek başına neden değil, not; Toparlan\'da HRV ile birlikte neden (karar 0041)', () => {
  const ready: CoachSnapshot = { ...fullSnapshot(), status: { level: 'ready', signals: ['rhr_high'] } };
  assert.equal(text(ready, 'status'), 'Günün durumu: Hazır. Bandın dışında bir işaret yok. Not: uyku nabzı bandın üstünde; tek başına durumu değiştirmez.');
  const caution: CoachSnapshot = { ...fullSnapshot(), status: { level: 'caution', signals: ['hrv_high', 'rhr_high'] } };
  assert.equal(text(caution, 'status'), 'Günün durumu: Kontrollü. Nedeni: HRV bandın üstünde. Not: uyku nabzı bandın üstünde; tek başına durumu değiştirmez.');
  const recover: CoachSnapshot = { ...fullSnapshot(), status: { level: 'recover', signals: ['hrv_low', 'rhr_high'] } };
  assert.equal(text(recover, 'status'), 'Günün durumu: Toparlan. Nedeni: HRV bandın altında, uyku nabzı bandın üstünde.');
});

test('uyku saati aşağı kesilir: 7 saatin hemen altı "7,0" yazıp kısa denmez', () => {
  const s = fullSnapshot();
  const sleep = { ...s.sleep!, rollingHours: 6.996, short: true };
  assert.match(text({ ...s, sleep }, 'sleep') ?? '', /ortalaması 6,9 saat \(6 sa 59 dk\)\. .*uyku kısa\./);
});

test('seyahat bloğu (karar 0047): evre, saat farkı, uyum tahmini kural değerinden; tahmin işaretli', () => {
  const base = { offsetHours: 7, direction: 'east' as const, jetLag: true, daysUntil: null, dayAway: 3, totalDays: 7, remainingDays: 5, firstHours: true, eastDelayHint: false };
  const s: CoachSnapshot = { ...fullSnapshot(), travel: { ...base, phase: 'away' } };
  const block = numbersBlocks(s, kb).find((b) => b.id === 'travel')!;
  assert.equal(block.estimate, true);
  assert.match(block.text, /Seyahatin 3\. günü, saat farkı \+7 saat \(doğu\)/);
  assert.match(block.text, /günde ~1 saat/);
  assert.match(block.text, /Tahmini kalan uyum ~5 gün/);
  assert.match(block.text, /ilk 72 saat/);
  assert.deepEqual(snapshotRuleIds(s, []), ['jet-lag-uyum', 'jet-lag-varis']);
  const day0: CoachSnapshot = { ...fullSnapshot(), travel: { ...base, offsetHours: 0, direction: null, jetLag: false, dayAway: null, totalDays: null, remainingDays: null, firstHours: false, phase: 'departure' } };
  const b0 = numbersBlocks(day0, kb).find((b) => b.id === 'travel')!;
  assert.equal(b0.text, 'Seyahat: Bugün gidiş yolculuğu, saat farkı yok.');
  assert.equal(b0.estimate, false);
  assert.deepEqual(snapshotRuleIds(day0, []), ['seyahat-yorgunlugu']);
});
