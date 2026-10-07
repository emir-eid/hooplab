// Arayüz metinlerinde elle yazılmış eşik veya pencere sayısı yok mu (Faz 2 kapanışı, CLAUDE.md §3)?
// "son 7 gün", "4 hafta", "1 SD", "%2" gibi sayılar motor sabitlerinden (@hooplab/engine) gelir; kural değişince
// metin de değişir. Kaynak bulgusu veya biçim örneği olan sayılar aşağıdaki listede gerekçesiyle durur.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const src = fileURLToPath(new URL('../', import.meta.url));

/** Dosya (src'ye göre) → satırda geçen, izin verilen parça → gerekçe. */
const allowed: Record<string, Record<string, string>> = {
  'app/(tabs)/body.tsx': {
    "{ 1: '1 gün', 3: '3 gün', 7: '1 hafta' }": 'ağrı görünümünün zaman filtresi (karar 0018), eşik değil',
  },
  'app/(tabs)/me/google-health.tsx': {
    'izni 7 günde bir yeniler': "Google'ın Testing modu izin süresi (karar 0019), bilimsel eşik değil",
  },
  'data/google-health-status.ts': {
    'Son 90 günün verisi': 'ilk senkronun geriye dönük aralığı (karar 0019), eşik değil',
  },
  'copy/explainers.ts': {
    '"−1 SD", olağan günlük oynamanın bir katı': 'SD biriminin okunuş örneği',
    'kendi ortalamasının 1 SD altında olan oyuncuların': 'kaynak bulgusu (gallo-2016), uygulamanın eşiği değil',
    'yaklaşık 24 saatte zirve': 'kaynak bulgusu (magnusson-2010), uygulamanın eşiği değil',
  },
  'copy/personal-baseline.ts': {
    "return '0 SD'": 'biçim: sıfır z değeri',
  },
  'copy/training-load.ts': {
    "'%0'": 'biçim: sıfır değişim',
  },
};

const numberWithUnit = /(?<![\d.,])\d+(?:,\d+)?(?:[-–]\d+(?:,\d+)?)? ?(?:gün|gece|hafta|saat|SD|nefes|g\/kg|mL|check-in)|%\d/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

test('arayüz metinlerindeki eşik ve pencere sayıları motor sabitlerinden', () => {
  const found: string[] = [];
  const used = new Set<string>();
  for (const path of sourceFiles(src)) {
    const file = relative(src, path).replaceAll('\\', '/');
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (!numberWithUnit.test(line.replace(/\$\{[^}]*\}/g, ''))) return;
        const ok = Object.keys(allowed[file] ?? {}).find((fragment) => line.includes(fragment));
        if (ok) used.add(`${file} ${ok}`);
        else found.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
  assert.deepEqual(found, [], 'elle yazılmış sayı; @hooplab/engine sabitini kullan ya da gerekçesiyle listeye ekle');
  for (const [file, fragments] of Object.entries(allowed)) {
    for (const fragment of Object.keys(fragments)) assert.ok(used.has(`${file} ${fragment}`), `listede artık geçmeyen parça: ${file} ${fragment}`);
  }
});
