#!/usr/bin/env node
// HoopLab kaynak doğrulayıcı.
//
// Kullanım:
//   node tools/research/validate-sources.mjs              biçim + kural→kaynak bağları (çevrimdışı)
//   node tools/research/validate-sources.mjs --online     + DOI/PMID gerçekten var mı, başlık/yıl eşleşiyor mu,
//                                                           makale geri çekilmiş mi (Crossref, PubMed)
//   --root <dizin>                                        research/ yerine başka kök (testler için)
//
// Çıkış kodları: 0 temiz · 1 hata · 2 doğrulayıcı hatası.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SOURCE_TYPES = [
  'consensus',
  'position-stand',
  'systematic-review',
  'meta-analysis',
  'rct',
  'cohort',
  'cross-sectional',
  'narrative-review',
  'expert-opinion',
];
const REQUIRED = ['id', 'title', 'authors', 'year', 'type', 'population', 'verified_on'];
const USER_AGENT = 'HoopLab-source-validator/1.0 (https://github.com/emir-eid/hooplab)';

export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^\[.*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    data[kv[1]] = value;
  }
  return data;
}

export function validateOffline(root) {
  const errors = [];
  const sourcesDir = path.join(root, 'sources');
  const rulesDir = path.join(root, 'rules');
  const sources = new Map();

  const sourceFiles = existsSync(sourcesDir)
    ? readdirSync(sourcesDir).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
    : [];

  for (const file of sourceFiles) {
    const rel = `sources/${file}`;
    const fm = parseFrontmatter(readFileSync(path.join(sourcesDir, file), 'utf8'));
    if (!fm) {
      errors.push(`${rel}: frontmatter yok`);
      continue;
    }
    for (const key of REQUIRED) if (!fm[key] || (Array.isArray(fm[key]) && fm[key].length === 0)) errors.push(`${rel}: '${key}' eksik`);
    if (!fm.doi && !fm.pmid) errors.push(`${rel}: 'doi' veya 'pmid' gerekli`);
    if (fm.type && !SOURCE_TYPES.includes(fm.type)) errors.push(`${rel}: geçersiz type '${fm.type}' (izinli: ${SOURCE_TYPES.join(', ')})`);
    if (fm.year && !/^(19|20)\d{2}$/.test(String(fm.year))) errors.push(`${rel}: geçersiz year '${fm.year}'`);
    if (fm.verified_on && !/^\d{4}-\d{2}-\d{2}$/.test(fm.verified_on)) errors.push(`${rel}: verified_on YYYY-AA-GG olmalı`);
    if (fm.doi && !/^10\.\d{4,9}\/\S+$/.test(fm.doi)) errors.push(`${rel}: DOI biçimi geçersiz '${fm.doi}'`);
    if (fm.id && fm.id !== file.replace(/\.md$/, '')) errors.push(`${rel}: id '${fm.id}' dosya adıyla aynı olmalı`);
    if (fm.id && sources.has(fm.id)) errors.push(`${rel}: id '${fm.id}' tekrar ediyor`);
    if (fm.id) sources.set(fm.id, { ...fm, rel });
  }

  const ruleIds = new Set();
  const ruleFiles = existsSync(rulesDir) ? readdirSync(rulesDir).filter((f) => f.endsWith('.json')) : [];
  let ruleCount = 0;
  for (const file of ruleFiles) {
    const rel = `rules/${file}`;
    let doc;
    try {
      doc = JSON.parse(readFileSync(path.join(rulesDir, file), 'utf8'));
    } catch (e) {
      errors.push(`${rel}: geçersiz JSON (${e.message})`);
      continue;
    }
    if (!Array.isArray(doc.rules)) {
      errors.push(`${rel}: 'rules' dizisi yok`);
      continue;
    }
    for (const rule of doc.rules) {
      ruleCount++;
      const where = `${rel} → ${rule.id ?? '(id yok)'}`;
      if (!rule.id) errors.push(`${where}: 'id' eksik`);
      else if (ruleIds.has(rule.id)) errors.push(`${where}: kural id tekrar ediyor`);
      else ruleIds.add(rule.id);
      if (!rule.description) errors.push(`${where}: 'description' eksik`);
      if (!Array.isArray(rule.sources) || rule.sources.length === 0) errors.push(`${where}: en az bir kaynak gerekli`);
      else for (const s of rule.sources) if (!sources.has(s)) errors.push(`${where}: kaynak '${s}' research/sources içinde yok`);
    }
  }

  return { errors, sources, ruleCount };
}

