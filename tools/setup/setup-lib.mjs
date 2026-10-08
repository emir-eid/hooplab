// Kurulum sihirbazının saf mantığı (testli: setup-lib.test.mjs). Dosya, ağ ve CLI işleri setup.mjs'te.
//
// Sihirbaz önce "olguları" toplar (proje, anahtarlar, sırların özetleri, Vault, fonksiyonlar...),
// evaluate() bunlardan bir denetim listesi çıkarır. Aynı liste hem `--check` raporunu hem kurulum
// adımlarını yönetir; böylece denetim ve kurulum aynı kuralları paylaşır.
//
// Sır değerleri hiçbir zaman karşılaştırılmak için okunmaz: Supabase secrets listesi her değerin
// sha256 özetini verir (ölçüldü, LESSONS "Supabase"), Vault değerinin özeti SQL'de hesaplanır.

import { createHash, randomBytes } from 'node:crypto';

export const FUNCTION_SLUGS = ['ghealth-connect', 'ghealth-callback', 'ghealth-sync', 'coach-daily'];
export const CRON_JOB = 'google-health-senkron';
export const GOOGLE_SECRET_NAMES = ['GOOGLE_HEALTH_CLIENT_ID', 'GOOGLE_HEALTH_CLIENT_SECRET'];
export const CRON_SECRET_NAME = 'GHEALTH_CRON_SECRET';
/** AI koçun Claude API anahtarı (karar 0032); değeri yalnız kullanıcı girer, sihirbaz üretemez. */
export const ANTHROPIC_SECRET_NAME = 'ANTHROPIC_API_KEY';
export const VAULT_URL = 'project_url';
export const VAULT_CRON = 'ghealth_cron_secret';

export function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function newCronSecret() {
  return randomBytes(32).toString('hex');
}

export function projectUrlFromRef(ref) {
  return `https://${ref}.supabase.co`;
}

export function callbackUrl(projectUrl) {
  return `${projectUrl}/functions/v1/ghealth-callback`;
}

/** Proje kimliği: 20 küçük harf (Supabase biçimi). Komut satırına gitmeden önce denetlenir. */
export function isProjectRef(ref) {
  return typeof ref === 'string' && /^[a-z]{20}$/.test(ref);
}

/**
 * Supabase CLI'ın JSON çıktısı. CLI bir yapay zeka ajanı altında çalıştığını sezerse sonucu
 * `{ boundary, rows, warning }` ile sarar; sihirbaz `--agent no` geçer ama iki biçim de kabul edilir.
 * JSON'dan önceki durum satırları ("Initialising login role...") atlanır.
 */
export function parseCliJson(stdout) {
  const start = stdout.search(/^\s*[[{]/m);
  if (start < 0) throw new Error('CLI çıktısında JSON yok');
  const value = JSON.parse(stdout.slice(start));
  if (value && !Array.isArray(value) && Array.isArray(value.rows)) return value.rows;
  return value;
}

// --- .env dosyaları ---

/** KEY=değer satırları; yorum ve boş satırlar atlanır, tırnaklar soyulur. */
export function parseEnv(text) {
  const out = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
      value = value.slice(1, -1);
    }
    out.set(key, value);
  }
  return out;
}

/**
 * Var olan dosyadaki anahtarları yerinde günceller, olmayanları sona ekler; yorumlar ve başka
 * anahtarlar korunur (ör. yerel denemenin sahte Google adresleri).
 */
export function mergeEnv(text, updates) {
  const pending = new Map(Object.entries(updates));
  const lines = text ? text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n') : [];
  const merged = lines.map((line) => {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (!m || !pending.has(m[1])) return line;
    const value = pending.get(m[1]);
    pending.delete(m[1]);
    return `${m[1]}=${value}`;
  });
  for (const [key, value] of pending) merged.push(`${key}=${value}`);
  return `${merged.join('\n')}\n`;
}

// --- Google OAuth istemcisi ---

/**
 * Google Cloud'dan indirilen istemci JSON'u. Uygulamanın senkronu Web istemcisi ister ([0019]);
 * Desktop istemcisi ("installed") yalnız 127.0.0.1'e dönebildiği için reddedilir.
 */
export function parseGoogleClient(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, problem: 'not-json' };
  }
  if (json?.installed) return { ok: false, problem: 'desktop-client' };
  const web = json?.web;
  if (!web) return { ok: false, problem: 'not-web' };
  if (typeof web.client_id !== 'string' || typeof web.client_secret !== 'string' || !web.client_id || !web.client_secret) {
    return { ok: false, problem: 'missing-fields' };
  }
  const redirectUris = Array.isArray(web.redirect_uris) ? web.redirect_uris.filter((u) => typeof u === 'string') : [];
  return { ok: true, clientId: web.client_id, clientSecret: web.client_secret, redirectUris };
}

