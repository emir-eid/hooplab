#!/usr/bin/env node
// Portfolyo sayfası (karar 0050): tanıtım sayfası (İngilizce + Türkçe) ve uygulamanın yalnız demo web derlemesi.
// Çıktı site/.dist; GitHub Pages iş akışı (.github/workflows/pages.yml) bunu yayınlar.
// Sayılar (kaynak, kural, karar, oturum) ve kaynak izi örneği repodan okunur, sayfaya elle yazılmaz.
// Demo derlemesinde Supabase değerleri boştur: sunucuya, sırra ve gerçek veriye dokunulmaz (CLAUDE.md §2).
//
// Kullanım: node tools/site/build-site.mjs              (demo dahil kur)
//           node tools/site/build-site.mjs --skip-demo  (var olan site/.dist/demo ile, yalnız sayfa)
//           node tools/site/build-site.mjs --serve      (kurduktan sonra http://127.0.0.1:4310/hooplab/ adresinde sun)
// Alt yol: SITE_BASE ortam değişkeni (varsayılan /hooplab, GitHub Pages'te repo adı).

import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = path.join(root, 'site');
const dist = path.join(src, '.dist');
const args = process.argv.slice(2);
const base = (process.env.SITE_BASE ?? '/hooplab').replace(/\/+$/, '');
if (!/^(\/[A-Za-z0-9_-]+)*$/.test(base)) throw new Error(`SITE_BASE geçersiz: ${base}`);

/** Kaynak izi örneği: günün durumunu belirleyen kişisel bant (karar 0021). */
const TRACE_RULE = { module: 'toparlanma', id: 'toparlanma-bant' };

// --- repodan okunan değerler ---

const readText = (...p) => readFileSync(path.join(root, ...p), 'utf8');
const listDir = (...p) => readdirSync(path.join(root, ...p));

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((s) => s.trim());
    out[kv[1]] = v;
  }
  return out;
}