const words = (s) => new Set(String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2));

export function titleSimilarity(a, b) {
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (res.status === 404) return { notFound: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { data: await res.json() };
}

async function checkOnline(src) {
  const problems = [];
  const warnings = [];
  if (src.doi) {
    try {
      const r = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(src.doi)}`);
      if (r.notFound) problems.push(`DOI Crossref'te bulunamadı (${src.doi})`);
      else {
        const msg = r.data.message ?? {};
        const remoteTitle = (msg.title ?? [])[0] ?? '';
        const sim = titleSimilarity(src.title, remoteTitle);
        if (sim < 0.6) problems.push(`başlık eşleşmiyor (benzerlik ${sim.toFixed(2)}): Crossref "${remoteTitle}"`);
        const year = (msg.issued?.['date-parts']?.[0] ?? [])[0];
        if (year && Math.abs(Number(year) - Number(src.year)) > 1) problems.push(`yıl eşleşmiyor: Crossref ${year}, kayıt ${src.year}`);
        const updates = [...(msg['updated-by'] ?? []), ...(msg['update-to'] ?? [])];
        if (updates.some((u) => /retract|withdraw/i.test(u.type ?? ''))) problems.push('makale GERİ ÇEKİLMİŞ veya geri çekme bildirimi var');
        const relation = JSON.stringify(msg.relation ?? {});
        if (/retract/i.test(relation)) problems.push('Crossref ilişkilerinde geri çekme kaydı var');
      }
    } catch (e) {
      warnings.push(`Crossref'e ulaşılamadı: ${e.message}`);
    }
  }
  if (src.pmid) {
    try {
      const r = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(src.pmid)}`);
      const rec = r.data?.result?.[src.pmid];
      if (!rec || rec.error) problems.push(`PMID PubMed'de bulunamadı (${src.pmid})`);
      else {
        const sim = titleSimilarity(src.title, rec.title);
        if (sim < 0.6) problems.push(`başlık PubMed ile eşleşmiyor (benzerlik ${sim.toFixed(2)})`);
        if ((rec.pubtype ?? []).some((t) => /retract/i.test(t))) problems.push('PubMed yayın türünde geri çekme var');
      }
    } catch (e) {
      warnings.push(`PubMed'e ulaşılamadı: ${e.message}`);
    }
  }
  return { problems, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const online = args.includes('--online');
  const rootIdx = args.indexOf('--root');
  const root = rootIdx >= 0 ? path.resolve(args[rootIdx + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'research');

  const { errors, sources, ruleCount } = validateOffline(root);
  const warnings = [];

  if (online) {
    for (const src of sources.values()) {
      const { problems, warnings: w } = await checkOnline(src);
      for (const p of problems) errors.push(`${src.rel}: ${p}`);
      for (const x of w) warnings.push(`${src.rel}: ${x}`);
    }
  }

  for (const w of warnings) console.warn(`  ! ${w}`);
  const summary = `${sources.size} kaynak, ${ruleCount} kural${online ? ', çevrimiçi doğrulama' : ''}`;
  if (errors.length) {
    console.error(`[kaynak-dogrulayici] ${errors.length} hata (${summary}):`);
    for (const e of errors) console.error(`  x ${e}`);
    process.exit(1);
  }
  console.log(`[kaynak-dogrulayici] temiz (${summary})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`[kaynak-dogrulayici] DOĞRULAYICI HATASI: ${err.message}`);
    process.exit(2);
  });
}
