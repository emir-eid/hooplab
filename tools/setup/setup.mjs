#!/usr/bin/env node
// Kurulum sihirbazı: HoopLab'in sunucu tarafını kullanıcının kendi Supabase projesine kurar ve denetler
// (karar 0023, rehber docs/guides/kurulum.md). Kurallar setup-lib.mjs'te; bu dosya CLI, dosya ve ağ işleri.
//
// Kullanım:
//   npm run setup                         eksikleri sorarak kurar; elle yapılacakları numaralı listeler
//   npm run setup -- --check              yalnız denetler, hiçbir şeyi değiştirmez (çıkış 1 = eksik var)
//   npm run setup -- --local              bulut yerine yerel Supabase (Docker, npm run db:start)
//   --project-ref <ref>                   projeyi sormadan seç
//   --google-json <yol>                   Google Web istemcisinin JSON'u
//                                         (varsayılan yalnız bulutta: ../private/ghealth/web_client_secret.json;
//                                         --local sahte / sentetik değerlerle çalışır, gerçek dosyayı kendiliğinden okumaz)
//   --redeploy                            Edge Functions'ı zaten dağıtılmış olsa da yeniden dağıt
//   --yes                                 onay sorularını evet say
//
// Gizlilik: sır değerleri ekrana, komut satırına veya repoya yazılmaz. Sunucuya giden sırlar geçici bir
// dosyadan okunur (CLI --env-file / --file) ve dosya hemen silinir. Anthropic API anahtarı (karar 0032)
// yalnız etkileşimli terminalde gizli girişle istenir: yazılırken yıldız görünür, değer yazdırılmaz. `projects api-keys` çıktısı eski
// service_role anahtarını açık verir (ölçüldü); bu çıktı hiçbir koşulda yazdırılmaz.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import {
  ANTHROPIC_SECRET_NAME,
  anthropicKeyProblem,
  callbackUrl,
  chooseGoogleJson,
  CRON_SECRET_NAME,
  evaluate,
  FUNCTION_SLUGS,
  googleClientProblems,
  isProjectRef,
  mergeEnv,
  migrationVersions,
  newCronSecret,
  parseCliJson,
  parseEnv,
  parseGoogleClient,
  projectUrlFromRef,
  publishableKeys,
  sha256Hex,
  summarize,
  VAULT_CRON,
  VAULT_DIGEST_SQL,
  VAULT_URL,
  vaultUpsertSql,
} from './setup-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP_ENV = path.join(ROOT, 'apps', 'mobile', '.env.local');
const FUNCTIONS_ENV = path.join(ROOT, 'supabase', 'functions', '.env');
const LINKED_REF = path.join(ROOT, 'supabase', '.temp', 'project-ref');
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');
const DEFAULT_GOOGLE_JSON = path.resolve(ROOT, '..', 'private', 'ghealth', 'web_client_secret.json');

// --- Argümanlar ---

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const opts = {
  check: flag('--check'),
  local: flag('--local'),
  yes: flag('--yes'),
  redeploy: flag('--redeploy'),
  projectRef: option('--project-ref'),
  googleJson: option('--google-json'),
};
if (opts.projectRef && !isProjectRef(opts.projectRef)) fail('--project-ref 20 küçük harften oluşmalı (Supabase proje kimliği).');

function fail(message) {
  console.error(`[kurulum] ${message}`);
  process.exit(2);
}

// --- Supabase CLI ---

// Kök devDependency'deki CLI doğrudan Node ile çalıştırılır: kabuk yok, argümanlar tırnak sorunu yaşamaz.
const CLI = (() => {
  const require = createRequire(import.meta.url);
  try {
    const pkgPath = require.resolve('supabase/package.json', { paths: [ROOT] });
    return path.join(path.dirname(pkgPath), require(pkgPath).bin.supabase);
  } catch {
    fail('Supabase CLI bulunamadı. Önce kök klasörde: npm install');
  }
})();

