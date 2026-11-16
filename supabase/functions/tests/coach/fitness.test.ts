// Koçun fitness profili (karar 0061, sıra 4a): taban spor profiline göre süzülür; maç kuralları ve yük artış notu
// yok, ölçümün kuralı -fitness sürümüne çevrilir, istemde basketbol ve maç yönergeleri yok, durum dili temkinli.
// Sahibinin istemi ve günün sayıları değişmez. Veriler sentetik.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classifierPrompt, askSystemPrompt, buildAskRequest } from '../../_shared/coach/ask.ts';
import { buildRequest, systemPrompt } from '../../_shared/coach/daily.ts';
import { numbersBlocks, ruleNumber } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import { DEFAULT_PROFILE, forProfile, isFitnessKb, profileRuleId, type Kb } from '../../_shared/coach/kb.ts';
import { promptForKb, snapshotForKb } from '../../_shared/coach/profile-prompt.ts';
import type { CoachSnapshot } from '../../_shared/coach/snapshot.ts';
import { weeklySystemPrompt } from '../../_shared/coach/weekly.ts';
import { fullSnapshot } from './fixtures.ts';

const full: Kb = { sources: kbSources, rules: kbRules };
const owner = forProfile(full, DEFAULT_PROFILE);
const fitness = forProfile(full, { source: 'google_health', sport: 'fitness', sex: null });
const appleFitness = forProfile(full, { source: 'apple_health', sport: 'fitness', sex: 'kadin' });

const brief = (startTime: string | null) => ({ startTime, venue: 'home' as const });
/** Eski bir uygulama sürümünün gönderebileceği maç ve yük notu (fitness'ta uygulama göndermez). */
function matchSnapshot(): CoachSnapshot {
  const s = fullSnapshot();
  return {
    ...s,
    matchDay: true,
    match: { yesterday: null, today: brief('19:00'), tomorrow: brief(null), plan: null },
    load: { ...s.load!, spike: true },
  };
}

test('fitness tabanı: maç kuralları yok, sürümü olan kurallar -fitness; sahibinde ana kurallar', () => {
  assert.equal(isFitnessKb(owner), false);
  assert.equal(isFitnessKb(full), false);
  assert.equal(isFitnessKb(fitness), true);
  assert.equal(isFitnessKb(appleFitness), true);
  const ids = new Set(fitness.rules.map((r) => r.id));
  for (const id of ['mac-gunu', 'mac-oncesi-gun', 'mac-oncesi-ogun', 'mac-gunu-sekerleme', 'mac-sonrasi']) assert.ok(!ids.has(id), id);
  const variants = ['uyku-kisa', 'seans-rpe-olcek', 'yuk-artis-notu', 'karbonhidrat-gun-tipi', 'bolge-icerik-etiketleri', 'bolge-esleme', 'takviye-kanit', 'seyahat-yorgunlugu'];
  for (const id of variants) {
    assert.equal(profileRuleId(fitness, id), `${id}-fitness`, id);
    assert.equal(profileRuleId(owner, id), id, id);
  }
  assert.ok(ids.has('gunun-durumu-dil-fitness'));
  assert.ok(!owner.rules.some((r) => r.id.endsWith('-fitness')));
  // Apple + fitness: kaynak sürümü ve spor sürümü ayrı ailelerde, ikisi birlikte seçilir.
  assert.equal(profileRuleId(appleFitness, 'gunun-durumu'), 'gunun-durumu-apple');
  assert.equal(profileRuleId(appleFitness, 'uyku-kisa'), 'uyku-kisa-fitness');
});

test('fitness tabanı: basketbola özgü kaynaklar ve yalnız maç kurallarının kaynakları girmez; yeni kaynaklar girer', () => {
  const src = new Set(fitness.sources.map((s) => s.id));
  for (const id of ['liu-2026', 'walsh-2021']) assert.ok(src.has(id) === fitness.rules.some((r) => r.sources.includes(id)), id);
  assert.ok(!src.has('liu-2026'), 'basketbolculardaki kafein çalışması');
  for (const id of ['watson-2015', 'hirshkowitz-2015', 'lea-2022', 'day-2004', 'buist-2007', 'nielsen-2014', 'medellin-ruiz-2020']) assert.ok(src.has(id), id);
  const ownerSrc = new Set(owner.sources.map((s) => s.id));
  for (const id of ['watson-2015', 'lea-2022', 'buist-2007', 'medellin-ruiz-2020']) assert.ok(!ownerSrc.has(id), id);
  for (const rule of fitness.rules) for (const id of rule.sources) assert.ok(src.has(id), `${rule.id} → ${id}`);
});

