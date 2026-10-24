#!/usr/bin/env node
// iPhone için Metro'yu tünelle açar: telefon bilgisayarla aynı ağda olmak zorunda değil (mobil veri de olur).
// Varsayılan yol budur (kullanıcı isteği, 2026-10-16; SETUP §8). Bilgisayar açık ve internete bağlı kalmalı.
//
// Neden ayrı betik (LESSONS "Expo / React Native"):
// - `npm run mobile -- --tunnel` bayrağı iç içe `npm run -w` zincirinde düşer.
// - Expo CLI (58) varsayılan olarak Expo hesabı tüneli açar; adresi her başlatmada değişir. ngrok
//   (`--tunnel ngrok`, CLI'da "legacy") adresi kalıcı tutar, Expo Go projeyi son açılanlardan açar.
// - Expo CLI global `@expo/ngrok`'u Windows'ta bulamaz; global klasör NODE_PATH ile verilir.
// Adres kalıcıdır (rastgele kısım apps/mobile/.expo/settings.json'da, gitignore'lu); hazır olunca
// `[tunnel] exp://…` satırı basılır.
//
// Kullanım: npm run mobile:tunnel
//           npm run mobile:tunnel -- --clear   (Metro önbelleğini temizler)

import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shell = process.platform === 'win32';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', shell }).trim();

if (!existsSync(path.join(globalRoot, '@expo', 'ngrok'))) {
  console.error('[tunnel] @expo/ngrok global olarak kurulu değil. Bir kez: npm i -g @expo/ngrok@4.1.3');
  process.exit(1);
}

const env = {
  ...process.env,
  NODE_PATH: [globalRoot, process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
};
const extra = process.argv.slice(2);
const child = spawn('npx', ['expo', 'start', '--tunnel', 'ngrok', ...extra], {
  cwd: path.join(root, 'apps', 'mobile'),
  env,
  shell,
  stdio: ['inherit', 'pipe', 'inherit'],
});

let announced = false;
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (!announced && String(chunk).includes('Tunnel ready')) {
    announced = true;
    void announce();
  }
});
child.on('exit', (code) => process.exit(code ?? 0));

// ngrok'un yerel API'si genel adresi verir; Expo Go için şema exp://.
async function announce() {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:4040/api/tunnels');
      const { tunnels } = await res.json();
      const host = tunnels.map((t) => new URL(t.public_url).host).find(Boolean);
      if (host) {
        console.log(`[tunnel] exp://${host}`);
        return;
      }
    } catch {
      // API henüz açılmadı.
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('[tunnel] adres okunamadı; http://127.0.0.1:4040/api/tunnels');
}