/** `--agent no`: CLI yapay zeka ajanı altında çalıştığını sezince çıktı biçimini değiştiriyor (LESSONS). */
function cli(args, { interactive = false } = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args, '--agent', 'no'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  return { ok: r.status === 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function cliJson(args) {
  const r = cli([...args, '-o', 'json']);
  if (!r.ok) return null;
  try {
    return parseCliJson(r.stdout);
  } catch {
    return null;
  }
}

function lastLine(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '';
}

/** Değer içeren bir dosyayı geçici klasöre yazar, işi yapar, dosyayı siler. */
function withTempFile(name, content, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooplab-kurulum-'));
  const file = path.join(dir, name);
  try {
    writeFileSync(file, content, { mode: 0o600 });
    return fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

// --- Sorular ---

let rl;
let localEnvChanged = false;
async function ask(question) {
  rl ??= createInterface({ input: process.stdin, output: process.stdout });
  return (await rl.question(question)).trim();
}

async function confirm(question) {
  if (opts.yes) {
    console.log(`${question} evet (--yes)`);
    return true;
  }
  if (!process.stdin.isTTY) {
    console.log(`${question} hayır (etkileşimsiz; onay için --yes)`);
    return false;
  }
  return /^(e|evet|y|yes)$/i.test(await ask(`${question} [e/h] `));
}

/**
 * Gizli giriş: terminal ham kipte okunur, her karakter için yıldız yazılır. Yapıştırma tek parça gelir.
 * Boş giriş = atla. Ctrl+C iptal eder.
 */
async function askHidden(question) {
  rl?.close();
  rl = undefined;
  const stdin = process.stdin;
  process.stdout.write(question);
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          cleanup();
          resolve(value.trim());
          return;
        }
        if (ch === '\u0003') {
          cleanup();
          reject(new Error('İptal edildi.'));
          return;
        }
        if (ch === '\u007f' || ch === '\b') {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else if (ch >= ' ') {
          value += ch;
          process.stdout.write('*');
        }
      }
    };
    stdin.on('data', onData);
  });
}

// --- Olgular ---

function databaseQuery(target, sql) {
  return cliJson(['db', 'query', ...target, sql]);
}

/** Uygulanmış migration'lar; tablo hiç yoksa (boş proje) boş liste. */
function appliedMigrations(target) {
  const rows = databaseQuery(target, 'select version from supabase_migrations.schema_migrations order by version');
  if (rows) return rows.map((r) => String(r.version));
  const probe = databaseQuery(target, "select to_regclass('supabase_migrations.schema_migrations') is not null as present");
  return probe && probe[0]?.present === false ? [] : null;
}

function databaseFacts(target) {
  const users = databaseQuery(target, 'select count(*)::int as users from auth.users');
  const vault = databaseQuery(target, VAULT_DIGEST_SQL);
  const cron = databaseQuery(target, "select active from cron.job where jobname = 'google-health-senkron'");
  return {
    remoteMigrations: appliedMigrations(target),
    userCount: users ? Number(users[0]?.users ?? 0) : null,
    vaultDigests: vault ? new Map(vault.map((r) => [r.name, r.digest])) : null,
    cronActive: cron ? (cron.length ? Boolean(cron[0].active) : null) : null,
  };
}