test('kural değerleri profile düşen sürümden okunur', () => {
  assert.equal(ruleNumber(fitness, 'uyku-kisa', 'min_hours'), 7);
  assert.equal(ruleNumber(fitness, 'karbonhidrat-gun-tipi', 'high_when_minutes_at_least'), 120);
  assert.equal(ruleNumber(owner, 'karbonhidrat-gun-tipi', 'high_when_minutes_at_least'), 180);
});

test('istemler: sahibinde bayt bayt aynı; fitness\'ta basketbol ve maç yönergesi yok, durum dili temkinli', () => {
  for (const p of [systemPrompt, weeklySystemPrompt, askSystemPrompt, classifierPrompt]) {
    assert.equal(promptForKb(p, owner), p);
    assert.equal(promptForKb(p, full), p);
    const f = promptForKb(p, fitness, { statusTone: p === systemPrompt || p === weeklySystemPrompt });
    assert.notEqual(f, p);
    assert.ok(!/basketbol/i.test(f), 'basketbol geçmez');
    assert.ok(!f.includes('- Maç günüyse') && !f.includes('- Yarın maç varsa') && !f.includes('maç hazırlığı'));
  }
  const daily = promptForKb(systemPrompt, fitness, { statusTone: true });
  assert.match(daily, /bir antrenman talimatı gibi sunma/);
  assert.ok(!promptForKb(askSystemPrompt, fitness).includes('antrenman talimatı'));
});

test('anlık değerler: fitness\'ta maç ve yük notu düşer; sahibinde aynı nesne', () => {
  const s = matchSnapshot();
  assert.equal(snapshotForKb(s, owner), s);
  const f = snapshotForKb(s, fitness);
  assert.equal(f.matchDay, false);
  assert.equal('match' in f, false);
  assert.equal(f.load?.spike, false);
  assert.equal(s.load?.spike, true, 'girdi değişmez');
});

test('fitness günlük istek: maç gelse de kurulur; gün bloğu maçsız, kaynaklarda durum dili, istem fitness', () => {
  const { params, layout } = buildRequest(matchSnapshot(), fitness);
  assert.equal(typeof params.system, 'string');
  assert.ok(!String(params.system).includes('basketbol'));
  const numbers = layout.find((e) => e.kind === 'numbers');
  assert.ok(numbers && numbers.kind === 'numbers');
  assert.equal(numbers.blocks[0]!.text, 'Gün: bu profilde maç ve maç çevresi izlenmez.');
  assert.ok(!numbers.blocks.some((b) => /belirgin üstünde/.test(b.text)), 'yük artış notu yok');
  const sourceIds = layout.filter((e) => e.kind === 'source').map((e) => (e.kind === 'source' ? e.sourceId : ''));
  assert.ok(sourceIds.includes('medellin-ruiz-2020'));
  for (const id of ['collins-2021', 'fradkin-2010']) assert.ok(!sourceIds.includes(id), id);
});

test('sahibinin günlük isteği: maç bloğu ve istem değişmedi', () => {
  const s = matchSnapshot();
  const { params, layout } = buildRequest(s, owner);
  assert.equal(params.system, systemPrompt);
  const numbers = layout.find((e) => e.kind === 'numbers');
  assert.ok(numbers && numbers.kind === 'numbers');
  assert.deepEqual(numbers.blocks, numbersBlocks(s, owner));
  assert.match(numbers.blocks[0]!.text, /bugün maç var/);
});

test('fitness soru-cevap: günün sayıları maçsız, istem fitness', () => {
  const { params, layout } = buildAskRequest('Bugün ne yemeliyim?', matchSnapshot(), fitness);
  assert.ok(!String(params.system).includes('basketbol'));
  const numbers = layout.find((e) => e.kind === 'numbers');
  assert.ok(numbers && numbers.kind === 'numbers');
  assert.equal(numbers.blocks[0]!.text, 'Gün: bu profilde maç ve maç çevresi izlenmez.');
});
