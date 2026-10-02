#!/usr/bin/env node
// HoopLab gizlilik bekçisi.
//
// Kullanım:
//   node tools/guard/privacy-guard.mjs --staged   commit'e girecek dosyaları tarar (pre-commit)
//   node tools/guard/privacy-guard.mjs --all      izlenen + eklenmeye aday tüm dosyaları tarar (CI, /kapat)
//   node tools/guard/privacy-guard.mjs --history  tüm git geçmişindeki her dosya sürümünü tarar (CI, public öncesi)
//
// Çıkış kodları: 0 temiz · 1 ihlal bulundu · 2 bekçi hatası.
// Bekçi kendi hatasında da commit'i DURDURUR (fail-closed): çöken bekçi kapıyı açık bırakmamalı.
//
// Kişisel tanımlayıcılar (ad, e-posta, doğum tarihi vb.) bu dosyada TUTULMAZ. İki kaynaktan okunur
// (her satır bir ifade, # ile başlayan satır yorum):
//   1. repo dışındaki ../private/guard-denylist.txt (yerel makine)
//   2. HOOPLAB_GUARD_DENYLIST_TEXT ortam değişkeni (CI: GitHub secret GUARD_DENYLIST)
// İkisi de yoksa bu kural atlanır ve çıktıda "yok (atlandı)" yazar.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

const isSyntheticFixture = (p) => /(^|\/)fixtures\/synthetic\//.test(p) || /(^|\/)__fixtures__\//.test(p);

export const PATH_RULES = [
  {
    id: 'private-klasoru',
    why: 'private/ klasörü repo dışında kalmalı',
    test: (p) => /(^|\/)private\//i.test(p),
  },
  {
    id: 'env-dosyasi',
    why: '.env dosyaları sır taşır; yalnız .env.example izlenebilir',
    test: (p) => /(^|\/)\.env(\.|$)/.test(p) && !/(^|\/)\.env\.example$/.test(p),
  },
  {
    id: 'veri-dosyasi',
    why: 'veri dışa aktarımları private/data içinde durur; repoda yalnız fixtures/synthetic',
    test: (p) => /\.(csv|tsv|jsonl|ndjson|zip|fit|tcx|gpx|xlsx|xls|sqlite|sqlite3|db)$/i.test(p) && !isSyntheticFixture(p),
  },
  {
    id: 'saglik-ihraci',
    why: 'Google Health / Fitbit / Takeout dışa aktarımına benziyor',
    test: (p) => /(^|\/)(takeout|ghealth|google[-_]?health|fitbit)[^/]*\.(json|csv|zip)$/i.test(p) && !isSyntheticFixture(p),
  },
  {
    id: 'kimlik-dosyasi',
    why: 'anahtar / sertifika / OAuth kimlik dosyası',
    test: (p) =>
      /\.(pem|p8|p12|pfx|key|keystore|jks|mobileprovision)$/i.test(p) ||
      /(^|\/)(client_secret[^/]*\.json|credentials\.json|service[-_]account[^/]*\.json|token\.json)$/i.test(p),
  },
];

export const CONTENT_RULES = [
  { id: 'anthropic-anahtari', re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: 'google-api-anahtari', re: /AIza[0-9A-Za-z_-]{35}/ },
  { id: 'google-oauth-sirri', re: /GOCSPX-[A-Za-z0-9_-]{20,}/ },
  { id: 'google-yenileme-tokeni', re: /1\/\/0[A-Za-z0-9_-]{30,}/ },
  { id: 'google-erisim-tokeni', re: /ya29\.[A-Za-z0-9_-]{20,}/ },
  { id: 'github-tokeni', re: /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/ },
  { id: 'supabase-gizli-anahtar', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { id: 'jwt', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: 'ozel-anahtar', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    id: 'herkese-acik-sir-adi',
    re: /EXPO_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|ANTHROPIC|CLAUDE|CLIENT_SECRET)[A-Z0-9_]*/,
    why: 'EXPO_PUBLIC_ değerleri uygulama paketine gömülür; sır bu önekle tanımlanamaz',
  },
  {
    id: 'mobilde-service-role',
    re: /service_role|SERVICE_ROLE_KEY/i,
    scope: (p) => /^apps\/mobile\//.test(p),
    why: 'service_role anahtarı mobil koda giremez',
  },
];

const mask = (s) => (s.length <= 10 ? '***' : `${s.slice(0, 6)}…${s.slice(-2)} (${s.length} karakter)`);