async function signupDisabled(apiUrl, key) {
  if (!key) return null;
  try {
    const res = await fetch(`${apiUrl}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.disable_signup === 'boolean' ? json.disable_signup : null;
  } catch {
    return null;
  }
}

function loadGoogleClient() {
  const file = chooseGoogleJson({
    explicit: opts.googleJson && path.resolve(opts.googleJson),
    local: opts.local,
    defaultPath: DEFAULT_GOOGLE_JSON,
    defaultExists: existsSync(DEFAULT_GOOGLE_JSON),
  });
  if (!file) return { client: null };
  if (!existsSync(file)) fail(`Google JSON dosyası yok: ${file}`);
  const parsed = parseGoogleClient(readFileSync(file, 'utf8'));
  if (!parsed.ok) fail(googleClientProblems[parsed.problem]);
  return { client: parsed, file };
}

function localMigrations() {
  return migrationVersions(readdirSync(MIGRATIONS));
}

async function remoteFacts(google) {
  const projects = cliJson(['projects', 'list']);
  if (!projects) return { target: 'remote', cliLoggedIn: false };
  const ref = opts.projectRef ?? (readText(LINKED_REF).trim() || null);
  const project = ref ? projects.find((p) => p.ref === ref) : null;
  if (!project) return { target: 'remote', cliLoggedIn: true, projects, project: null };

  const projectUrl = projectUrlFromRef(project.ref);
  const base = { target: 'remote', cliLoggedIn: true, projects, project, projectUrl, vaultUrl: projectUrl };
  if (project.status !== 'ACTIVE_HEALTHY') return base;

  const apiKeys = cliJson(['projects', 'api-keys', '--project-ref', project.ref]) ?? [];
  const expectedKeys = publishableKeys(apiKeys);
  const appEnv = parseEnv(readText(APP_ENV));
  const secrets = cliJson(['secrets', 'list', '--project-ref', project.ref]);
  const functions = cliJson(['functions', 'list', '--project-ref', project.ref]);
  return {
    ...base,
    expectedKeys,
    appEnv: { url: appEnv.get('EXPO_PUBLIC_SUPABASE_URL'), key: appEnv.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') },
    localMigrations: localMigrations(),
    ...databaseFacts(['--linked', '--project-ref', project.ref]),
    secretDigests: secrets ? new Map(secrets.map((s) => [s.name, s.value])) : null,
    functions,
    signupDisabled: await signupDisabled(projectUrl, expectedKeys[0]),
    googleClient: google.client,
  };
}

function localProjectId() {
  return /^project_id\s*=\s*"([^"]+)"/m.exec(readText(path.join(ROOT, 'supabase', 'config.toml')))?.[1] ?? 'hooplab';
}

async function localFacts(google) {
  const status = cliJson(['status']);
  if (!status?.API_URL) return { target: 'local', localRunning: false };
  const env = parseEnv(readText(FUNCTIONS_ENV));
  return {
    target: 'local',
    localRunning: true,
    apiUrl: status.API_URL,
    // Veritabanı konteyneri fonksiyonlara Kong konteyneri üzerinden ulaşır (LESSONS "Supabase").
    vaultUrl: `http://supabase_kong_${localProjectId()}:8000`,
    localMigrations: localMigrations(),
    ...databaseFacts(['--local']),
    secretDigests: new Map([...env].filter(([, v]) => v).map(([k, v]) => [k, sha256Hex(v)])),
    signupDisabled: await signupDisabled(status.API_URL, status.PUBLISHABLE_KEY),
    googleClient: google.client,
  };
}

const gather = (google) => (opts.local ? localFacts(google) : remoteFacts(google));

// --- Rapor ---

const marks = { ok: 'tamam ', fix: 'kurulacak', manual: 'senin adımın', blocked: 'bekliyor' };

function report(items, title) {
  console.log(`\n${title}`);
  for (const item of items) {
    const detail = item.detail ? ` — ${item.detail}` : '';
    console.log(`  [${marks[item.status]}] ${item.label}${detail}`);
  }
  const s = summarize(items);
  console.log(`  Toplam: ${s.ok} tamam, ${s.fix} kurulacak, ${s.manual} senin adımın, ${s.blocked} bekliyor.`);
}

function manualSteps(items, facts) {
  const steps = items.filter((i) => i.status === 'manual');
  if (!steps.length) return;
  console.log('\nSenin yapman gerekenler:');
  steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.label}: ${s.detail}`));
  if (facts.target === 'remote' && facts.projectUrl && !facts.googleClient) {
    console.log(
      `  ${steps.length + 1}. Google Cloud'daki Web istemcisinde geri dönüş adresi şu olmalı: ${callbackUrl(facts.projectUrl)}` +
        ' (JSON dosyasını --google-json ile verirsen sihirbaz bunu kendisi denetler).',
    );
  }
}

// --- Kurulum adımları ---

