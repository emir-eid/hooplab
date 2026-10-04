// Gizlilik bekçisinin kendi testleri. Amaç: bekçinin ihlalde GERÇEKTEN kırmızı yandığını (negatif test)
// ve kendi hatasında kapıyı açık bırakmadığını kanıtlamak.
// Sahte sırlar çalışma anında parçalardan kurulur; bu dosyanın kendisi bekçiye takılmaz.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDenylist, scanEntries } from './privacy-guard.mjs';

const GUARD = fileURLToPath(new URL('./privacy-guard.mjs', import.meta.url));
const fake = {
  anthropic: 'sk-' + 'ant-' + 'a'.repeat(40),
  googleKey: 'AI' + 'za' + 'B'.repeat(35),
  oauthSecret: 'GOC' + 'SPX-' + 'c'.repeat(28),
  refresh: '1/' + '/0' + 'd'.repeat(40),
  jwt: ['ey' + 'J' + 'h'.repeat(20), 'ey' + 'J' + 'p'.repeat(20), 's'.repeat(20)].join('.'),
  pem: '-----BEGIN ' + 'PRIVATE KEY-----',
  github: 'gh' + 'p_' + 'Z'.repeat(36),
  sbSecret: 'sb_' + 'secret_' + 'k'.repeat(20),
};

const rulesOf = (entries, opts) => scanEntries(entries, opts).map((v) => v.rule);

test('temiz dosya geçer', () => {
  assert.deepEqual(scanEntries([{ path: 'packages/engine/src/hrv.ts', content: 'export const x = 1;\n' }]), []);
});

test('her sır kalıbı yakalanır', () => {
  const cases = {
    'anthropic-anahtari': fake.anthropic,
    'google-api-anahtari': fake.googleKey,
    'google-oauth-sirri': fake.oauthSecret,
    'google-yenileme-tokeni': fake.refresh,
    jwt: fake.jwt,
    'ozel-anahtar': fake.pem,
    'github-tokeni': fake.github,
    'supabase-gizli-anahtar': fake.sbSecret,
  };
  for (const [rule, secret] of Object.entries(cases)) {
    const found = rulesOf([{ path: 'src/a.ts', content: `const k = "${secret}";` }]);
    assert.ok(found.includes(rule), `${rule} yakalanmadı`);
  }
});

test('ihlal satır numarasıyla raporlanır ve sır maskelenir', () => {
  const [v] = scanEntries([{ path: 'a.md', content: `ilk\nikinci ${fake.anthropic}` }]);
  assert.equal(v.line, 2);
  assert.ok(!v.detail.includes(fake.anthropic), 'sır çıktıda açık görünmemeli');
});

test('yol kuralları: private, .env, veri dosyası, kimlik dosyası', () => {
  assert.ok(rulesOf([{ path: 'private/journal/x.md', content: null }]).includes('private-klasoru'));
  assert.ok(rulesOf([{ path: 'apps/mobile/.env.local', content: null }]).includes('env-dosyasi'));
  assert.ok(rulesOf([{ path: '.env', content: null }]).includes('env-dosyasi'));
  assert.deepEqual(rulesOf([{ path: 'apps/mobile/.env.example', content: '' }]), []);
  assert.ok(rulesOf([{ path: 'exports/hrv.csv', content: null }]).includes('veri-dosyasi'));
  assert.ok(rulesOf([{ path: 'dump/ghealth-sleep.json', content: '{}' }]).includes('saglik-ihraci'));
  assert.ok(rulesOf([{ path: 'client_secret_123.json', content: '{}' }]).includes('kimlik-dosyasi'));
  assert.ok(rulesOf([{ path: 'certs/AuthKey.p8', content: null }]).includes('kimlik-dosyasi'));
});

test('sentetik fixture verisi serbest', () => {
  assert.deepEqual(rulesOf([{ path: 'packages/engine/fixtures/synthetic/hrv.csv', content: 'gun,rmssd\n1,60\n' }]), []);
});

test('ghealth adlı KOD dosyası serbest, yalnız veri uzantıları yakalanır', () => {
  assert.deepEqual(rulesOf([{ path: 'supabase/functions/ghealth-sync/index.ts', content: 'export {}' }]), []);
});

test('EXPO_PUBLIC_ önekiyle sır adı yakalanır', () => {
  const found = rulesOf([{ path: 'apps/mobile/app.config.ts', content: 'process.env.EXPO_PUBLIC_' + 'ANTHROPIC_KEY' }]);
  assert.ok(found.includes('herkese-acik-sir-adi'));
});

