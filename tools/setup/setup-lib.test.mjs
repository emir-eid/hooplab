import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anthropicKeyProblem,
  callbackUrl,
  chooseGoogleJson,
  evaluate,
  FUNCTION_SLUGS,
  isProjectRef,
  mergeEnv,
  migrationVersions,
  newCronSecret,
  parseCliJson,
  parseEnv,
  parseGoogleClient,
  pendingMigrations,
  publishableKeys,
  sha256Hex,
  summarize,
  vaultUpsertSql,
} from './setup-lib.mjs';

// Sentetik değerler; gerçek proje, anahtar veya sır değildir.
const REF = 'abcdefghijklmnopqrst';
const URL = `https://${REF}.supabase.co`;
const KEY = 'sb_publishable_ornekAnahtar123';
const CLIENT = { ok: true, clientId: 'ornek-istemci.apps.googleusercontent.com', clientSecret: 'ornek-sir', redirectUris: [callbackUrl(URL)] };

/** Her şeyi kurulmuş bir bulut projesi; testler yalnız bozdukları olguyu değiştirir. */
function healthyRemote(overrides = {}) {
  const cron = 'c'.repeat(64);
  return {
    target: 'remote',
    cliLoggedIn: true,
    project: { ref: REF, name: 'hooplab', status: 'ACTIVE_HEALTHY' },
    projectUrl: URL,
    vaultUrl: URL,
    expectedKeys: [KEY],
    appEnv: { url: URL, key: KEY },
    localMigrations: ['20261003214426', '20261004112747'],
    remoteMigrations: ['20261003214426', '20261004112747'],
    secretDigests: new Map([
      ['GOOGLE_HEALTH_CLIENT_ID', sha256Hex(CLIENT.clientId)],
      ['GOOGLE_HEALTH_CLIENT_SECRET', sha256Hex(CLIENT.clientSecret)],
      ['GHEALTH_CRON_SECRET', sha256Hex(cron)],
      ['ANTHROPIC_API_KEY', sha256Hex('sk-ant-ornek')],
    ]),
    vaultDigests: new Map([
      ['project_url', sha256Hex(URL)],
      ['ghealth_cron_secret', sha256Hex(cron)],
    ]),
    cronActive: true,
    functions: FUNCTION_SLUGS.map((slug) => ({ slug, status: 'ACTIVE' })),
    signupDisabled: true,
    userCount: 1,
    googleClient: CLIENT,
    ...overrides,
  };
}

const status = (items, id) => items.find((i) => i.id === id)?.status;

test('her şey kuruluysa liste tamam', () => {
  const items = evaluate(healthyRemote());
  assert.ok(summarize(items).done, JSON.stringify(items.filter((i) => i.status !== 'ok')));
});

test('CLI girişi yoksa yalnız giriş adımı istenir', () => {
  const items = evaluate({ target: 'remote', cliLoggedIn: false });
  assert.deepEqual(items.map((i) => [i.id, i.status]), [['cli', 'manual']]);
});

test('bağlı proje yoksa proje seçimi kurulacak adım olur ve gerisi beklenmez', () => {
  const items = evaluate({ target: 'remote', cliLoggedIn: true, project: null });
  assert.equal(status(items, 'project'), 'fix');
  assert.equal(items.length, 2);
});

test('duraklatılmış proje kullanıcıya bırakılır', () => {
  const items = evaluate(healthyRemote({ project: { ref: REF, name: 'x', status: 'INACTIVE' } }));
  assert.equal(status(items, 'project'), 'manual');
});

test('.env.local eksik, başka projeyi gösteriyor veya gizli anahtar içeriyorsa yazılır', () => {
  assert.equal(status(evaluate(healthyRemote({ appEnv: { url: undefined, key: undefined } })), 'app-env'), 'fix');
  assert.equal(status(evaluate(healthyRemote({ appEnv: { url: 'https://baska.supabase.co', key: KEY } })), 'app-env'), 'fix');
  assert.equal(status(evaluate(healthyRemote({ appEnv: { url: URL, key: 'sb_publishable_eski' } })), 'app-env'), 'fix');
  const secret = evaluate(healthyRemote({ appEnv: { url: URL, key: 'sb_secret_ornek' } })).find((i) => i.id === 'app-env');
  assert.equal(secret.status, 'fix');
  assert.match(secret.detail, /gizli anahtar/);
});

test('uygulanmamış migration varsa şema kurulur, ona bağlı adımlar bekler', () => {
  const items = evaluate(healthyRemote({ remoteMigrations: ['20261003214426'] }));
  assert.equal(status(items, 'migrations'), 'fix');
  assert.match(items.find((i) => i.id === 'migrations').detail, /1 migration/);
  assert.equal(status(items, 'cron-secret'), 'blocked');
  assert.equal(status(items, 'vault-url'), 'blocked');
  assert.equal(status(items, 'cron-job'), 'blocked');
});

test('boş projede bütün migrationlar bekler', () => {
  assert.deepEqual(pendingMigrations(['1', '2'], []), ['1', '2']);
  assert.deepEqual(pendingMigrations(['1', '2'], ['1', '2', '3']), []);
});