async function chooseProject(facts) {
  if (!facts.projects.length) {
    console.log('\nBu hesapta Supabase projesi yok. Panoda yeni bir proje aç (supabase.com/dashboard → New project), sonra sihirbazı yeniden çalıştır.');
    return false;
  }
  let ref = opts.projectRef;
  if (!ref) {
    console.log('\nHesaptaki projeler:');
    facts.projects.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.ref}, ${p.region}, ${p.status})`));
    if (!process.stdin.isTTY) {
      console.log('Etkileşimsiz çalışıyor; projeyi --project-ref ile ver.');
      return false;
    }
    const pick = Number(await ask('Hangi proje? Numara: '));
    ref = facts.projects[pick - 1]?.ref;
    if (!ref) return false;
  }
  if (!(await confirm(`Bu klasör ${ref} projesine bağlansın mı (supabase link)?`))) return false;
  const r = cli(['link', '--project-ref', ref], { interactive: true });
  if (r.ok) opts.projectRef = ref;
  return r.ok;
}

async function ensureLinked(ref) {
  if (readText(LINKED_REF).trim() === ref) return true;
  return cli(['link', '--project-ref', ref], { interactive: true }).ok;
}

async function writeAppEnv(facts) {
  const key = facts.expectedKeys[0];
  if (!key) {
    console.log('Projede publishable anahtar yok. Panoda Project Settings → API Keys → publishable anahtar oluştur.');
    return;
  }
  const existing = readText(APP_ENV);
  if (existing && !(await confirm('apps/mobile/.env.local bu projenin değerleriyle güncellensin mi?'))) return;
  writeFileSync(APP_ENV, mergeEnv(existing, { EXPO_PUBLIC_SUPABASE_URL: facts.projectUrl, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }));
  console.log('apps/mobile/.env.local yazıldı (Metro çalışıyorsa yeniden başlat).');
}

async function pushMigrations(facts) {
  if (facts.target === 'local') {
    if (await confirm("Bekleyen migration'lar yerel veritabanına uygulansın mı?")) cli(['migration', 'up', '--local'], { interactive: true });
    return;
  }
  if (!(await ensureLinked(facts.project.ref))) return;
  console.log('\nUygulanacak migration\'lar (deneme, değişiklik yok):');
  if (!cli(['db', 'push', '--dry-run'], { interactive: true }).ok) return;
  if (!(await confirm('Bu migration\'lar buluta uygulansın mı?'))) return;
  cli(['db', 'push', '--yes'], { interactive: true });
}

async function resolveGoogleClient(google) {
  if (google.client) return google.client;
  if (!process.stdin.isTTY) {
    console.log('Google istemci sırları için --google-json <yol> ver (Web istemcisinin JSON dosyası, rehber §4a).');
    return null;
  }
  const answer = await ask('Google Web istemcisinin JSON dosyasının yolu (boş = şimdilik geç): ');
  if (!answer) return null;
  const file = path.resolve(answer.replace(/^["']|["']$/g, ''));
  if (!existsSync(file)) {
    console.log(`Dosya yok: ${file}`);
    return null;
  }
  const parsed = parseGoogleClient(readFileSync(file, 'utf8'));
  if (!parsed.ok) {
    console.log(googleClientProblems[parsed.problem]);
    return null;
  }
  google.client = parsed;
  google.file = file;
  return parsed;
}

/** Sırları sunucuya (bulut) ya da supabase/functions/.env'e (yerel) yazar. */
function writeSecrets(facts, values) {
  if (facts.target === 'local') {
    writeFileSync(FUNCTIONS_ENV, mergeEnv(readText(FUNCTIONS_ENV), values));
    return true;
  }
  const body = Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n');
  const r = withTempFile('secrets.env', `${body}\n`, (file) =>
    cli(['secrets', 'set', '--project-ref', facts.project.ref, '--env-file', file]),
  );
  if (!r.ok) console.log(`Sırlar yazılamadı: ${lastLine(r.stderr)}`);
  return r.ok;
}

function writeVault(facts, name, value) {
  const target = facts.target === 'local' ? ['--local'] : ['--linked', '--project-ref', facts.project.ref];
  const r = withTempFile('vault.sql', vaultUpsertSql(name, value), (file) => cli(['db', 'query', ...target, '--file', file]));
  if (!r.ok) console.log(`Vault'a yazılamadı (${name}): ${lastLine(r.stderr)}`);
  return r.ok;
}

