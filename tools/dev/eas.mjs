#!/usr/bin/env node
// EAS CLI'ı apps/mobile/.env.local değerleriyle çalıştırır (karar 0024).
//
// Expo CLI .env.local'ı kendisi yükler, EAS CLI yüklemez (ölçüldü, LESSONS): app.config.ts'in okuduğu
// HOOPLAB_* değerleri olmadan EAS CLI projeyi bulamaz. Değerler yalnız alt sürecin ortamına verilir,
// ekrana veya komut satırına yazılmaz. Sürüm sabit: eas.json'daki cli.version ile uyumlu.
//
// Kullanım: npm run eas -- <eas komutu ve seçenekleri>
//   ör. npm run eas -- project:info
//       npm run eas -- build --platform ios --profile production

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEnv } from '../setup/setup-lib.mjs';

export const EAS_CLI = 'eas-cli@24.10.0';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = path.join(ROOT, 'apps', 'mobile');
const ENV_FILE = path.join(APP, '.env.local');

const fileEnv = existsSync(ENV_FILE) ? Object.fromEntries(parseEnv(readFileSync(ENV_FILE, 'utf8'))) : {};
const env = { ...fileEnv, ...process.env };
const args = ['--yes', EAS_CLI, ...process.argv.slice(2)];

// npm run altında npx'in yolu bilinir: kabuksuz çalıştırılır, argümanlar (ör. --message "...") bölünmez.
const npmCli = process.env.npm_execpath;
const npxCli = npmCli ? path.join(path.dirname(npmCli), 'npx-cli.js') : null;
const child =
  npxCli && existsSync(npxCli)
    ? spawn(process.execPath, [npxCli, ...args], { cwd: APP, stdio: 'inherit', env })
    : spawn('npx', args, { cwd: APP, stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