/**
 * Hangi Google JSON dosyası okunur? Açıkça verilen her zaman; varsayılan (private klasöründeki gerçek
 * istemci) yalnız bulut hedefinde. Yerel hedef sahte / sentetik değerlerle çalışır: varsayılan orada
 * seçilseydi gerçek istemci sırrı yerel .env dosyasına yazılırdı (2026-10-05'te oldu, LESSONS).
 */
export function chooseGoogleJson({ explicit, local, defaultPath, defaultExists }) {
  if (explicit) return explicit;
  if (local) return null;
  return defaultExists ? defaultPath : null;
}

export const googleClientProblems = {
  'not-json': 'Dosya JSON değil. Google Cloud → Clients → istemci → Download JSON ile indirilen dosyayı ver.',
  'desktop-client': 'Bu bir Desktop istemcisi. Senkron için Web application istemcisi gerekir (rehber §4a).',
  'not-web': 'Dosyada Web istemcisi yok. Web application türünde bir istemci aç (rehber §4a).',
  'missing-fields': 'Dosyada client_id veya client_secret eksik.',
};

// --- Supabase ---

/** Projenin publishable anahtarları (`projects api-keys` çıktısı). Gizli ve eski anahtarlar alınmaz. */
/**
 * Gizli girişle alınan Anthropic anahtarının biçim denetimi; değer hiçbir yere yazdırılmaz.
 * @returns {string | null} sorun varsa Türkçe açıklama
 */
export function anthropicKeyProblem(value) {
  if (!value) return 'Anahtar boş.';
  if (/\s/.test(value)) return 'Anahtarda boşluk var; yalnız anahtarı yapıştır.';
  if (!value.startsWith('sk-ant-')) return "Anthropic API anahtarı 'sk-ant-' ile başlar; Console → API keys'ten kopyala.";
  if (value.startsWith('sk-ant-admin')) return 'Bu bir Admin anahtarı; koç için çalışma alanına bağlı normal bir API anahtarı gerekir.';
  return null;
}

export function publishableKeys(apiKeys) {
  return apiKeys
    .filter((k) => k?.type === 'publishable' && typeof k.api_key === 'string' && k.api_key.startsWith('sb_publishable_'))
    .map((k) => k.api_key);
}

/** `supabase/migrations` dosya adlarından sürümler (ör. 20261004112747). */
export function migrationVersions(fileNames) {
  return fileNames
    .map((name) => /^(\d{14})_.+\.sql$/.exec(name)?.[1])
    .filter(Boolean)
    .sort();
}

export function pendingMigrations(local, remote) {
  const applied = new Set(remote);
  return local.filter((v) => !applied.has(v));
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Vault'ta adlı sırrı oluşturur ya da günceller. Tek komut (CLI `db query` birden çok komut kabul
 * etmez, LESSONS "Supabase"); değer komut satırına değil geçici bir SQL dosyasına yazılır.
 */
export function vaultUpsertSql(name, value) {
  const n = sqlLiteral(name);
  const v = sqlLiteral(value);
  return [
    'do $hooplab$',
    'begin',
    `  if exists (select 1 from vault.secrets where name = ${n}) then`,
    `    perform vault.update_secret((select id from vault.secrets where name = ${n}), ${v});`,
    '  else',
    `    perform vault.create_secret(${v}, ${n});`,
    '  end if;',
    'end',
    '$hooplab$',
  ].join('\n');
}

/** Vault değerlerinin yalnız özetleri; değerin kendisi veritabanından çıkmaz. */
export const VAULT_DIGEST_SQL =
  "select name, encode(extensions.digest(decrypted_secret, 'sha256'), 'hex') as digest " +
  `from vault.decrypted_secrets where name in ('${VAULT_URL}', '${VAULT_CRON}')`;

export const REMOTE_STATE_SQL =
  'select (select count(*) from auth.users)::int as users, ' +
  `(select active from cron.job where jobname = '${CRON_JOB}' limit 1) as cron_active, ` +
  "(select coalesce(json_agg(version order by version), '[]'::json) from supabase_migrations.schema_migrations) as migrations";

// --- Denetim listesi ---

/**
 * @typedef {{ id: string, label: string, status: 'ok' | 'fix' | 'manual' | 'blocked', detail?: string }} CheckItem
 *   ok: tamam · fix: sihirbaz kurabilir · manual: kullanıcının konsolda yapması gerekir ·
 *   blocked: önceki bir adım eksik olduğu için denetlenemedi.
 */

/**
 * Olgulardan denetim listesi. Olgular setup.mjs'te toplanır; `null` = denetlenemedi.
 * @returns {CheckItem[]}
 */
