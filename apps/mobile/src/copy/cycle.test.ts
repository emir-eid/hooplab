// Döngü notu metinleri (karar 0061 sıra 5): "olabilir" dili, korunmada zayıf, düzensizde yalnız hekim yönlendirmesi;
// antrenman önerisi yok, tanı yok.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cycleIrregularRule } from '@hooplab/engine';

import { cycleNoteText } from './cycle.ts';

test('uyumlu not: işaretleri adlandırır, tahmin ve olabilir der, durumun değişmediğini söyler', () => {
  const both = cycleNoteText({ kind: 'compatible', signals: ['hrv_low', 'rhr_high'], weak: false });
  assert.match(both, /^Adet öncesi günlerdesin \(tahmin\)\. HRV'nin aralığının altına inmesi ve uyku nabzının/);
  assert.match(both, /olabilir/);
  assert.match(both, /Durum ve aralığın değişmez/);
  const one = cycleNoteText({ kind: 'compatible', signals: ['rhr_high'], weak: false });
  assert.match(one, /^Adet öncesi günlerdesin \(tahmin\)\. Uyku nabzının aralığının üstüne çıkması döngüyle uyumlu olabilir/);
});

test('korunmada not zayıflar', () => {
  const weak = cycleNoteText({ kind: 'compatible', signals: ['hrv_low'], weak: true });
  assert.match(weak, /hormonal korunma kullanırken bu etki genelde daha az belirgindir/);
});

test('düzensiz: eşik motordan, hekime yönlendirir, yorum ve öneri yok', () => {
  const t = cycleNoteText({ kind: 'irregular' });
  assert.ok(t.includes(`${cycleIrregularRule.cycleDaysAbove} günü aşan`));
  assert.match(t, /hekime danış/);
  assert.match(t, /yorum yapmaz/);
});

test('hiçbir metin antrenman, beslenme ya da takviye önermez; "â" yok', () => {
  const all = [
    cycleNoteText({ kind: 'compatible', signals: ['hrv_low'], weak: false }),
    cycleNoteText({ kind: 'compatible', signals: ['hrv_low'], weak: true }),
    cycleNoteText({ kind: 'irregular' }),
  ].join(' ');
  assert.doesNotMatch(all, /antrenman|yüklen|dinlen|karbonhidrat|protein|demir|takviye/i);
  assert.ok(!all.includes('â'));
});
