// Uçtan uca testler: uygulamanın web çıktısı, WebKit (iOS Safari'ye en yakın motor), iPhone boyutu.
// Demo moduyla yürür (sentetik veri, sunucu yok); iOS'a özgü sorunları (klavye, native bileşen) yakalamaz,
// onlar cihazda bakılır. Gerekçe: oturum raporu 2026-10-16 (EAS Maestro ücretsiz planda yok).
//
// Kullanım: npm run e2e                 (çıktıyı kurar ve testleri koşar)
//           npm run e2e -- --ui         (Playwright arayüzü)
//           E2E_NO_BUILD=1 npm run e2e  (var olan e2e/.dist ile)

import { defineConfig, devices } from '@playwright/test';

const port = 4300;

export default defineConfig({
  testDir: './tests',
  outputDir: './.results',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: './.report', open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'iphone-webkit', use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' } }],
  webServer: {
    command: `node e2e/serve.mjs --port ${port}${process.env.E2E_NO_BUILD ? ' --no-build' : ''}`,
    cwd: '..',
    url: `http://127.0.0.1:${port}/sign-in`,
    timeout: 300_000,
    // Açık kalmış bir sunucu eski çıktıyı sunar ve testler eski kodu dener (ölçüldü 2026-10-16); hep yenisi.
    reuseExistingServer: false,
    stdout: 'pipe',
  },
});
