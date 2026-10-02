#!/usr/bin/env node
// HoopLab gizlilik bekçisi.
//
// Kullanım:
//   node tools/guard/privacy-guard.mjs --staged   commit'e girecek dosyaları tarar (pre-commit)
//   node tools/guard/privacy-guard.mjs --all      izlenen + eklenmeye aday tüm dosyaları tarar (CI, /kapat)
//
// Çıkış kodları: 0 temiz · 1 ihlal bulundu · 2 bekçi hatası.
// Bekçi kendi hatasında da commit'i DURDURUR (fail-closed): çöken bekçi kapıyı açık bırakmamalı.
//
// Kişisel tanımlayıcılar (ad, e-posta, doğum tarihi vb.) bu dosyada TUTULMAZ. Repo dışındaki
// ../private/guard-denylist.txt dosyasından okunur (her satır bir ifade, # ile başlayan satır yorum).
// Dosya yoksa (ör. CI) bu kural atlanır.

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

/**
 * @param {{path: string, content: string|null}[]} entries  content=null: yalnız yol kuralları
 * @param {{denylist?: string[]}} opts
 */
export function scanEntries(entries, { denylist = [] } = {}) {
  const violations = [];
  const deny = denylist.map((d) => d.trim()).filter(Boolean).map((d) => d.toLowerCase());

  for (const { path: rawPath, content } of entries) {
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
        if (m) violations.push({ path: p, line: i + 1, rule: rule.id, detail: rule.why ?? `eşleşme: ${mask(m[0])}` });
      }
      if (deny.length) {
        const lower = text.toLowerCase();
        for (const d of deny) {
          if (lower.includes(d)) violations.push({ path: p, line: i + 1, rule: 'kisisel-tanimlayici', detail: 'denylist ifadesi (değer gösterilmez)' });
        }
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

function loadDenylist(root) {
  const file = process.env.HOOPLAB_GUARD_DENYLIST ?? path.resolve(root, '..', 'private', 'guard-denylist.txt');
  if (!existsSync(file)) return { list: [], file: null };
  const list = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  return { list, file };
}

function collect(mode, root) {
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
  if (mode !== '--staged' && mode !== '--all') {
    console.error('Kullanım: privacy-guard.mjs --staged | --all');
    process.exit(2);
  }
  const root = git(['rev-parse', '--show-toplevel'], process.cwd()).trim();
  const entries = collect(mode, root);
  const { list, file } = loadDenylist(root);
  const violations = scanEntries(entries, { denylist: list });

  const scope = `${entries.length} dosya, kişisel denylist ${file ? `${list.length} ifade` : 'yok (atlandı)'}`;
  if (violations.length === 0) {
    console.log(`[gizlilik-bekcisi] temiz (${scope})`);
    return;
  }
  console.error(`[gizlilik-bekcisi] ${violations.length} ihlal (${scope}):`);
  for (const v of violations) {
    console.error(`  x ${v.path}${v.line ? `:${v.line}` : ''}  ${v.rule}  ${v.detail ?? ''}`);
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
