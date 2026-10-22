#!/usr/bin/env node
// PWA derlemesi (karar 0054): gerçek Supabase projesine bağlı, kök adreste static web çıktısı ve Vercel
// yapılandırması. Yayın yapmaz; çıktı apps/mobile/dist-pwa (gitignore'lu). Yayın adımı 0054'te.
//
// Kullanım: npm run pwa:build
// Supabase adresi ve publishable anahtar apps/mobile/.env.local'dan (Expo okur); ikisi de herkese açık değer.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEnv } from '../setup/setup-lib.mjs';
import { pwaReturnUrl, publicEnvProblems, vercelConfig } from './pwa-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const mobile = path.join(root, 'apps', 'mobile');
const out = path.join(mobile, 'dist-pwa');

const envFile = path.join(mobile, '.env.local');
const fileEnv = existsSync(envFile) ? Object.fromEntries(parseEnv(readFileSync(envFile, 'utf8'))) : {};
const problems = publicEnvProblems({ ...fileEnv, ...process.env });
if (problems.length > 0) {
  console.error(`[pwa] derlenmedi:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
// --clear: önbellekteki eski yapılandırma pakete taşınmasın (build-site.mjs ile aynı gerekçe).
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', out], {
  cwd: mobile,
  env: {
    ...process.env,
    // Derleme kimliği boş: EAS proje kimliği ve Expo hesap adı web paketine gömülmesin (build-site.mjs).
    HOOPLAB_IOS_BUNDLE_ID: '',
    HOOPLAB_EAS_PROJECT_ID: '',
    HOOPLAB_EAS_OWNER: '',
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

for (const file of ['index.html', 'manifest.webmanifest', 'explain/hrv.html', '+not-found.html']) {
  if (!existsSync(path.join(out, file))) throw new Error(`[pwa] çıktıda yok: ${file}`);
}
// Vercel statik yayında bilinmeyen adres için 404.html'i gösterir.
copyFileSync(path.join(out, '+not-found.html'), path.join(out, '404.html'));
writeFileSync(path.join(out, 'vercel.json'), `${JSON.stringify(vercelConfig(), null, 2)}\n`);
console.log(`[pwa] ${path.relative(root, out)} hazır. Google dönüş adresi (GHEALTH_WEB_RETURN_URL): ${pwaReturnUrl()}`);
