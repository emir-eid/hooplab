#!/usr/bin/env node
// Web önizlemesini bulut yerine yerel Supabase'e bağlar (Docker, `npm run db:start`).
// Görsel doğrulama ve ekran görüntüleri sentetik veriyle yapılır (CLAUDE.md §2): gerçek hesaba girilmez.
// Adres ve publishable anahtar `supabase status`'tan okunur; .env.local'a dokunulmaz, değerler ekrana basılmaz.
// Demo girişi supabase/seed.sql içinde.
//
// Kullanım: npm run web:local            (port 8082)
//           npm run web:local -- --port 8090
//           npm run web:local -- --unconfigured   bağlantı değerleri boş: kurulum yapılmamış hali (giriş
//                                                 ekranının uyarısı). Boş değer .env.local'ı da bastırır.

import { execFileSync, spawn } from 'node:child_process';

const shell = process.platform === 'win32';
const args = process.argv.slice(2);
const port = args.includes('--port') ? args[args.indexOf('--port') + 1] : '8082';
const unconfigured = args.includes('--unconfigured');

let url = '';
let key = '';
if (!unconfigured) {
  const status = JSON.parse(
    execFileSync('npx', ['supabase', 'status', '-o', 'json'], { encoding: 'utf8', shell, stdio: ['ignore', 'pipe', 'ignore'] }),
  );
  url = status.API_URL;
  key = status.PUBLISHABLE_KEY;
  if (!url || !key?.startsWith('sb_publishable_')) {
    console.error('[web-local] Yerel Supabase çalışmıyor veya publishable anahtar yok. Önce: npm run db:start');
    process.exit(1);
  }
}
console.log(`[web-local] ${unconfigured ? 'Bağlantı değerleri boş (kurulumsuz)' : `Yerel Supabase: ${url}`} · port ${port}`);

const child = spawn('npx', ['expo', 'start', '--web', '--port', port], {
  cwd: new URL('../../apps/mobile/', import.meta.url),
  stdio: 'inherit',
  shell,
  env: { ...process.env, EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key },
});
child.on('exit', (code) => process.exit(code ?? 0));