// Rakam gruplarını ayıran işaretler (boşluk, nokta değil): "0555 123 45 67", "+90 (555) 123-45-67"
const stripNumberSeparators = (s) => s.replace(/[\s()+-]/g, '');

/**
 * Denylist ifadelerini biçim varyantlarıyla genişletir:
 * - Tarih (GG.AA.YYYY, GG/AA/YYYY, GG-AA-YYYY, YYYY-AA-GG): tüm yaygın biçimler.
 * - Yalnız rakamdan oluşan (7+ hane, ör. telefon, kimlik no): ayrıca ayraçlar atılmış satırda aranır.
 */
export function expandDenylist(list) {
  const literals = new Set();
  const digitRuns = new Set();
  for (const raw of list) {
    const d = raw.trim();
    if (!d) continue;
    literals.add(d.toLowerCase());

    let parts = d.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    let day, month, year;
    if (parts) [, day, month, year] = parts;
    else if ((parts = d.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/))) [, year, month, day] = parts;
    if (year) {
      const D = day.padStart(2, '0');
      const M = month.padStart(2, '0');
      for (const sep of ['.', '/', '-']) {
        literals.add(`${D}${sep}${M}${sep}${year}`);
        literals.add(`${year}${sep}${M}${sep}${D}`);
      }
      literals.add(`${D}${M}${year}`);
      literals.add(`${year}${M}${D}`);
    }

    if (/^\d{7,}$/.test(d)) digitRuns.add(d);
  }
  return { literals: [...literals], digitRuns: [...digitRuns] };
}

/**
 * @param {{path: string, content: string|null, ref?: string}[]} entries  content=null: yalnız yol kuralları;
 *   ref: geçmiş taramasında içeriğin blob kimliği (içerik ihlallerine eklenir)
 * @param {{denylist?: string[]}} opts
 */