test('Google sırları eksikse veya JSON dosyasından farklıysa yazılır', () => {
  const missing = healthyRemote();
  missing.secretDigests.delete('GOOGLE_HEALTH_CLIENT_SECRET');
  assert.equal(status(evaluate(missing), 'google-secrets'), 'fix');

  const other = healthyRemote({ googleClient: { ...CLIENT, clientSecret: 'yeni-sir' } });
  assert.equal(status(evaluate(other), 'google-secrets'), 'fix');

  // JSON verilmezse varlık yeterli; geri dönüş adresi denetlenemez, listede yer almaz.
  const noJson = evaluate(healthyRemote({ googleClient: null }));
  assert.equal(status(noJson, 'google-secrets'), 'ok');
  assert.equal(status(noJson, 'google-redirect'), undefined);
});

test("Google istemcisinde geri dönüş adresi yoksa kullanıcının konsol adımı olur", () => {
  const items = evaluate(healthyRemote({ googleClient: { ...CLIENT, redirectUris: ['https://baska.ornek/geri'] } }));
  const item = items.find((i) => i.id === 'google-redirect');
  assert.equal(item.status, 'manual');
  assert.ok(item.detail.includes(callbackUrl(URL)));
});

test("zamanlayıcı sırrı sunucuda ve Vault'ta aynı değilse yeniden üretilir", () => {
  const vault = new Map([
    ['project_url', sha256Hex(URL)],
    ['ghealth_cron_secret', sha256Hex('baska')],
  ]);
  assert.equal(status(evaluate(healthyRemote({ vaultDigests: vault })), 'cron-secret'), 'fix');

  const noSecret = healthyRemote();
  noSecret.secretDigests.delete('GHEALTH_CRON_SECRET');
  assert.equal(status(evaluate(noSecret), 'cron-secret'), 'fix');
});

test("Vault'taki proje adresi yoksa veya farklıysa yazılır", () => {
  const wrong = new Map([
    ['project_url', sha256Hex('https://baska.supabase.co')],
    ['ghealth_cron_secret', sha256Hex('c'.repeat(64))],
  ]);
  const item = evaluate(healthyRemote({ vaultDigests: wrong })).find((i) => i.id === 'vault-url');
  assert.equal(item.status, 'fix');
  assert.match(item.detail, /Başka/);
});

test('eksik veya etkin olmayan fonksiyon dağıtılır', () => {
  const fns = [{ slug: 'ghealth-connect', status: 'ACTIVE' }, { slug: 'ghealth-sync', status: 'THROTTLED' }];
  const item = evaluate(healthyRemote({ functions: fns })).find((i) => i.id === 'functions');
  assert.equal(item.status, 'fix');
  assert.match(item.detail, /ghealth-callback, ghealth-sync/);
});

test('yeni kayıt açıksa ve kullanıcı yoksa ikisi de kullanıcının adımı', () => {
  const items = evaluate(healthyRemote({ signupDisabled: false, userCount: 0 }));
  assert.equal(status(items, 'signup'), 'manual');
  assert.equal(status(items, 'owner'), 'manual');
});

test('zamanlayıcı yoksa veya kapalıysa kullanıcıya bırakılır', () => {
  assert.equal(status(evaluate(healthyRemote({ cronActive: null })), 'cron-job'), 'manual');
  assert.equal(status(evaluate(healthyRemote({ cronActive: false })), 'cron-job'), 'manual');
});

test('Anthropic anahtarı yoksa gizli girişle istenecek adım olur; sırlar okunamazsa bekler (karar 0032)', () => {
  const missing = healthyRemote();
  missing.secretDigests.delete('ANTHROPIC_API_KEY');
  const item = evaluate(missing).find((i) => i.id === 'anthropic-key');
  assert.equal(item?.status, 'fix');
  assert.match(item?.detail ?? '', /gizli girişle/);
  assert.equal(status(evaluate(healthyRemote({ secretDigests: null })), 'anthropic-key'), 'blocked');
  assert.equal(status(evaluate(healthyRemote()), 'anthropic-key'), 'ok');
});

test('Anthropic anahtar biçimi: boş, boşluklu, yanlış önekli ve Admin anahtarı reddedilir', () => {
  assert.equal(anthropicKeyProblem('sk-ant-api03-ornek'), null);
  for (const bad of ['', 'sk-ant-api03 ornek', 'sb_secret_ornek', 'sk-ornek', 'sk-ant-admin01-ornek']) {
    assert.ok(anthropicKeyProblem(bad), bad);
  }
  assert.doesNotMatch(anthropicKeyProblem('sk-ant-admin01-gizliDeger') ?? '', /gizliDeger/, 'mesaj değeri içermez');
});

test('yerel hedefte .env.local, fonksiyon dağıtımı ve geri dönüş adresi denetlenmez', () => {
  const local = healthyRemote({ target: 'local', localRunning: true, vaultUrl: 'http://supabase_kong_hooplab:8000' });
  local.vaultDigests.set('project_url', sha256Hex('http://supabase_kong_hooplab:8000'));
  const items = evaluate(local);
  assert.ok(summarize(items).done, JSON.stringify(items.filter((i) => i.status !== 'ok')));
  for (const id of ['app-env', 'functions', 'google-redirect', 'cli', 'project', 'anthropic-key']) assert.equal(status(items, id), undefined, id);
  assert.equal(status(items, 'stack'), 'ok');
});

