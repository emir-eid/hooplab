import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contrastRatio, palettes } from '@hooplab/theme';

import { bodyColors, painColor } from './body-colors.ts';

test('ağrı ölçeği uçları: 1 soluk, 10 koyu; 0 ve ölçek dışı renksiz', () => {
  const colors = bodyColors(palettes.light);
  assert.equal(painColor(colors, 1), colors.painLow);
  assert.equal(painColor(colors, 10), colors.painHigh);
  assert.equal(painColor(colors, 0), null);
  assert.equal(painColor(colors, 11), null);
  assert.equal(painColor(colors, 2.5), null);
});

test('ölçek sıralı: değer arttıkça zeminden uzaklaşır (iki temada)', () => {
  for (const palette of [palettes.light, palettes.dark]) {
    const colors = bodyColors(palette);
    let previous = 0;
    for (let pain = 1; pain <= 10; pain++) {
      const color = painColor(colors, pain);
      assert.ok(color);
      const ratio = contrastRatio(color, colors.skin);
      assert.ok(ratio >= previous - 0.01, `${palette.scheme} ${pain}`);
      previous = ratio;
    }
  }
});

test('çalışan bölge rengi pedden ayrışır ve kırmızı ölçekten değil (iki temada)', () => {
  for (const palette of [palettes.light, palettes.dark]) {
    const colors = bodyColors(palette);
    assert.ok(contrastRatio(colors.worked, colors.pad) >= 1.6, `${palette.scheme} ped`);
    assert.ok(contrastRatio(colors.worked, colors.background) >= 3, `${palette.scheme} zemin`);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(colors.worked.slice(i, i + 2), 16));
    assert.ok(Math.max(r!, g!, b!) - Math.min(r!, g!, b!) < 24, `${palette.scheme} nötr: ${colors.worked}`);
  }
});
