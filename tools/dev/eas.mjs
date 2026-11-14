#!/usr/bin/env node
// EAS CLI'ı apps/mobile/.env.local değerleriyle çalıştırır (karar 0024).
//
// Expo CLI .env.local'ı kendisi yükler, EAS CLI yüklemez (ölçüldü, LESSONS): app.config.ts'in okuduğu
// HOOPLAB_* değerleri olmadan EAS CLI projeyi bulamaz. Değerler yalnız alt sürecin ortamına verilir,
// ekrana veya komut satırına yazılmaz. Sürüm sabit: eas.json'daki cli.version ile uyumlu.
//
// TestFlight'a gönderen komutlarda (`submit`, `build --auto-submit`) HOOPLAB_ASC_APP_ID varsa eas.json'daki
// submit profillerine komut süresince ascAppId eklenir ve komut bitince (Ctrl+C dahil) özgün metin geri
// yazılır (0024 eki): EAS bu alanı ortamdan okumuyor, repoya da kişiye ait kimlik yazılmıyor (0009).
//
// Kullanım: npm run eas -- <eas komutu ve seçenekleri>
//   ör. npm run eas -- project:info
//       npm run eas -- build --platform ios --profile production --auto-submit --non-interactive

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEnv } from '../setup/setup-lib.mjs';
import { hasAscAppId, isValidAscAppId, needsAscAppId, withAscAppId, withoutAscAppId } from './eas-lib.mjs';

export const EAS_CLI = 'eas-cli@27.10.0';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = path.join(ROOT, 'apps', 'mobile');
const ENV_FILE = path.join(APP, '.env.local');
const EAS_JSON = path.join(APP, 'eas.json');

const fileEnv = existsSync(ENV_FILE) ? Object.fromEntries(parseEnv(readFileSync(ENV_FILE, 'utf8'))) : {};
const env = { ...fileEnv, ...process.env };
const easArgs = process.argv.slice(2);
const args = ['--yes', EAS_CLI, ...easArgs];

// Yarıda kalmış bir çalıştırma eas.json'da numara bıraktıysa önce temizlenir.
let original = readFileSync(EAS_JSON, 'utf8');
if (hasAscAppId(original)) {
  original = withoutAscAppId(original);
  writeFileSync(EAS_JSON, original);
  console.error('[eas] eas.json\'da önceki çalıştırmadan kalan ascAppId silindi.');
}

let injected = false;
if (needsAscAppId(easArgs)) {
  const ascAppId = env.HOOPLAB_ASC_APP_ID;
  if (ascAppId === undefined || ascAppId === '') {
    console.error('[eas] HOOPLAB_ASC_APP_ID yok: EAS uygulamayı Apple girişiyle bulur (etkileşimli).');
  } else if (!isValidAscAppId(ascAppId)) {
    console.error('[eas] HOOPLAB_ASC_APP_ID yalnız rakamlardan oluşmalı (apps/mobile/.env.local).');
    process.exit(1);
  } else {
    writeFileSync(EAS_JSON, withAscAppId(original, ascAppId));
    injected = true;
  }
}

let restored = false;
function restore() {
  if (!injected || restored) return;
  writeFileSync(EAS_JSON, original);
  restored = true;
}

// Ctrl+C alt sürece de gider; sarmalayıcı onun bitmesini bekler, sonra eas.json'u geri yazar.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP']) {
  process.on(signal, () => {});
}
process.on('exit', restore);

// npm run altında npx'in yolu bilinir: kabuksuz çalıştırılır, argümanlar (ör. --message "...") bölünmez.
const npmCli = process.env.npm_execpath;
const npxCli = npmCli ? path.join(path.dirname(npmCli), 'npx-cli.js') : null;
const child =
  npxCli && existsSync(npxCli)
    ? spawn(process.execPath, [npxCli, ...args], { cwd: APP, stdio: 'inherit', env })
    : spawn('npx', args, { cwd: APP, stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('error', () => {
  restore();
  process.exitCode = 1;
});
child.on('exit', (code) => {
  restore();
  process.exitCode = code ?? 1;
});