test('service_role yalnız mobil kodda yasak', () => {
  const text = 'const role = "service' + '_role";';
  assert.ok(rulesOf([{ path: 'apps/mobile/src/lib/db.ts', content: text }]).includes('mobilde-service-role'));
  assert.deepEqual(rulesOf([{ path: 'supabase/functions/sync/index.ts', content: text }]), []);
});

test('kişisel denylist büyük/küçük harf duyarsız yakalar ve değeri göstermez', () => {
  const v = scanEntries([{ path: 'docs/x.md', content: 'Rapor: AHMET Örnek burada' }], { denylist: ['ahmet örnek'] });
  assert.equal(v.length, 1);
  assert.equal(v[0].rule, 'kisisel-tanimlayici');
  assert.ok(!v[0].detail.toLowerCase().includes('ahmet'));
});

test('denylist: telefon/kimlik no ayraçlı yazılsa da yakalanır', () => {
  const deny = ['5551234567', '12345678901']; // sahte değerler
  const hit = (content) => scanEntries([{ path: 'docs/x.md', content }], { denylist: deny }).length;
  assert.equal(hit('Tel: 0555 123 45 67'), 1);
  assert.equal(hit('Tel: +90 (555) 123-45-67'), 1);
  assert.equal(hit('No: 123 456 789 01'), 1);
  assert.equal(hit('sürüm 5.55.1234.567'), 0, 'noktalı sürüm numarası telefon sanılmamalı');
});

test('denylist: tarih farklı biçimlerde yazılsa da yakalanır', () => {
  const deny = ['31.01.1999']; // sahte değer
  const hit = (content) => scanEntries([{ path: 'docs/x.md', content }], { denylist: deny }).length;
  for (const v of ['31.01.1999', '31/01/1999', '31-01-1999', '1999-01-31', '1999.01.31', '19990131', '31011999']) {
    assert.equal(hit(`tarih ${v}`), 1, `${v} yakalanmadı`);
  }
  assert.equal(hit('tarih 1999-02-28'), 0);
});

// --- Uçtan uca: gerçek git deposunda CLI davranışı ---

function tempRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooplab-guard-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

function runGuard(cwd, mode, extraEnv = {}, args = []) {
  return spawnSync(process.execPath, [GUARD, mode, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOOPLAB_GUARD_DENYLIST: path.join(cwd, '__yok__.txt'), HOOPLAB_GUARD_DENYLIST_TEXT: '', ...extraEnv },
  });
}

const commitAll = (dir, msg) => {
  execFileSync('git', ['add', '-A'], { cwd: dir });
  execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', msg], { cwd: dir });
};

test('denylist ortam değişkeninden okunur (CI secret yolu), yorumlar atlanır', () => {
  const r = loadDenylist(tmpdir(), { HOOPLAB_GUARD_DENYLIST: path.join(tmpdir(), '__yok__.txt'), HOOPLAB_GUARD_DENYLIST_TEXT: '# yorum\nsahte-ifade-1\n\nsahte-ifade-2\n' });
  assert.deepEqual(r.list, ['sahte-ifade-1', 'sahte-ifade-2']);
  assert.deepEqual(r.sources, ['ortam değişkeni']);
});

