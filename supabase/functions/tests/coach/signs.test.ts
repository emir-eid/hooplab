// Gece işaretleri koçta (karar 0039): şema, belge cümlesi, dikkat seçimi ve kodla yönlendirme. Sentetik değerler.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { routingNotes } from '../../_shared/coach/contract.ts';
import { numbersBlocks } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import type { Kb } from '../../_shared/coach/kb.ts';
import { attentionMetrics, parseSnapshot, snapshotRuleIds, type CoachSnapshot } from '../../_shared/coach/snapshot.ts';
import { asRequestBody, fullSnapshot } from './fixtures.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const withSigns = (signs: NonNullable<CoachSnapshot['signs']>): CoachSnapshot => ({ ...fullSnapshot(), signs });
const signsText = (s: CoachSnapshot) => numbersBlocks(s, kb).find((b) => b.id === 'signs');

test('şema: işaretler kabul edilir; bilinmeyen alan ve boolean olmayan değer reddedilir', () => {
  const ok = parseSnapshot(asRequestBody(withSigns({ rhrHigh: true, spo2Low: null, skinTempHigh: false })));
  assert.ok(ok.ok, ok.ok ? '' : ok.errors.join('\n'));
  assert.deepEqual(ok.snapshot.signs, { rhrHigh: true, spo2Low: null, skinTempHigh: false });

  const extra = parseSnapshot(asRequestBody({ ...withSigns({ rhrHigh: true, spo2Low: null, skinTempHigh: null }), signs: { rhrHigh: true, spo2Low: null, skinTempHigh: null, bpm: 58 } }));
  assert.equal(extra.ok, false);
  const wrong = parseSnapshot(asRequestBody({ ...fullSnapshot(), signs: { rhrHigh: 'evet', spo2Low: null, skinTempHigh: null } }));
  assert.equal(wrong.ok, false);
});

test('belge: çıkan işaretler kural değerleriyle, tahmin ve tanı değil; çıkmayınca "not yok"', () => {
  const block = signsText(withSigns({ rhrHigh: true, spo2Low: true, skinTempHigh: true }))!;
  assert.equal(block.estimate, true);
  assert.match(block.text, /^Gece işaretleri \(tahmin, tanı değil\): /);
  assert.match(block.text, /son 2 gece dinlenik nabız önceki 28 günün medyanının 4 atım\/dk veya daha fazla üstünde/);
  assert.match(block.text, /son 3 gecenin en az 2'sinde gece SpO2 ortalaması %93,5'in altında ya da kişisel medyanın 3 puan/);
  assert.match(block.text, /son 2 gece cilt sıcaklığı kişisel tabanın 0,3 °C veya daha fazla üstünde/);
  assert.match(block.text, /antrenmana çıkmadan doktora danışılır\. Günün durumuna girmez\.$/);

  const one = signsText(withSigns({ rhrHigh: false, spo2Low: null, skinTempHigh: true }))!;
  assert.doesNotMatch(one.text, /nabız|SpO2 ortalaması/);
  assert.match(signsText(withSigns({ rhrHigh: false, spo2Low: false, skinTempHigh: null }))!.text, /not yok\.$/);
  assert.equal(signsText(fullSnapshot()), undefined);
});

test('dikkat seçimi ve kurallar: yalnız işaret çıkınca kaynakları gider', () => {
  assert.ok(attentionMetrics(withSigns({ rhrHigh: null, spo2Low: true, skinTempHigh: false })).includes('signs'));
  assert.ok(!attentionMetrics(withSigns({ rhrHigh: false, spo2Low: false, skinTempHigh: null })).includes('signs'));
  const ids = snapshotRuleIds(withSigns({ rhrHigh: true, spo2Low: null, skinTempHigh: null }));
  for (const id of ['gece-nabzi-yuksek', 'gece-spo2-dusuk', 'cilt-sicakligi-yuksek', 'hastalik-isareti-yonlendirme']) assert.ok(ids.includes(id), id);
});

test('yönlendirme: herhangi bir işaret çıkınca tek not, solunum notundan sonra', () => {
  assert.deepEqual(routingNotes(withSigns({ rhrHigh: false, spo2Low: null, skinTempHigh: false })), []);
  assert.deepEqual(routingNotes(withSigns({ rhrHigh: null, spo2Low: null, skinTempHigh: true })), ['illness_signs']);
  const both = withSigns({ rhrHigh: true, spo2Low: false, skinTempHigh: false });
  both.respiration = { ...both.respiration!, nightHigh: true };
  assert.deepEqual(routingNotes(both), ['respiration_high', 'illness_signs']);
});
