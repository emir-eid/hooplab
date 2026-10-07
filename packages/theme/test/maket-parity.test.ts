// Token'lar maketle birebir mi? Tek kaynak design/maketler/c-hale.html (+ cerceve.css).
// Maket değişip token değişmezse (ya da tersi) bu test kırılır.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  aura,
  auraStops,
  dayStates,
  duration,
  easing,
  em,
  fontFamily,
  palettes,
  parseHex,
  radius,
  reveal,
  size,
  type,
  type BasePalette,
  type ColorScheme,
  type DayState,
  type Hex,
  type TextVariant,
} from '../src/index.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const html = read('../../../design/maketler/c-hale.html');
const frame = read('../../../design/maketler/cerceve.css');
const css = (html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');

/** Seçicinin kural gövdesindeki bildirimler. Seçici tam eşleşmeli (virgüllü gruplar dahil). */
function rule(selector: string, source = css): Record<string, string> {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[}\\n])\\s*${esc}\\s*\\{([^}]*)\\}`, 'g');
  const out: Record<string, string> = {};
  let found = false;
  for (const m of source.matchAll(re)) {
    found = true;
    for (const decl of m[1]!.split(';')) {
      const i = decl.indexOf(':');
      if (i > 0) out[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    }
  }
  assert.ok(found, `makette kural yok: ${selector}`);
  return out;
}

function cssColor(value: string): { r: number; g: number; b: number; a: number } {
  if (value.startsWith('#')) return parseHex(value.toUpperCase());
  const m = /^rgba?\(([^)]+)\)$/.exec(value);
  assert.ok(m, `çözülemeyen renk: ${value}`);
  const [r, g, b, a = '1'] = m[1]!.split(',').map((s) => s.trim());
  return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) };
}

function sameColor(token: Hex, cssValue: string, label: string) {
  const x = parseHex(token);
  const y = cssColor(cssValue);
  assert.deepEqual([x.r, x.g, x.b], [y.r, y.g, y.b], `${label}: ${token} ≠ ${cssValue}`);
  assert.ok(Math.abs(x.a - y.a) <= 1 / 255, `${label} opaklık: ${token} ≠ ${cssValue}`);
}

const normShadow = (s: string) =>
  s.replace(/(^|[^\d])\.(\d)/g, '$10.$2').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();

const px = (v: string | undefined) => {
  assert.ok(v !== undefined, 'değer yok');
  return Number(v.replace('px', ''));
};

// ---------------------------------------------------------------- renkler

const tokenToVar: Record<Exclude<keyof BasePalette, 'status' | 'statusInk' | 'loadGroup' | 'nutrient' | 'destructive' | 'onDestructive' | 'aura' | 'shadow' | 'statusBar'>, string> = {
  bg: '--bg',
  card: '--card',
  cardMuted: '--card2',
  ink: '--ink',
  inkSecondary: '--ink2',
  inkMuted: '--mute',
  line: '--line',
  onInk: '--on-ink',
  strong: '--strong',
  onStrong: '--on-strong',
  result: '--result',
  onResult: '--on-result',
  glass: '--glass',
  glassEdge: '--glass-edge',
  chip: '--chip',
  tabActive: '--tab-on',
  dot: '--dot',
  band: '--band',
  track: '--track',
  knob: '--knob',
};
const stateLetter: Record<DayState, string> = { green: 'g', yellow: 'y', red: 'r' };
const stateSelector: Record<DayState, string> = { green: 'yesil', yellow: '', red: 'kirmizi' };
const themeSelector: Record<ColorScheme, string> = { light: ':root', dark: ':root[data-tema="koyu"]' };

for (const scheme of ['light', 'dark'] as const) {
  test(`renkler maketle aynı (${scheme})`, () => {
    const vars = rule(themeSelector[scheme]);
    const p = palettes[scheme];
    for (const [token, v] of Object.entries(tokenToVar)) {
      sameColor(p[token as keyof typeof tokenToVar], vars[v]!, `${scheme}.${token}`);
    }
    for (const s of dayStates) {
      const l = stateLetter[s];
      sameColor(p.status[s], vars[`--${l}`]!, `${scheme}.status.${s}`);
      sameColor(p.statusInk[s], vars[`--${l}-ink`]!, `${scheme}.statusInk.${s}`);
    }
    assert.equal(p.aura.opacity, Number(vars['--aura-op']));
    assert.equal(normShadow(p.shadow.card), normShadow(vars['--shadow']!));
    assert.equal(normShadow(p.shadow.float), normShadow(vars['--float']!));
  });

  test(`hale renkleri maketle aynı (${scheme})`, () => {
    for (const s of dayStates) {
      const sel = stateSelector[s]
        ? `${themeSelector[scheme]}[data-state="${stateSelector[s]}"]`
        : themeSelector[scheme];
      const vars = rule(sel);
      for (const [i, color] of palettes[scheme].aura.colors[s].entries()) {
        sameColor(color, vars[`--a${i + 1}`]!, `${scheme}.aura.${s}[${i}]`);
      }
    }
  });
}

test('türetilen renkler maketteki color-mix oranlarıyla hesaplanıyor', () => {
  assert.match(rule('.advice .ico')['background']!, /var\(--s\) 16%, var\(--card\)/);
  assert.match(rule('.cta span:last-child')['background']!, /var\(--on-strong\) 14%, transparent/);
  assert.match(rule('.chipset button.on b')['background']!, /var\(--on-strong\) 20%, transparent/);
  assert.match(rule('.tabwrap')['background']!, /var\(--bg\) 90%, transparent/);
  // Durum rengi yazı/ikon olarak --s-ink ile (erişilebilir ton), dolgu olarak --s ile.
  assert.equal(rule('.advice .ico')['color'], 'var(--s-ink)');
  assert.equal(rule('.off .m-n')['color'], 'var(--s-ink)');
});

test('ortak gölgeler maketle aynı', () => {
  for (const scheme of ['light', 'dark'] as const) {
    assert.equal(normShadow(palettes[scheme].shadow.selected), normShadow(rule('.seg button.on')['box-shadow']!));
    assert.equal(normShadow(palettes[scheme].shadow.knob), normShadow(rule('.track .knob')['box-shadow']!));
  }
});

// ---------------------------------------------------------------- tipografi

const typeMap: [selector: string, variant: TextVariant][] = [
  ['.state h2', 'display'],
  ['.dur div', 'numberXL'],
  ['.result b', 'numberL'],
  ['.rpe-h b', 'numberM'],
  ['.top h1', 'largeTitle'],
  ['.ptitle', 'largeTitle'],
  ['.m-v', 'metric'],
  ['.fhead h2', 'title2'],
  ['.sec h3', 'title3'],
  ['.rpe-h span', 'headline'],
  ['.seg button', 'digit'],
  ['.state p', 'body'],
  ['.advice p', 'bodyCompact'],
  ['.dock .btn', 'buttonLarge'],
  ['.q .l', 'callout'],
  ['.cta', 'callout'],
  ['.row', 'rowLabel'],
  ['.top small', 'subhead'],
  ['.fsub', 'subhead'],
  ['.tendon li', 'subhead'],
  ['.chipset button', 'chip'],
  ['.themes button', 'chip'],
  ['.m-l', 'footnote'],
  ['.glabel', 'footnote'],
  ['.blk > .t', 'footnote'],
  ['.state .eyebrow', 'eyebrow'],
  ['.sec small', 'footnoteMedium'],
  ['.foot', 'footnoteRegular'],
  ['.m-n', 'caption'],
  ['.fine', 'captionRegular'],
  ['.lg', 'caption2'],
  ['.tendon small', 'caption2'],
  ['.est', 'caption2Strong'],
  ['.ends', 'micro'],
  ['.track-l', 'micro'],
  ['.tab', 'tabLabel'],
  ['.cite', 'badge'],
];

const bodyByWeight: Record<number, string> = {
  400: fontFamily.body,
  500: fontFamily.bodyMedium,
  600: fontFamily.bodySemiBold,
  700: fontFamily.bodyBold,
};

test('yazı token\'ları maketteki font tanımlarıyla aynı', () => {
  const errors: string[] = [];
  for (const [selector, variant] of typeMap) {
    const d = rule(selector);
    let weight = 400;
    let fontSize: number | undefined;
    let lineHeight: number | undefined;
    let display = false;
    const short = d['font'] && /^(\d{3})\s+([\d.]+)px(?:\/([\d.]+))?\s+var\(--(disp|body)\)$/.exec(d['font']);
    if (short) {
      weight = Number(short[1]);
      fontSize = Number(short[2]);
      if (short[3]) lineHeight = Number(short[3]);
      display = short[4] === 'disp';
    }
    if (d['font-size']) fontSize = px(d['font-size']);
    if (d['font-weight']) weight = Number(d['font-weight']);
    if (d['line-height']) lineHeight = Number(d['line-height']);
    const tracking = d['letter-spacing'] ? Number(d['letter-spacing'].replace('em', '')) : 0;

    const tok = type[variant];
    const expectedFamily = display
      ? weight === 800 ? fontFamily.display : weight === 700 ? fontFamily.heading : `Bricolage ${weight}`
      : bodyByWeight[weight];
    const where = `${selector} → ${variant}`;
    if (tok.fontFamily !== expectedFamily) errors.push(`${where}: aile ${tok.fontFamily}, makette ${expectedFamily}`);
    if (tok.fontSize !== fontSize) errors.push(`${where}: boyut ${tok.fontSize}, makette ${fontSize}`);
    if (tok.letterSpacing !== em(tracking, tok.fontSize)) errors.push(`${where}: harf aralığı ${tok.letterSpacing}, makette ${tracking}em`);
    if (lineHeight !== undefined && Math.abs(tok.lineHeight - (fontSize ?? 0) * lineHeight) > 0.6) {
      errors.push(`${where}: satır ${tok.lineHeight}, makette ${lineHeight} × ${fontSize}`);
    }
  }
  assert.deepEqual(errors, []);
});

test('opsz 96 kesimi yalnız büyük yazılarda', () => {
  for (const [name, tok] of Object.entries(type)) {
    if (tok.fontFamily === fontFamily.display) assert.ok(tok.fontSize >= 48, `${name} ${tok.fontSize}pt`);
  }
});

// ---------------------------------------------------------------- köşe ve boyut

test('köşe yarıçapları maketle aynı', () => {
  const map: [string, keyof typeof radius][] = [
    ['.meter', 'xs'],
    ['.seg button', 'md'],
    ['.advice .ico', 'lg'],
    ['.seg', 'lg'],
    ['.mini', 'lg'],
    ['.grid .card', 'xl'],
    ['.q', 'xl'],
    ['.list', 'xl'],
    ['.blk', 'xxl'],
    ['.result', 'xxl'],
    ['.themes', 'xxl'],
    ['.card', 'xxxl'],
  ];
  for (const [sel, key] of map) assert.equal(radius[key], px(rule(sel)['border-radius']), sel);
  assert.equal(radius.sm, Number(/rx="(\d+)"/.exec(html)?.[1]), 'grafik bandı rx');
});

test('kontrol boyutları maketle aynı', () => {
  const h: [string, keyof typeof size, string][] = [
    ['.chips span', 'chip', 'height'],
    ['.chipset button', 'chipLarge', 'height'],
    ['.fhead button', 'iconButton', 'width'],
    ['.advice .ico', 'iconTile', 'width'],
    ['.seg button', 'segment', 'height'],
    ['.dur button', 'stepper', 'width'],
    ['.row', 'row', 'min-height'],
    ['.cta', 'cta', 'height'],
    ['.dock .btn', 'primaryButton', 'height'],
    ['.tabbar', 'tabBar', 'height'],
    ['.fab', 'fab', 'width'],
    ['.cite', 'citeBadge', 'width'],
    ['.meter', 'meter', 'height'],
    ['.track .knob', 'knob', 'width'],
    ['.dots i', 'progress', 'height'],
    ['.track .hit button', 'hitTarget', 'height'],
  ];
  for (const [sel, key, prop] of h) assert.equal(size[key], px(rule(sel)[prop]), `${sel} ${prop}`);
  assert.deepEqual(size.grabber, { width: px(rule('.grab')['width']), height: px(rule('.grab')['height']) });
});

// ---------------------------------------------------------------- hale ve hareket

test('hale durakları ve geometrisi maketle aynı', () => {
  const stops = JSON.parse(/const STOPS = (\[[^;]*\]);/.exec(html)![1]!);
  assert.deepEqual(auraStops, stops);

  const layer = rule('.aura');
  assert.equal(aura.top, px(layer['top']));
  assert.equal(-aura.overhangX, px(layer['left']));
  assert.equal(-aura.overhangX, px(layer['right']));
  assert.equal(aura.height, px(layer['height']));
  assert.match(html, new RegExp(`opacity:calc\\(var\\(--aura-op\\) \\* \\.${String(aura.sheetOpacityFactor).slice(2)}\\)`));

  const frames: Record<string, { translateX: number; translateY: number; scale: number }> = {};
  for (const m of css.matchAll(/@keyframes (drift\d) \{ to \{ transform: translate\((-?\d+)px, (-?\d+)px\) scale\(([\d.]+)\); \} \}/g)) {
    frames[m[1]!] = { translateX: Number(m[2]), translateY: Number(m[3]), scale: Number(m[4]) };
  }
  aura.blobs.forEach((blob, i) => {
    const d = rule(`.blob.b${i + 1}`);
    assert.equal(blob.size, px(d['width']));
    assert.equal(blob.size, px(d['height']));
    assert.equal(blob.x, px(d['left']));
    assert.equal(blob.y, px(d['top']));
    const anim = /^(drift\d) (\d+)s ease-in-out infinite (alternate(?:-reverse)?)$/.exec(d['animation']!);
    assert.ok(anim, `.blob.b${i + 1} animasyonu çözülemedi`);
    assert.deepEqual(blob.to, frames[anim[1]!]);
    assert.equal(blob.period, Number(anim[2]) * 1000);
    assert.equal(blob.reverse, anim[3] === 'alternate-reverse');
  });
});

test('süreler ve eğriler maketle aynı', () => {
  const sec = (s: string) => Math.round(Number(/([\d.]+)s/.exec(s)![1]) * 1000);
  assert.equal(duration.fast, sec(rule('.seg button')['transition']!));
  assert.equal(duration.base, sec(rule('.track .fill')['transition']!));
  assert.equal(duration.slow, sec(rule('body')['transition']!));
  assert.equal(duration.auraFade, sec(rule('.aura')['transition']!));
  assert.equal(duration.auraColor, sec(rule('.blob stop')['transition']!));
  const bez = /cubic-bezier\(([^)]+)\)/.exec(rule('.track .fill')['transition']!)![1]!.split(',').map(Number);
  assert.deepEqual([...easing.emphasized], bez);

  const rv = rule('.rv', frame)['animation']!;
  assert.equal(reveal.duration, sec(rv));
  assert.deepEqual([...reveal.easing], /cubic-bezier\(([^)]+)\)/.exec(rv)![1]!.split(',').map(Number));
  assert.equal(reveal.stagger, sec(rule('.rv:nth-child(2)', frame)['animation-delay']!));
  assert.equal(reveal.stagger * reveal.maxStaggerSteps, sec(rule('.rv:nth-child(n+8)', frame)['animation-delay']!));
  assert.match(frame, new RegExp(`translateY\\(${reveal.offsetY}px\\)`));
});
