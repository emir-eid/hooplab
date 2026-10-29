#!/usr/bin/env node
// PWA çıktısını (apps/mobile/dist-pwa) yerelde Vercel'in cleanUrls davranışını taklit ederek sunar (karar 0054).
// Yayın değildir; yalnız 127.0.0.1. Önce: npm run pwa:build
//
// Kullanım: node tools/pwa/serve-pwa.mjs [port]   (varsayılan 4320)

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'mobile', 'dist-pwa');
const port = Number(process.argv[2] ?? 4320);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

// cleanUrls: /a → a.html, /a/ → a/index.html; bilinmeyen → 404.html (404).
function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/';
  const base = path.join(root, clean);
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, `${base}.html`, path.join(base, 'index.html')]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

if (!existsSync(root)) {
  console.error('[pwa] çıktı yok; önce npm run pwa:build');
  process.exit(1);
}

createServer((req, res) => {
  const file = resolve(req.url ?? '/');
  const target = file ?? path.join(root, '404.html');
  res.writeHead(file ? 200 : 404, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`[pwa] http://127.0.0.1:${port}`));