test('yerel Supabase çalışmıyorsa yalnız başlatma adımı istenir', () => {
  assert.deepEqual(evaluate({ target: 'local', localRunning: false }).map((i) => i.status), ['manual']);
});

test('Google JSON: Web istemcisi kabul, Desktop ve bozuk dosya ret', () => {
  const web = parseGoogleClient(JSON.stringify({ web: { client_id: 'a', client_secret: 'b', redirect_uris: ['u', 3] } }));
  assert.deepEqual(web, { ok: true, clientId: 'a', clientSecret: 'b', redirectUris: ['u'] });
  assert.equal(parseGoogleClient(JSON.stringify({ installed: { client_id: 'a', client_secret: 'b' } })).problem, 'desktop-client');
  assert.equal(parseGoogleClient('{').problem, 'not-json');
  assert.equal(parseGoogleClient('{}').problem, 'not-web');
  assert.equal(parseGoogleClient(JSON.stringify({ web: { client_id: 'a' } })).problem, 'missing-fields');
});

test('mergeEnv yorumları ve başka anahtarları korur, olanı günceller, olmayanı ekler', () => {
  const before = '# yorum\r\nA=1\nGHEALTH_AUTH_URL=http://127.0.0.1:54399/auth\n';
  const after = mergeEnv(before, { A: '2', B: '3' });
  assert.equal(after, '# yorum\nA=2\nGHEALTH_AUTH_URL=http://127.0.0.1:54399/auth\nB=3\n');
  assert.equal(mergeEnv('', { A: '1' }), 'A=1\n');
  assert.deepEqual([...parseEnv(after)], [['A', '2'], ['GHEALTH_AUTH_URL', 'http://127.0.0.1:54399/auth'], ['B', '3']]);
});

test('parseEnv tırnakları soyar, yorum ve bozuk satırı atlar', () => {
  const env = parseEnv('# x\nA="1"\nB=\'iki\'\n=bos\nC\nD = 4 ');
  assert.deepEqual([...env], [['A', '1'], ['B', 'iki'], ['D', '4']]);
});

test('parseCliJson düz ve ajan sarmalı çıktıyı, önündeki durum satırlarıyla okur', () => {
  assert.deepEqual(parseCliJson('Initialising login role...\n[{"a":1}]'), [{ a: 1 }]);
  assert.deepEqual(parseCliJson('{"boundary":"x","rows":[{"a":1}],"warning":"w"}'), [{ a: 1 }]);
  assert.deepEqual(parseCliJson('{"API_URL":"http://127.0.0.1:54321"}'), { API_URL: 'http://127.0.0.1:54321' });
  assert.throws(() => parseCliJson('JSON yok'));
});

test('publishableKeys gizli ve eski anahtarları almaz', () => {
  const keys = [
    { type: 'legacy', name: 'anon', api_key: 'eyJ...' },
    { type: 'legacy', name: 'service_role', api_key: 'eyJ...' },
    { type: 'publishable', name: 'default', api_key: KEY },
    { type: 'secret', name: 'default', api_key: 'sb_secret_••••' },
  ];
  assert.deepEqual(publishableKeys(keys), [KEY]);
});

test('migrationVersions yalnız zaman damgalı SQL dosyalarını sıralı alır', () => {
  assert.deepEqual(migrationVersions(['20261004112747_b.sql', 'README.md', '20261003214426_a.sql', '2026_x.sql']), [
    '20261003214426',
    '20261004112747',
  ]);
});

test('vaultUpsertSql tek komut ve tırnağı kaçırır', () => {
  const sql = vaultUpsertSql('project_url', "a'b");
  assert.ok(sql.startsWith('do $hooplab$'));
  assert.ok(sql.includes("'a''b'"));
  assert.ok(!sql.replace(/;\n/g, '').includes(';;'));
  assert.ok(!/\$hooplab\$[\s\S]*\$hooplab\$[\s\S]*;\s*$/.test(sql), 'blok sonrası ikinci komut yok');
});

test('yardımcılar: proje kimliği biçimi, rastgele sır, özet', () => {
  assert.ok(isProjectRef(REF));
  assert.ok(!isProjectRef('ABC'));
  assert.ok(!isProjectRef(`${REF}; rm`));
  const a = newCronSecret();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, newCronSecret());
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('yerel hedef gerçek Google JSON dosyasını kendiliğinden okumaz', () => {
  const base = { defaultPath: '/private/web.json', defaultExists: true };
  assert.equal(chooseGoogleJson({ ...base, local: true }), null);
  assert.equal(chooseGoogleJson({ ...base, local: true, explicit: '/sentetik.json' }), '/sentetik.json');
  assert.equal(chooseGoogleJson({ ...base, local: false }), '/private/web.json');
  assert.equal(chooseGoogleJson({ ...base, local: false, defaultExists: false }), null);
});