async function applyFixes(items, facts, google) {
  const todo = new Set(items.filter((i) => i.status === 'fix').map((i) => i.id));
  const where = facts.target === 'local' ? 'supabase/functions/.env' : 'Supabase secrets';

  if (todo.has('app-env')) await writeAppEnv(facts);
  if (todo.has('migrations')) await pushMigrations(facts);

  if (todo.has('google-secrets')) {
    const client = await resolveGoogleClient(google);
    if (client && (await confirm(`Google istemci kimliği ve sırrı ${where} içine yazılsın mı?`))) {
      if (writeSecrets(facts, { GOOGLE_HEALTH_CLIENT_ID: client.clientId, GOOGLE_HEALTH_CLIENT_SECRET: client.clientSecret })) {
        console.log(`Google istemci sırları ${where} içine yazıldı.`);
      }
    }
  }

  if (todo.has('anthropic-key')) {
    if (!process.stdin.isTTY) {
      console.log(`${ANTHROPIC_SECRET_NAME} gizli girişle istenir; etkileşimli bir terminalde npm run setup çalıştır.`);
    } else {
      console.log('\nAI koç için Anthropic API anahtarı (Console → API keys). Yazarken yıldız görünür; boş bırakırsan atlanır.');
      for (let attempt = 0; attempt < 3; attempt++) {
        const key = await askHidden('Anahtar: ');
        if (!key) {
          console.log('Atlandı.');
          break;
        }
        const problem = anthropicKeyProblem(key);
        if (problem) {
          console.log(problem);
          continue;
        }
        if (writeSecrets(facts, { [ANTHROPIC_SECRET_NAME]: key })) console.log(`${ANTHROPIC_SECRET_NAME} ${where} içine yazıldı.`);
        break;
      }
    }
  }

  if (todo.has('cron-secret') && (await confirm(`Zamanlayıcı için yeni bir rastgele sır üretilip ${where} ve Vault'a yazılsın mı?`))) {
    const secret = newCronSecret();
    if (writeSecrets(facts, { [CRON_SECRET_NAME]: secret }) && writeVault(facts, VAULT_CRON, secret)) {
      console.log('Zamanlayıcı sırrı iki yere de yazıldı.');
    }
  }

  if (todo.has('vault-url') && (await confirm(`Vault'a proje adresi yazılsın mı (${facts.vaultUrl})?`))) {
    if (writeVault(facts, VAULT_URL, facts.vaultUrl)) console.log("Vault'a proje adresi yazıldı.");
  }

  const deploy = todo.has('functions') || (opts.redeploy && facts.target === 'remote');
  if (deploy && (await confirm(`Edge Functions dağıtılsın mı (${FUNCTION_SLUGS.join(', ')})?`))) {
    // --use-api: paketleme sunucuda yapılır, Docker gerekmez.
    cli(['functions', 'deploy', ...FUNCTION_SLUGS, '--project-ref', facts.project.ref, '--use-api'], { interactive: true });
  }

  if (facts.target === 'local' && (todo.has('google-secrets') || todo.has('cron-secret'))) localEnvChanged = true;
}

// --- Ana akış ---

async function main() {
  const google = loadGoogleClient();
  const where = opts.local ? 'yerel Supabase' : 'bulut';
  let facts = await gather(google);
  let items = evaluate(facts);
  report(items, `HoopLab kurulum denetimi (${where})`);

  if (!opts.check && items.some((i) => i.status === 'fix')) {
    if (items.some((i) => i.id === 'project' && i.status === 'fix')) {
      if (await chooseProject(facts)) facts = await gather(google);
      items = evaluate(facts);
    }
    // Bir adım ötekinin önünü açar (şema → Vault, zamanlayıcı sırrı); ilerleme durana kadar turlar.
    let previous = '';
    for (let round = 0; round < 3; round++) {
      const fixes = items.filter((i) => i.status === 'fix').map((i) => i.id).join(',');
      if (!fixes || fixes === previous) break;
      previous = fixes;
      await applyFixes(items, facts, google);
      facts = await gather(google);
      items = evaluate(facts);
    }
    report(items, 'Kurulumdan sonra');
  }

  if (localEnvChanged) {
    console.log('\nYerel fonksiyonlar çalışıyorsa yeniden başlat: npx supabase functions serve --env-file supabase/functions/.env');
  }
  manualSteps(items, facts);
  const s = summarize(items);
  if (s.done) console.log('\nKurulum tamam. Uygulamada giriş yap, sonra Ben → Google Health → Google Health\'e bağlan.');
  else if (opts.check && s.fix) console.log('\nEksikleri kurmak için: npm run setup');
  rl?.close();
  // process.exit değil: Windows'ta açık kalan fetch soketleri kapanırken libuv iddia hatasıyla çöküyor (ölçüldü).
  process.exitCode = s.done ? 0 : 1;
}

main().catch((error) => {
  rl?.close();
  fail(error instanceof Error ? error.message : String(error));
});