test('CLI: ortam değişkenindeki denylist ifadesi commit\'i durdurur', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'not.md'), 'burada sahte-ifade-9 geçiyor\n');
    execFileSync('git', ['add', 'not.md'], { cwd: dir });
    const r = runGuard(dir, '--staged', { HOOPLAB_GUARD_DENYLIST_TEXT: 'sahte-ifade-9' });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /kisisel-tanimlayici/);
    assert.ok(!r.stderr.includes('sahte-ifade-9'), 'değer çıktıda görünmemeli');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --history: silinmiş ama geçmişte kalmış sır yakalanır, --all yakalamaz', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'config.ts'), `export const k = "${fake.anthropic}";\n`);
    commitAll(dir, 'sir eklendi');
    rmSync(path.join(dir, 'config.ts'));
    writeFileSync(path.join(dir, 'ok.ts'), 'export const ok = true;\n');
    commitAll(dir, 'sir silindi');
    assert.equal(runGuard(dir, '--all').status, 0, 'güncel ağaç temiz olmalı');
    const r = runGuard(dir, '--history');
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /config\.ts:1\s+anthropic-anahtari/);
    assert.match(r.stderr, /find-object=[0-9a-f]{7}/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --history: geçmişte private/ altında commit edilmiş dosyanın yolu yakalanır', () => {
  const dir = tempRepo();
  try {
    mkdirSync(path.join(dir, 'private'));
    writeFileSync(path.join(dir, 'private', 'not.md'), 'kişisel\n');
    commitAll(dir, 'yanlislikla');
    rmSync(path.join(dir, 'private'), { recursive: true, force: true });
    writeFileSync(path.join(dir, 'ok.ts'), 'export {};\n');
    commitAll(dir, 'duzeltme');
    const r = runGuard(dir, '--history');
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /private\/not\.md\s+private-klasoru/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --history: temiz geçmiş geçer', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'a.ts'), 'export const a = 1;\n');
    commitAll(dir, 'ilk');
    assert.equal(runGuard(dir, '--history').status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --history: commit mesajındaki sır ve denylist ifadesi yakalanır, değer gösterilmez', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'a.ts'), 'export const a = 1;\n');
    commitAll(dir, `anahtar ${fake.anthropic} eklendi`);
    writeFileSync(path.join(dir, 'b.ts'), 'export const b = 1;\n');
    commitAll(dir, 'not: sahte-ifade-7');
    const r = runGuard(dir, '--history', { HOOPLAB_GUARD_DENYLIST_TEXT: 'sahte-ifade-7' });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /commit [0-9a-f]{7}:\d+\s+anthropic-anahtari/);
    assert.match(r.stderr, /commit [0-9a-f]{7}:\d+\s+kisisel-tanimlayici/);
    assert.ok(!r.stderr.includes('sahte-ifade-7'), 'değer çıktıda görünmemeli');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --history: yazar e-postası denylist\'teyse yakalanır', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'a.ts'), 'export const a = 1;\n');
    commitAll(dir, 'ilk');
    const r = runGuard(dir, '--history', { HOOPLAB_GUARD_DENYLIST_TEXT: 'test@example.invalid' });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /commit [0-9a-f]{7}:1\s+kisisel-tanimlayici/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --message: mesajdaki sır commit\'i durdurur, # satırları ve temiz mesaj geçer', () => {
  const dir = tempRepo();
  try {
    const msg = path.join(dir, 'MSG');
    writeFileSync(msg, `[F1] düzeltme ${fake.github}\n`);
    const bad = runGuard(dir, '--message', {}, [msg]);
    assert.equal(bad.status, 1, bad.stderr);
    assert.match(bad.stderr, /commit-mesaji:1\s+github-tokeni/);

    writeFileSync(msg, `[F1] düzeltme\n# ${fake.github}\n`);
    assert.equal(runGuard(dir, '--message', {}, [msg]).status, 0, 'yorum satırı taranmamalı');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --message: dosya yoksa veya verilmezse kapı KAPALI kalır (çıkış 2)', () => {
  const dir = tempRepo();
  try {
    assert.equal(runGuard(dir, '--message', {}, [path.join(dir, 'yok')]).status, 2);
    assert.equal(runGuard(dir, '--message').status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --staged: sır içeren stage edilmiş dosya commit\'i durdurur (çıkış 1)', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'config.ts'), `export const k = "${fake.anthropic}";\n`);
    execFileSync('git', ['add', 'config.ts'], { cwd: dir });
    const r = runGuard(dir, '--staged');
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /anthropic-anahtari/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --staged: temiz stage geçer (çıkış 0)', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, 'ok.ts'), 'export const ok = true;\n');
    execFileSync('git', ['add', 'ok.ts'], { cwd: dir });
    const r = runGuard(dir, '--staged');
    assert.equal(r.status, 0, r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --all: izlenmeyen ama eklenmeye aday .env dosyası yakalanır', () => {
  const dir = tempRepo();
  try {
    writeFileSync(path.join(dir, '.env.local'), 'X=1\n');
    const r = runGuard(dir, '--all');
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /env-dosyasi/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --all: silinmiş ama stage edilmemiş dosya bekçiyi çökertmez', () => {
  const dir = tempRepo();
  try {
    mkdirSync(path.join(dir, 'src'));
    writeFileSync(path.join(dir, 'src', 'gone.ts'), 'export {};\n');
    execFileSync('git', ['add', '-A'], { cwd: dir });
    rmSync(path.join(dir, 'src', 'gone.ts'));
    const r = runGuard(dir, '--all');
    assert.equal(r.status, 0, r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: bekçi hatasında kapı KAPALI kalır (git deposu dışında çıkış 2)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooplab-nogit-'));
  try {
    const r = spawnSync(process.execPath, [GUARD, '--staged'], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir) },
    });
    assert.equal(r.status, 2, r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
