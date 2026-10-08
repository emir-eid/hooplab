#!/usr/bin/env node
// Koç için kanıt tabanı paketi (karar 0032). research/sources ve research/rules içeriğini koç Edge
// Function'ının okuduğu supabase/functions/_shared/coach/kb-data.ts dosyasına yazar. Paket elle
// değiştirilmez; research/ değişince betik yeniden çalıştırılır, test eşitliği denetler.
//
// Kullanım:
//   node tools/research/coach-kb.mjs            paketi üret
//   node tools/research/coach-kb.mjs --check    paket research/ ile aynı mı (çevrimdışı; çıkış 1 = eski)
//   --root <dizin> --out <dosya>                başka kök ve hedef (testler için)
//
// Kaynak gövdesinden yalnız kendi özetimiz alınır ("Ne söylüyor", "Uygulamada kullanılan sayılar",
// "Sınırlılıklar"). "Bağlı kurallar" bölümü alınmaz: bağlar kurallardaki `sources` listesinden gelir.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter, validateOffline } from './validate-sources.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUT = path.join(repo, 'supabase/functions/_shared/coach/kb-data.ts');
const DROPPED_SECTIONS = ['Bağlı kurallar'];

/** Frontmatter'dan sonraki gövdeyi bölümlere ayırır, atılacak bölümleri çıkarır. */
export function summaryBody(text) {
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').replace(/\r\n/g, '\n');
  const parts = body.split(/^(?=## )/m);
  return parts
    .filter((part) => {
      const heading = part.match(/^## (.+)$/m)?.[1]?.trim();
      return !heading || !DROPPED_SECTIONS.includes(heading);
    })
    .join('')
    .trim();
}

export function buildKb(root) {
  const { errors } = validateOffline(root);
  if (errors.length) throw new Error(`research/ doğrulanmadı:\n${errors.join('\n')}`);

  const sourcesDir = path.join(root, 'sources');
  const sources = readdirSync(sourcesDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
    .map((file) => {
      const text = readFileSync(path.join(sourcesDir, file), 'utf8');
      const fm = parseFrontmatter(text);
      return {
        id: fm.id,
        title: fm.title,
        authors: fm.authors,
        year: Number(fm.year),
        type: fm.type,
        ...(fm.doi ? { doi: fm.doi } : {}),
        ...(fm.pmid ? { pmid: fm.pmid } : {}),
        ...(fm.journal ? { journal: fm.journal } : {}),
        population: fm.population,
        summary: summaryBody(text),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));

  const rulesDir = path.join(root, 'rules');
  const rules = readdirSync(rulesDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((file) => {
      const doc = JSON.parse(readFileSync(path.join(rulesDir, file), 'utf8'));
      return doc.rules.map((r) => ({
        id: r.id,
        module: doc.module,
        description: r.description,
        ...(r.applies_to ? { appliesTo: r.applies_to } : {}),
        ...(r.notes ? { notes: r.notes } : {}),
        sources: r.sources,
      }));
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));

  return { sources, rules };
}

export function renderKb(kb) {
  const json = (v) => JSON.stringify(v, null, 2);
  return [
    '// OTOMATİK ÜRETİLDİ: node tools/research/coach-kb.mjs. Elle değiştirme; kaynak research/sources ve',
    '// research/rules (kendi özetlerimiz, telifli metin yok). Karar 0032.',
    '',
    "import type { KbRule, KbSource } from './kb.ts';",
    '',
    `export const kbSources: readonly KbSource[] = ${json(kb.sources)};`,
    '',
    `export const kbRules: readonly KbRule[] = ${json(kb.rules)};`,
    '',
  ].join('\n');
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const root = path.resolve(arg('--root') ?? path.join(repo, 'research'));
  const out = path.resolve(arg('--out') ?? DEFAULT_OUT);
  const text = renderKb(buildKb(root));
  if (argv.includes('--check')) {
    const current = existsSync(out) ? readFileSync(out, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== text) {
      console.error(`${path.relative(repo, out)} research/ ile aynı değil; node tools/research/coach-kb.mjs ile yeniden üret.`);
      return 1;
    }
    console.log(`${path.relative(repo, out)} güncel.`);
    return 0;
  }
  writeFileSync(out, text);
  const kb = buildKb(root);
  console.log(`${kb.sources.length} kaynak, ${kb.rules.length} kural yazıldı: ${path.relative(repo, out)} (${Buffer.byteLength(text)} bayt)`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 2;
  }
}
