// Bekçi: CI'daki uçtan uca işinin Playwright imajı, kökteki @playwright/test sürümüyle aynı olmalı.
// Sürüm yükselip imaj eski kalırsa imajdaki WebKit test paketinin beklediği sürümle uyuşmaz ve iş düşer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

test('checks.yml Playwright imajı @playwright/test sürümüyle aynı', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const version = (pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test'] ?? '').replace(/^[\^~]/, '');
  assert.match(version, /^\d+\.\d+\.\d+$/, '@playwright/test tam sürümle sabitlenmeli');
  const workflow = readFileSync(new URL('.github/workflows/checks.yml', root), 'utf8');
  const tags = [...workflow.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/g)].map((m) => m[1]);
  assert.ok(tags.length > 0, 'checks.yml içinde Playwright imajı bulunamadı');
  for (const tag of tags) assert.equal(tag, version);
});
