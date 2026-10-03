// Renk yardımcıları, erişilebilirlik eşikleri, görünüm tercihleri ve display fontu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  contrastRatio,
  dayStates,
  defaultAppearance,
  isHex,
  mix,
  over,
  palettes,
  parseHex,
  resolveScheme,
  shouldAnimateAura,
  toHex,
  withAlpha,
  type Hex,
  type Palette,
} from '../src/index.ts';

// ---------------------------------------------------------------- yardımcılar

test('parseHex / toHex gidiş-dönüş', () => {
  assert.deepEqual(parseHex('#15171A'), { r: 21, g: 23, b: 26, a: 1 });
  assert.equal(parseHex('#FFFFFFB8').a, 184 / 255);
  assert.equal(toHex(parseHex('#15171A12')), '#15171A12');
  assert.throws(() => parseHex('#fff'), /Geçersiz renk/);
  assert.throws(() => parseHex('#15171a'), /Geçersiz renk/, 'küçük harf reddedilir: tek biçim');
});

test('mix, CSS color-mix(in srgb) ile aynı', () => {
  // Beklenen değerler Chromium'un color-mix(in srgb, ...) çıktısından ölçüldü (2026-10-03):
  // #E8930C 16% + #FFFFFF → srgb(0.98557 0.93224 0.84753); #FFAE33 16% + #18191C → srgb(0.23906 0.19153 0.12424)
  assert.equal(mix('#E8930C', '#FFFFFF', 0.16), '#FBEED8');
  assert.equal(mix('#FFAE33', '#18191C', 0.16), '#3D3120');
  assert.equal(mix('#000000', '#FFFFFF', 0.5), '#808080');
  assert.throws(() => mix('#00000080', '#FFFFFF', 0.5));
});

test('withAlpha ve over', () => {
  assert.equal(withAlpha('#FFFFFF', 0.14), '#FFFFFF24');
  assert.equal(withAlpha('#0E0F11', 0), '#0E0F1100');
  assert.equal(over('#00000080', '#FFFFFF'), '#7F7F7F');
});

test('contrastRatio bilinen değerler', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
  assert.equal(contrastRatio('#767676', '#FFFFFF').toFixed(2), '4.54');
});

// ---------------------------------------------------------------- palet bütünlüğü

function colorLeaves(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === 'string' && value.startsWith('#')) out.push([path, value]);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) colorLeaves(v, `${path}.${k}`, out);
  }
  return out;
}

test('her renk #RRGGBB(AA) biçiminde; açık ve koyu aynı anahtarlara sahip', () => {
  const shape = (p: Palette) => colorLeaves(p, '').map(([k]) => k).sort();
  assert.deepEqual(shape(palettes.light), shape(palettes.dark));
  for (const scheme of ['light', 'dark'] as const) {
    for (const [path, value] of colorLeaves(palettes[scheme], scheme)) {
      assert.ok(isHex(value), `${path} = ${value}`);
    }
  }
});

// ---------------------------------------------------------------- erişilebilirlik (WCAG 2.x)
// Küçük metin 4,5:1. Grafik ve ikon 3:1. Durum dolgusu tek başına anlam taşımadığı için eşiğe bağlı değil
// (yanında her zaman metin var; README "Erişilebilirlik").

const AA_TEXT = 4.5;
const AA_GRAPHIC = 3;

for (const scheme of ['light', 'dark'] as const) {
  const p = palettes[scheme];
  const surfaces: [string, Hex][] = [['bg', p.bg], ['card', p.card], ['cardMuted', p.cardMuted]];

  test(`metin kontrastı (${scheme})`, () => {
    const fails: string[] = [];
    const check = (name: string, fg: Hex, bg: Hex, min: number) => {
      const r = contrastRatio(fg, bg);
      if (r < min) fails.push(`${name}: ${r.toFixed(2)} < ${min}`);
    };
    for (const fg of ['ink', 'inkSecondary', 'inkMuted'] as const) {
      for (const [sn, s] of surfaces) check(`${fg} / ${sn}`, p[fg], s, AA_TEXT);
    }
    check('onStrong / strong', p.onStrong, p.strong, AA_TEXT);
    check('onResult / result', p.onResult, p.result, AA_TEXT);
    check('onInk / ink', p.onInk, p.ink, AA_TEXT);
    // Hale üstündeki çip: yarı saydam beyaz, zeminle birleşmiş haliyle.
    check('ink / chip', p.ink, over(p.chip, p.bg), AA_TEXT);
    // Sekme etiketi camın üstünde (bulanıklık zemini en kötü durumda bg).
    check('inkSecondary / glass', p.inkSecondary, over(p.glass, p.bg), AA_TEXT);
    for (const s of dayStates) {
      check(`statusInk.${s} / card`, p.statusInk[s], p.card, AA_TEXT);
      check(`statusInk.${s} / cardMuted`, p.statusInk[s], p.cardMuted, AA_TEXT);
      check(`statusInk.${s} ikon / statusTint`, p.statusInk[s], p.derived.statusTint[s], AA_GRAPHIC);
    }
    assert.deepEqual(fails, []);
  });
}

// ---------------------------------------------------------------- görünüm tercihleri

test('resolveScheme', () => {
  assert.equal(resolveScheme('system', 'dark'), 'dark');
  assert.equal(resolveScheme('system', 'light'), 'light');
  assert.equal(resolveScheme('system', null), 'light');
  assert.equal(resolveScheme('system', 'unspecified'), 'light');
  assert.equal(resolveScheme('light', 'dark'), 'light');
  assert.equal(resolveScheme('dark', 'light'), 'dark');
  assert.equal(defaultAppearance.theme, 'system');
});

test('shouldAnimateAura: Hareketi Azalt her zaman kazanır', () => {
  assert.equal(shouldAnimateAura(true, false), true);
  assert.equal(shouldAnimateAura(true, true), false);
  assert.equal(shouldAnimateAura(false, false), false);
  assert.equal(defaultAppearance.animateAura, true);
});

// ---------------------------------------------------------------- display fontu

test('opsz 96 font dosyası sabit, adı tekil ve lisansı yanında', () => {
  const buf = readFileSync(new URL('../fonts/BricolageGrotesque96pt_800ExtraBold.ttf', import.meta.url));
  const numTables = buf.readUInt16BE(4);
  const tags = Array.from({ length: numTables }, (_, i) => buf.toString('latin1', 12 + i * 16, 16 + i * 16));
  assert.ok(tags.includes('glyf') && tags.includes('name'), 'TrueType tabloları yok');
  assert.ok(!tags.includes('fvar'), 'dosya hala değişken font');
  // PostScript adı (name ID 6), Windows kaydında UTF-16BE.
  const ps = Buffer.from('BricolageGrotesque96pt-ExtraBold', 'utf16le').swap16();
  assert.ok(buf.includes(ps), 'PostScript adı tekilleştirilmemiş');
  const ofl = readFileSync(new URL('../fonts/OFL.txt', import.meta.url), 'utf8');
  assert.match(ofl, /SIL Open Font License, Version 1\.1/);
});
