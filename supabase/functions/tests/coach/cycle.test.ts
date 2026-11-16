// Koçta döngü notu (karar 0061 sıra 5): yalnız Apple · kadın tabanında; sahibinde ve diğer profillerde düşer, istem
// değişmez. Koça döngü günü ve evre takvimi gitmez, yalnız motorun notu. Veriler sentetik.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRequest, systemPrompt } from '../../_shared/coach/daily.ts';
import { numbersBlocks } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import { DEFAULT_PROFILE, forProfile, hasRule, type Kb } from '../../_shared/coach/kb.ts';
import { cycleLine, snapshotForKb } from '../../_shared/coach/profile-prompt.ts';
import { parseSnapshot, snapshotRuleIds, type CoachSnapshot } from '../../_shared/coach/snapshot.ts';
import { fullSnapshot } from './fixtures.ts';

const full: Kb = { sources: kbSources, rules: kbRules };
const owner = forProfile(full, DEFAULT_PROFILE);
const appleWoman = forProfile(full, { source: 'apple_health', sport: 'fitness', sex: 'kadin' });
const appleNoSex = forProfile(full, { source: 'apple_health', sport: 'fitness', sex: null });
const googleWoman = forProfile(full, { source: 'google_health', sport: 'fitness', sex: 'kadin' });

const withCycle = (cycle: NonNullable<CoachSnapshot['cycle']>): CoachSnapshot => ({ ...fullSnapshot(), cycle });

function sourceIds(params: ReturnType<typeof buildRequest>['params']): string[] {
  const content = params.messages[0]!.content as { type: string; title?: string }[];
  return content.filter((c) => c.type === 'document').map((c) => c.title!).slice(1);
}

test('döngü kuralları yalnız Apple · kadın tabanında', () => {
  for (const id of ['dongu-evre', 'dongu-notu', 'dongu-duzensiz']) {
    assert.ok(hasRule(appleWoman, id), id);
    assert.ok(!hasRule(owner, id), `sahibinde ${id} yok`);
    assert.ok(!hasRule(appleNoSex, id), `cinsiyet boşken ${id} yok`);
    assert.ok(!hasRule(googleWoman, id), `Google profilinde ${id} yok`);
  }
});

test('sahibi: döngü notu gönderilse de düşer; istem ve günün sayıları aynı', () => {
  const plain = buildRequest(fullSnapshot(), owner);
  const sent = buildRequest(withCycle({ note: 'compatible', weak: false }), owner);
  assert.equal(sent.params.system, systemPrompt);
  assert.deepEqual(sent.params, plain.params);
  assert.equal(snapshotForKb(withCycle({ note: 'irregular', weak: false }), owner).cycle, undefined);
  for (const kb of [appleNoSex, googleWoman]) assert.equal(snapshotForKb(withCycle({ note: 'compatible', weak: true }), kb).cycle, undefined);
});

test('Apple · kadın: döngü bloğu tahmin, istemde döngü satırı, kaynaklar seçilir; döngü günü yok', () => {
  const { params, layout } = buildRequest(withCycle({ note: 'compatible', weak: false }), appleWoman);
  const system = params.system as string;
  const lines = system.split('\n');
  const at = lines.findIndex((l) => l.startsWith('- Teşhis koyma'));
  assert.ok(at >= 0);
  assert.equal(lines[at + 1], cycleLine);
  const blocks = (layout[0] as unknown as { blocks: { id: string; text: string; estimate: boolean }[] }).blocks;
  const cycle = blocks.find((b) => b.id === 'cycle');
  assert.ok(cycle);
  assert.equal(cycle.estimate, true);
  assert.match(cycle.text, /tahmin/);
  assert.match(cycle.text, /olabilir/);
  assert.doesNotMatch(cycle.text, /\d/, 'uyumlu notta sayı yok (döngü günü gitmez)');
  const ids = sourceIds(params);
  for (const id of ['schmalenberger-2019', 'dejager-2026', 'mcnulty-2020']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('williams-2025'));

  const weak = numbersBlocks(withCycle({ note: 'compatible', weak: true }), appleWoman).find((b) => b.id === 'cycle');
  assert.match(weak!.text, /Hormonal korunma/);
  // İstem satırı koşulludur ("döngü bloğu varsa"): Apple · kadın tabanında blok yokken de durur.
  assert.ok((buildRequest(fullSnapshot(), appleWoman).params.system as string).includes(cycleLine));
});

test('düzensiz: hekim yönlendirmesi, eşik kuraldan, tahmin değil; Triad kaynağı seçilir', () => {
  const { params, layout } = buildRequest(withCycle({ note: 'irregular', weak: false }), appleWoman);
  const blocks = (layout[0] as unknown as { blocks: { id: string; text: string; estimate: boolean }[] }).blocks;
  const cycle = blocks.find((b) => b.id === 'cycle')!;
  assert.equal(cycle.estimate, false);
  assert.match(cycle.text, /35 günü aşan/);
  assert.match(cycle.text, /hekime/);
  assert.ok(sourceIds(params).includes('williams-2025'));
  assert.deepEqual(snapshotRuleIds(withCycle({ note: 'irregular', weak: false })).slice(0, 1), ['dongu-duzensiz']);
});

test('şema: döngü notu biçimi denetlenir', () => {
  const base = { ...fullSnapshot() } as Record<string, unknown>;
  assert.ok(parseSnapshot({ ...base, cycle: { note: 'compatible', weak: true } }).ok);
  assert.ok(parseSnapshot({ ...base, cycle: { note: 'irregular', weak: false } }).ok);
  for (const cycle of [
    { note: 'luteal', weak: false },
    { note: 'irregular', weak: true },
    { note: 'compatible' },
    { note: 'compatible', weak: false, cycleDay: 24 },
  ]) {
    const r = parseSnapshot({ ...base, cycle });
    assert.ok(!r.ok, JSON.stringify(cycle));
  }
});
