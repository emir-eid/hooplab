#!/usr/bin/env node
// Uçtan uca testler için web çıktısını kurar ve sunar (Playwright `webServer`).
// Çıktı Supabase değerleri boş derlenir: uygulama "kurulmamış" halde açılır, testler demo moduyla
// (sentetik sporcu, karar 0022) yürür; sunucuya, sırra ve gerçek veriye dokunulmaz (CLAUDE.md §2).
// Expo'nun `static` web çıktısı rota başına HTML üretir: /trend → trend.html, /me → me/index.html,
// /explain/x → explain/[id].html.
//
// Kullanım: node e2e/serve.mjs [--port 4300] [--no-build]

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'e2e', '.dist');
const args = process.argv.slice(2);
const port = Number(args.includes('--port') ? args[args.indexOf('--port') + 1] : 4300);

if (!args.includes('--no-build')) {
  // --clear: Metro önbelleği uygulama yapılandırmasını eski haliyle tutabiliyor (ölçüldü 2026-10-17).
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', dist], {
    cwd: path.join(root, 'apps', 'mobile'),
    // Boş değer .env.local'ı da bastırır (tools/dev/web-local.mjs ile aynı yol).
    // Derleme kimliği de boş: yoksa .env.local'daki EAS proje kimliği ve Expo hesap adı pakete gömülür.
    env: {
      ...process.env,
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      HOOPLAB_IOS_BUNDLE_ID: '',
      HOOPLAB_EAS_PROJECT_ID: '',
      HOOPLAB_EAS_OWNER: '',
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

/** URL yolunu dist içindeki dosyaya çevirir; bulunamazsa null. */
function resolveFile(urlPath) {
  const rel = decodeURIComponent(urlPath).replace(/^\/+|\/+$/g, '');
  const base = path.join(dist, rel);
  if (!base.startsWith(dist)) return null;
  for (const candidate of [base, `${base}.html`, path.join(base, 'index.html')]) {
    if (isFile(candidate)) return candidate;
  }
  // Dinamik rota: son parça yerine aynı klasördeki [ad].html.
  const dir = path.dirname(base);
  if (existsSync(dir) && statSync(dir).isDirectory()) {
    const dynamic = readdirSync(dir).find((f) => /^\[[^\]]+\]\.html$/.test(f));
    if (dynamic) return path.join(dir, dynamic);
  }
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const file = resolveFile(url.pathname);
  if (!file) {
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(readFileSync(path.join(dist, '+not-found.html')));
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => {
  console.log(`[e2e] web çıktısı http://127.0.0.1:${port}`);
});