const sourceFiles = listDir('research', 'sources').filter((f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'));
const ruleFiles = listDir('research', 'rules').filter((f) => f.endsWith('.json'));
const rules = ruleFiles.flatMap((f) => JSON.parse(readText('research', 'rules', f)).rules);
const counts = {
  sources: sourceFiles.length,
  rules: rules.length,
  modules: ruleFiles.length,
  decisions: listDir('docs', 'decisions').filter((f) => /^\d{4}-.*\.md$/.test(f)).length,
  sessions: listDir('docs', 'sessions').filter((f) => f.endsWith('.md') && f !== 'README.md').length,
};
for (const [k, v] of Object.entries(counts)) if (!v) throw new Error(`Sayı sıfır çıktı: ${k}`);

const traceRule = JSON.parse(readText('research', 'rules', `${TRACE_RULE.module}.json`)).rules.find((r) => r.id === TRACE_RULE.id);
if (!traceRule) throw new Error(`Kural bulunamadı: ${TRACE_RULE.id}`);
const traceSources = traceRule.sources.map((id) => {
  const fm = frontmatter(readText('research', 'sources', `${id}.md`));
  if (!fm.doi && !fm.pmid) throw new Error(`Kaynağın DOI/PMID'si yok: ${id}`);
  return { id, ...fm };
});

// --- sayfa ---

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function ruleSnippet() {
  const { sources, ...value } = { ...traceRule.value, sources: traceRule.sources };
  const lines = [
    `"id": "${traceRule.id}"`,
    ...Object.entries(value).map(([k, v]) => `"${k}": ${JSON.stringify(v).replace(/,/g, ', ')}`),
    `"sources": [\n${sources.map((s) => `    "${s}"`).join(',\n')}\n  ]`,
  ];
  return esc(`{\n${lines.map((l) => `  ${l}`).join(',\n')}\n}`);
}

function sourceList(t) {
  return traceSources
    .map((s) => {
      const authors = Array.isArray(s.authors) ? s.authors : [s.authors];
      const who = authors.length > 2 ? `${authors[0].split(' ')[0]} et al.` : authors.map((a) => a.split(' ')[0]).join(' & ');
      const link = s.doi ? `https://doi.org/${s.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/`;
      const ref = s.doi ? `doi:${s.doi}` : `PMID ${s.pmid}`;
      const type = t.sourceTypes[s.type] ?? s.type;
      return `<li><span class="src-id">${esc(s.id)}</span><span class="src-title">${esc(s.title)}</span><span class="src-meta">${esc(who)}, ${esc(s.year)}, ${esc(type)}, <a href="${esc(link)}">${esc(ref)}</a></span></li>`;
    })
    .join('\n');
}

function render(lang) {
  const t = JSON.parse(readFileSync(path.join(src, 'strings', `${lang}.json`), 'utf8'));
  const vars = {
    lang,
    base,
    home: lang === 'en' ? `${base}/` : `${base}/${lang}/`,
    altHome: lang === 'en' ? `${base}/tr/` : `${base}/`,
    altLang: lang === 'en' ? 'tr' : 'en',
    repo: 'https://github.com/emir-eid/hooplab',
    demo: `${base}/demo/`,
    ...Object.fromEntries(Object.entries(counts).map(([k, v]) => [`count.${k}`, v])),
    'trace.rule': ruleSnippet(),
    'trace.sources': sourceList(t),
    'trace.count': traceSources.length,
  };
  const fill = (s) => s.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
  // Metinler HTML içerebilir (kendi yazdığımız bağlantılar, <code>); önce içlerindeki değişkenler doldurulur.
  for (const [k, v] of Object.entries(t)) if (typeof v === 'string') vars[`t.${k}`] = fill(v);
  const html = fill(readFileSync(path.join(src, 'index.html'), 'utf8'));
  const left = html.match(/\{\{[^}]*\}\}/);
  if (left) throw new Error(`Doldurulmamış yer tutucu (${lang}): ${left[0]}`);
  return html;
}

// --- kurulum ---

function buildDemo() {
  const out = path.join(dist, 'demo');
  rmSync(out, { recursive: true, force: true });
  // --clear: Metro önbelleği uygulama yapılandırmasını eski haliyle tutup .env.local'daki kimliği pakete
  // taşıyordu (ölçüldü 2026-10-17); yayınlanacak paket her zaman önbelleksiz derlenir.
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', out], {
    cwd: path.join(root, 'apps', 'mobile'),
    env: {
      ...process.env,
      // Boş değer .env.local'ı da bastırır (e2e/serve.mjs ile aynı yol).
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      // Derleme kimliği de boş: yoksa .env.local'daki EAS proje kimliği ve Expo hesap adı web paketine
      // (uygulama yapılandırması olarak) gömülür (ölçüldü 2026-10-17).
      HOOPLAB_IOS_BUNDLE_ID: '',
      HOOPLAB_EAS_PROJECT_ID: '',
      HOOPLAB_EAS_OWNER: '',
      EXPO_PUBLIC_HOOPLAB_DEMO_ONLY: '1',
      HOOPLAB_WEB_BASE_URL: `${base}/demo`,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

mkdirSync(dist, { recursive: true });
if (!args.includes('--skip-demo')) buildDemo();
const demoIndex = path.join(dist, 'demo', 'index.html');
if (!existsSync(demoIndex)) throw new Error('Demo çıktısı yok: --skip-demo olmadan kur.');

for (const entry of readdirSync(dist)) if (entry !== 'demo') rmSync(path.join(dist, entry), { recursive: true, force: true });
writeFileSync(path.join(dist, 'index.html'), render('en'));
mkdirSync(path.join(dist, 'tr'));
writeFileSync(path.join(dist, 'tr', 'index.html'), render('tr'));
copyFileSync(path.join(src, 'site.css'), path.join(dist, 'site.css'));
cpSync(path.join(root, 'docs', 'gorseller'), path.join(dist, 'img'), { recursive: true });
copyFileSync(path.join(root, 'apps', 'mobile', 'assets', 'images', 'favicon.png'), path.join(dist, 'favicon.png'));
// Pages'te Jekyll alt çizgiyle başlayan klasörleri (_expo, __node_modules) yayınlamaz.
writeFileSync(path.join(dist, '.nojekyll'), '');
// Demo tek sayfa: doğrudan açılan alt rota (ör. /demo/trend) Pages'in 404 sayfasına düşer, o da uygulamayı açar.
copyFileSync(demoIndex, path.join(dist, '404.html'));
console.log(`[site] ${path.relative(root, dist)} hazır (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')})`);

// --- yerel sunucu (GitHub Pages'in davranışını taklit eder) ---

if (args.includes('--serve')) {
  const port = Number(args.includes('--port') ? args[args.indexOf('--port') + 1] : 4310);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
  const isFile = (p) => existsSync(p) && statSync(p).isFile();
  createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(`${base}/`)) {
      res.writeHead(302, { location: `${base}/` });
      return res.end();
    }
    const rel = decodeURIComponent(url.pathname.slice(base.length)).replace(/^\/+/, '');
    const p = path.join(dist, rel);
    const file = [p, `${p}.html`, path.join(p, 'index.html')].find((c) => c.startsWith(dist) && isFile(c));
    res.writeHead(file ? 200 : 404, { 'content-type': types[path.extname(file ?? '.html')] ?? 'application/octet-stream' });
    res.end(readFileSync(file ?? path.join(dist, '404.html')));
  }).listen(port, '127.0.0.1', () => console.log(`[site] http://127.0.0.1:${port}${base}/`));
}