export function evaluate(f) {
  const items = [];
  const add = (id, label, status, detail) => items.push(detail ? { id, label, status, detail } : { id, label, status });
  const local = f.target === 'local';

  if (local) {
    if (!f.localRunning) {
      add('stack', 'Yerel Supabase', 'manual', 'Docker Desktop açıkken: npm run db:start');
      return items;
    }
    add('stack', 'Yerel Supabase', 'ok');
  } else {
    if (!f.cliLoggedIn) {
      add('cli', 'Supabase CLI girişi', 'manual', 'Tarayıcıda kendi Supabase hesabınla: npx supabase login');
      return items;
    }
    add('cli', 'Supabase CLI girişi', 'ok');
    if (!f.project) {
      add('project', 'Supabase projesi', 'fix', 'Proje seçilip bağlanacak (supabase link).');
      return items;
    }
    if (f.project.status && f.project.status !== 'ACTIVE_HEALTHY') {
      add('project', 'Supabase projesi', 'manual', `Proje durumu ${f.project.status}. Duraklatıldıysa panodan devam ettir (Restore).`);
      return items;
    }
    add('project', 'Supabase projesi', 'ok', f.project.name);
  }

  // Uygulamanın bağlantı değerleri. Yerelde .env.local'a dokunulmaz: web önizlemesi yerel değerleri
  // `npm run web:local` ile alır, .env.local bulut projesini göstermeye devam eder.
  if (!local) {
    const label = 'Uygulamanın bağlantı değerleri';
    if (!f.appEnv?.url || !f.appEnv?.key) {
      add('app-env', label, 'fix', 'apps/mobile/.env.local yazılacak.');
    } else if (f.appEnv.key.startsWith('sb_secret_')) {
      add('app-env', label, 'fix', '.env.local içinde gizli anahtar var; publishable anahtarla değiştirilecek.');
    } else if (f.appEnv.url !== f.projectUrl || !f.expectedKeys?.includes(f.appEnv.key)) {
      add('app-env', label, 'fix', '.env.local başka bir projeyi gösteriyor; bu projeninkiyle değiştirilecek.');
    } else {
      add('app-env', label, 'ok');
    }
  }

  // Şema.
  if (f.remoteMigrations == null) {
    add('migrations', 'Veritabanı şeması', 'blocked', 'Uygulanmış migration listesi okunamadı.');
  } else {
    const pending = pendingMigrations(f.localMigrations, f.remoteMigrations);
    if (pending.length) {
      add('migrations', 'Veritabanı şeması', 'fix', `${pending.length} migration uygulanacak.`);
    } else {
      add('migrations', 'Veritabanı şeması', 'ok', `${f.localMigrations.length} migration uygulanmış.`);
    }
  }
  const schemaReady = f.remoteMigrations != null && pendingMigrations(f.localMigrations, f.remoteMigrations).length === 0;

  // Google istemci sırları (bulutta Supabase secrets, yerelde supabase/functions/.env).
  const secrets = f.secretDigests;
  const where = local ? 'supabase/functions/.env' : 'Supabase secrets';
  if (secrets == null) {
    add('google-secrets', 'Google istemci sırları', 'blocked', `${where} okunamadı.`);
  } else {
    const missing = GOOGLE_SECRET_NAMES.filter((n) => !secrets.has(n));
    if (missing.length) {
      add('google-secrets', 'Google istemci sırları', 'fix', `${where} içinde eksik: ${missing.join(', ')}. Web istemcisinin JSON dosyası gerekecek.`);
    } else if (
      f.googleClient &&
      (secrets.get('GOOGLE_HEALTH_CLIENT_ID') !== sha256Hex(f.googleClient.clientId) ||
        secrets.get('GOOGLE_HEALTH_CLIENT_SECRET') !== sha256Hex(f.googleClient.clientSecret))
    ) {
      add('google-secrets', 'Google istemci sırları', 'fix', `${where} verilen JSON dosyasıyla aynı değil; güncellenecek.`);
    } else {
      add('google-secrets', 'Google istemci sırları', 'ok', f.googleClient ? 'JSON dosyasıyla aynı.' : undefined);
    }
  }

  // AI koçun Claude API anahtarı (karar 0032). Yalnız bulutta: yerelde koç sahte sunucuyla denenir.
  if (!local) {
    const label = 'Anthropic API anahtarı (koç)';
    if (secrets == null) add('anthropic-key', label, 'blocked', 'Supabase secrets okunamadı.');
    else if (!secrets.has(ANTHROPIC_SECRET_NAME)) {
      add('anthropic-key', label, 'fix', `${ANTHROPIC_SECRET_NAME} yok; Anthropic Console → API keys'ten aldığın anahtar gizli girişle istenecek.`);
    } else add('anthropic-key', label, 'ok');
  }

  // Google Cloud'daki geri dönüş adresi: yalnız JSON dosyası verildiyse denetlenebilir.
  if (f.googleClient && !local) {
    const expected = callbackUrl(f.projectUrl);
    if (f.googleClient.redirectUris.includes(expected)) {
      add('google-redirect', 'Google istemcisinin geri dönüş adresi', 'ok');
    } else {
      add(
        'google-redirect',
        'Google istemcisinin geri dönüş adresi',
        'manual',
        `Google Cloud → Clients → Web istemcisi → Authorized redirect URIs: ${expected} (sonra JSON'u yeniden indir).`,
      );
    }
  }

  // Zamanlayıcının paylaşılan sırrı: sunucudaki ve Vault'taki aynı olmalı.
  const vault = f.vaultDigests;
  if (secrets == null || vault == null || !schemaReady) {
    add('cron-secret', 'Zamanlayıcı sırrı', 'blocked', 'Önce şema ve sırlar.');
  } else if (!secrets.has(CRON_SECRET_NAME) || !vault.has(VAULT_CRON)) {
    add('cron-secret', 'Zamanlayıcı sırrı', 'fix', 'Yeni bir rastgele sır üretilip iki yere yazılacak.');
  } else if (secrets.get(CRON_SECRET_NAME) !== vault.get(VAULT_CRON)) {
    add('cron-secret', 'Zamanlayıcı sırrı', 'fix', `${where} ile Vault'taki sır farklı; yeniden üretilecek.`);
  } else {
    add('cron-secret', 'Zamanlayıcı sırrı', 'ok');
  }

  if (vault == null || !schemaReady) {
    add('vault-url', "Vault'ta proje adresi", 'blocked', 'Önce şema.');
  } else if (vault.get(VAULT_URL) !== sha256Hex(f.vaultUrl)) {
    add('vault-url', "Vault'ta proje adresi", 'fix', vault.has(VAULT_URL) ? 'Başka bir adres yazılı; düzeltilecek.' : 'Yazılacak.');
  } else {
    add('vault-url', "Vault'ta proje adresi", 'ok');
  }

  // Zamanlayıcıyı migration kurar; şema tamken yoksa elle silinmiş demektir.
  if (!schemaReady) {
    add('cron-job', 'Saatlik senkron zamanlayıcısı', 'blocked', 'Önce şema.');
  } else if (f.cronActive == null) {
    add('cron-job', 'Saatlik senkron zamanlayıcısı', 'manual', `cron.job içinde ${CRON_JOB} yok; migration 20261004112747'deki cron.schedule çağrısı yeniden çalıştırılmalı.`);
  } else if (!f.cronActive) {
    add('cron-job', 'Saatlik senkron zamanlayıcısı', 'manual', `cron.job içinde ${CRON_JOB} kapalı (active = false).`);
  } else {
    add('cron-job', 'Saatlik senkron zamanlayıcısı', 'ok');
  }

  if (!local) {
    if (f.functions == null) {
      add('functions', 'Edge Functions', 'blocked', 'Fonksiyon listesi okunamadı.');
    } else {
      const active = new Set(f.functions.filter((fn) => fn.status === 'ACTIVE').map((fn) => fn.slug));
      const missing = FUNCTION_SLUGS.filter((s) => !active.has(s));
      if (missing.length) add('functions', 'Edge Functions', 'fix', `Dağıtılacak: ${missing.join(', ')}.`);
      else add('functions', 'Edge Functions', 'ok', FUNCTION_SLUGS.join(', '));
    }
  }

  if (f.signupDisabled == null) {
    add('signup', 'Yeni kayıt kapalı', 'blocked', 'Auth ayarları okunamadı.');
  } else if (!f.signupDisabled) {
    add(
      'signup',
      'Yeni kayıt kapalı',
      'manual',
      'Supabase panosu → Authentication → Sign In / Providers → "Allow new users to sign up" kapat. Açıkken uygulamanı bulan herkes hesap açabilir.',
    );
  } else {
    add('signup', 'Yeni kayıt kapalı', 'ok');
  }

  if (f.userCount == null) {
    add('owner', 'Giriş hesabın', 'blocked', 'Kullanıcı sayısı okunamadı.');
  } else if (f.userCount === 0) {
    add(
      'owner',
      'Giriş hesabın',
      'manual',
      'Supabase panosu → Authentication → Users → Add user → Create new user; e-posta ve şifreni gir, "Auto Confirm User" işaretli.',
    );
  } else {
    add('owner', 'Giriş hesabın', 'ok', f.userCount === 1 ? '1 kullanıcı' : `${f.userCount} kullanıcı (tek kullanıcılı uygulama; fazlası gerekmez)`);
  }

  return items;
}

export function summarize(items) {
  const count = (s) => items.filter((i) => i.status === s).length;
  return { ok: count('ok'), fix: count('fix'), manual: count('manual'), blocked: count('blocked'), done: items.every((i) => i.status === 'ok') };
}