export function scanEntries(entries, { denylist = [] } = {}) {
  const violations = [];
  const { literals: deny, digitRuns } = expandDenylist(denylist);

  for (const { path: rawPath, content, ref } of entries) {
    const p = rawPath.replace(/\\/g, '/');

    for (const rule of PATH_RULES) {
      if (rule.test(p)) violations.push({ path: p, line: null, rule: rule.id, detail: rule.why });
    }
    if (content == null) continue;

    const lines = content.split(/\r?\n/);
    lines.forEach((text, i) => {
      for (const rule of CONTENT_RULES) {
        if (rule.scope && !rule.scope(p)) continue;
        const m = text.match(rule.re);
        if (m) violations.push({ path: p, line: i + 1, rule: rule.id, detail: rule.why ?? `eşleşme: ${mask(m[0])}`, ref });
      }
      if (deny.length) {
        const lower = text.toLowerCase();
        const compact = digitRuns.length ? stripNumberSeparators(text) : '';
        const hit = deny.some((d) => lower.includes(d)) || digitRuns.some((d) => compact.includes(d));
        if (hit) violations.push({ path: p, line: i + 1, rule: 'kisisel-tanimlayici', detail: 'denylist ifadesi (değer gösterilmez)', ref });
      }
    });
  }
  return violations;
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

function gitBuffer(args, cwd) {
  return execFileSync('git', args, { cwd, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

const splitZ = (s) => s.split('\0').filter(Boolean);

function decode(buf) {
  if (buf.length > MAX_CONTENT_BYTES) return null;
  if (buf.subarray(0, 8192).includes(0)) return null; // ikili dosya: yalnız yol kuralları
  return buf.toString('utf8');
}

const parseDenylist = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

export function loadDenylist(root, env = process.env) {
  const list = [];
  const sources = [];
  const file = env.HOOPLAB_GUARD_DENYLIST ?? path.resolve(root, '..', 'private', 'guard-denylist.txt');
  if (existsSync(file)) {
    list.push(...parseDenylist(readFileSync(file, 'utf8')));
    sources.push('dosya');
  }
  if (env.HOOPLAB_GUARD_DENYLIST_TEXT) {
    list.push(...parseDenylist(env.HOOPLAB_GUARD_DENYLIST_TEXT));
    sources.push('ortam değişkeni');
  }
  return { list: [...new Set(list)], sources };
}

// Tüm dal ve etiketlerden erişilebilen her dosya sürümü (blob) + geçmişte görülmüş her yol.
function collectHistory(root) {
  const objects = git(['rev-list', '--all', '--objects'], root).split('\n').filter(Boolean);
  if (objects.length === 0) return [];

  const pathBySha = new Map();
  for (const line of objects) {
    const sp = line.indexOf(' ');
    if (sp > 0) pathBySha.set(line.slice(0, sp), line.slice(sp + 1));
  }
  const check = execFileSync('git', ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], {
    cwd: root,
    input: [...pathBySha.keys()].join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const blobs = check
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split(' '))
    .filter(([, type]) => type === 'blob');

  const entries = [];
  const readable = blobs.filter(([, , size]) => Number(size) <= MAX_CONTENT_BYTES).map(([sha]) => sha);
  for (const [sha, , size] of blobs) {
    if (Number(size) > MAX_CONTENT_BYTES) entries.push({ path: pathBySha.get(sha), content: null, ref: sha.slice(0, 7) });
  }
  if (readable.length) {
    const out = execFileSync('git', ['cat-file', '--batch'], { cwd: root, input: readable.join('\n') + '\n', maxBuffer: 1024 * 1024 * 1024 });
    let pos = 0;
    while (pos < out.length) {
      const nl = out.indexOf(0x0a, pos);
      const [sha, , size] = out.subarray(pos, nl).toString('utf8').split(' ');
      const start = nl + 1;
      const end = start + Number(size);
      entries.push({ path: pathBySha.get(sha), content: decode(out.subarray(start, end)), ref: sha.slice(0, 7) });
      pos = end + 1; // içerikten sonraki satır sonu
    }
  }
  // Yol kuralları için: geçmişte herhangi bir commit'te var olmuş her yol
  const allPaths = new Set(git(['log', '--all', '--name-only', '--format='], root).split('\n').filter(Boolean));
  for (const p of allPaths) entries.push({ path: p, content: null });
  return entries;
}

function collect(mode, root) {
  if (mode === '--history') return collectHistory(root);
  if (mode === '--staged') {
    const paths = splitZ(git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], root));
    return paths.map((p) => ({ path: p, content: decode(gitBuffer(['show', `:${p}`], root)) }));
  }
  // --all: izlenen dosyalar + git add -A ile eklenecek izlenmeyen dosyalar
  const tracked = splitZ(git(['ls-files', '-z'], root));
  const untracked = splitZ(git(['ls-files', '-z', '--others', '--exclude-standard'], root));
  const entries = [];
  for (const p of new Set([...tracked, ...untracked])) {
    const abs = path.join(root, p);
    // git ls-files silinmiş ama stage'lenmemiş dosyayı da listeler: diskte yoksa atla (çökme yok)
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    entries.push({ path: p, content: decode(readFileSync(abs)) });
  }
  return entries;
}

function main() {
  const mode = process.argv[2];
  if (!['--staged', '--all', '--history'].includes(mode)) {
    console.error('Kullanım: privacy-guard.mjs --staged | --all | --history');
    process.exit(2);
  }
  const root = git(['rev-parse', '--show-toplevel'], process.cwd()).trim();
  const entries = collect(mode, root);
  const { list, sources } = loadDenylist(root);
  const raw = scanEntries(entries, { denylist: list });

  // Aynı ihlal (ör. geçmişte hem yol hem içerik girdisinden) bir kez raporlanır
  const seen = new Set();
  const violations = raw.filter((v) => {
    const key = `${v.path}|${v.line}|${v.rule}|${v.ref ?? ''}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });

  const unit = mode === '--history' ? 'geçmiş girdisi' : 'dosya';
  const scope = `${entries.length} ${unit}, kişisel denylist ${sources.length ? `${list.length} ifade (${sources.join(' + ')})` : 'yok (atlandı)'}`;
  if (violations.length === 0) {
    console.log(`[gizlilik-bekcisi] temiz (${scope})`);
    return;
  }
  console.error(`[gizlilik-bekcisi] ${violations.length} ihlal (${scope}):`);
  for (const v of violations) {
    const where = v.ref ? `  [geçmiş: blob ${v.ref}; commit'i bul: git log --all --find-object=${v.ref}]` : '';
    console.error(`  x ${v.path}${v.line ? `:${v.line}` : ''}  ${v.rule}  ${v.detail ?? ''}${where}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(`[gizlilik-bekcisi] BEKÇİ HATASI, işlem durduruldu: ${err.message}`);
    process.exit(2);
  }
}
