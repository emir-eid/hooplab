#!/usr/bin/env node
// README ekran görüntüleri: demo modu (sentetik sporcu, karar 0022), başsız Chrome + DevTools protokolü.
// Gerçek hesaba girilmez, sunucuya bağlanılmaz (CLAUDE.md §2). iPhone boyutu 390×844, 2x, açık ve koyu tema.
// Önkoşul: web önizlemesi çalışıyor (Metro, varsayılan http://localhost:8081).
//
// Kullanım: npm run screenshots
//           npm run screenshots -- --url http://localhost:8082 --out docs/gorseller
// Chrome yolu: CHROME_PATH ortam değişkeni, yoksa Windows varsayılanı.

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const URL = arg('--url', 'http://localhost:8081/');
const OUT = path.resolve(arg('--out', 'docs/gorseller'));
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function capture(theme, port) {
  // Profil klasörü mutlak yol olmalı: göreli yolla Chrome açılmıyor.
  const profile = mkdtempSync(path.join(tmpdir(), `hooplab-shots-${theme}-`));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let ws;
  let id = 0;
  const pending = new Map();
  try {
    for (let i = 0; i < 150 && !ws; i++) {
      try {
        const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
        if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
      } catch {}
      if (!ws) await sleep(200);
    }
    if (!ws) throw new Error('Chrome açılmadı (CHROME_PATH doğru mu?)');
    await new Promise((r) => ws.addEventListener('open', r));
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      pending.get(m.id)?.(m);
    });
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const i = ++id;
        pending.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
        ws.send(JSON.stringify({ id: i, method, params }));
      });
    const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

    // Görünür yaprak öğe, metne göre; 'last' en alttakini seçer (sekme çubuğu)
    const centerOf = (text, pick) =>
      ev(`(() => {
        const rects = [...document.querySelectorAll('body *')]
          .filter((e) => e.childElementCount === 0 && e.textContent.trim() === ${JSON.stringify(text)})
          .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
          .sort((a, b) => a.y - b.y);
        const r = rects[${pick === 'last' ? 'rects.length - 1' : '0'}];
        return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
      })()`);
    const click = async (text, pick) => {
      let at;
      for (let i = 0; i < 30 && !(at = await centerOf(text, pick)); i++) await sleep(300);
      if (!at) throw new Error(`ekranda bulunamadı: ${text}`);
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 });
      }
      await sleep(1500);
    };
    const scrollToText = async (text) => {
      await ev(`[...document.querySelectorAll('body *')].find((e) => e.childElementCount === 0 && e.textContent.trim() === ${JSON.stringify(text)})?.scrollIntoView({ block: 'start' })`);
      await ev(`(() => { for (const e of document.querySelectorAll('*')) if (e.scrollTop > 0) e.scrollTop -= 24; })()`);
      await sleep(1200);
    };
    const scrollTop = async () => {
      await ev(`(() => { for (const e of document.querySelectorAll('*')) e.scrollTop = 0; window.scrollTo(0, 0); })()`);
      await sleep(600);
    };
    const shot = async (name) => {
      await sleep(800); // hale ve giriş animasyonları otursun
      const { data } = await send('Page.captureScreenshot', { format: 'webp', quality: 88 });
      const file = path.join(OUT, `${name}-${theme}.webp`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`yazıldı: ${path.relative(process.cwd(), file)}`);
    };

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
    await send('Page.navigate', { url: URL });
    await sleep(6000);

    await click('Demoyu aç');
    await click('Hazır');
    await shot('bugun-hazir');
    await click('Toparlan');
    await shot('bugun-toparlan');
    await click('Kontrollü');
    await scrollToText('Gece verisi');
    await shot('gece-verisi');
    await scrollTop();
    await click('Toparlan');
    await click('Vücut', 'last');
    await scrollTop();
    await click('1 hafta');
    await sleep(2500); // 3D sahne
    await shot('vucut');
  } finally {
    ws?.close();
    chrome.kill();
    await sleep(500);
    rmSync(profile, { recursive: true, force: true });
  }
}

mkdirSync(OUT, { recursive: true });
try {
  await capture('light', 9333);
  await capture('dark', 9334);
} catch (err) {
  console.error(`[ekran-goruntuleri] ${err.message}`);
  process.exit(1);
}
