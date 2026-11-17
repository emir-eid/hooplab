// Davetli hesabını açar (karar 0061 sıra 6). Claude çalıştırır (CLAUDE.md §7).
//
//   node tools/admin/invite-user.mjs --check   yalnız denetim: e-posta var mı, yönetici erişimi çalışıyor mu, hesap açık mı
//   node tools/admin/invite-user.mjs           hesabı açar, profili Apple Sağlık · fitness yapar, geçici şifreyi yazar
//   node tools/admin/invite-user.mjs --set-password
//                                              ops.md'deki (elle yazılmış) geçici şifreyi hesaba koyar; yalnız davetli
//                                              henüz kendi şifresini koymadıysa. İlk girişte değiştirme zorunlu kalır.
//
// E-posta ../private/ops.md "Davetli hesabı" bölümünden okunur; geçici şifre aynı bölüme yazılır. Yönetici anahtarı
// Supabase CLI'dan (projects api-keys) yalnız bellekte alınır; hiçbir değer (anahtar, e-posta, şifre) ekrana basılmaz.
// Hesap zaten varsa hiçbir şey değiştirilmez.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createUserBody,
  generateTempPassword,
  INVITE_PROFILE,
  readInviteEmail,
  readInvitePassword,
  resetPasswordBody,
  writeInvitePassword,
} from './invite-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opsPath = path.resolve(root, '..', 'private', 'ops.md');
const check = process.argv.includes('--check');
const setPassword = process.argv.includes('--set-password');

function fail(message) {
  console.error(`[davet] ${message}`);
  process.exit(1);
}

function projectUrl() {
  const env = readFileSync(path.join(root, 'apps', 'mobile', '.env.local'), 'utf8');
  const url = /^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m.exec(env)?.[1]?.trim();
  if (!url || !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) fail('apps/mobile/.env.local içinde bulut adresi yok');
  return url;
}

function serviceKey(ref) {
  // Proje ref'i yalnız küçük harf ve rakam (projectUrl denetler); tek komut dizesi, kabuk Windows'ta npx.cmd'yi bulur.
  if (!/^[a-z0-9]+$/.test(ref)) fail('proje ref biçimi beklenmedik');
  const r = spawnSync(`npx supabase projects api-keys --project-ref ${ref} -o json`, { cwd: root, encoding: 'utf8', shell: true });
  if (r.status !== 0) fail('Supabase CLI anahtar listesi alınamadı (supabase login?)');
  const text = r.stdout.slice(r.stdout.search(/[[{]/));
  const keys = JSON.parse(text);
  const key = (Array.isArray(keys) ? keys : []).find((k) => k.type === 'legacy' && k.name === 'service_role')?.api_key;
  if (!key || /•/.test(key)) fail('yönetici anahtarı alınamadı');
  return key;
}

async function api(url, key, method, pathname, body, extraHeaders = {}) {
  const res = await fetch(`${url}${pathname}`, {
    method,
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', ...extraHeaders },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function findUser(url, key, email) {
  for (let page = 1; page <= 10; page++) {
    const r = await api(url, key, 'GET', `/auth/v1/admin/users?page=${page}&per_page=100`);
    if (r.status !== 200) fail(`kullanıcı listesi okunamadı (HTTP ${r.status})`);
    const users = r.json?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return { user: hit, total: null };
    if (users.length < 100) return { user: null, total: (page - 1) * 100 + users.length };
  }
  fail('kullanıcı listesi beklenenden uzun');
}

const ops = readFileSync(opsPath, 'utf8');
const email = readInviteEmail(ops);
if (!email) fail('private/ops.md "Davetli hesabı" bölümünde geçerli bir e-posta yok; kullanıcı yazmalı');

const url = projectUrl();
const ref = new URL(url).hostname.split('.')[0];
const key = serviceKey(ref);
const existing = await findUser(url, key, email);

if (check) {
  console.log(`[davet] e-posta: var · yönetici erişimi: çalışıyor · hesap: ${existing.user ? 'zaten açık' : `yok (projede ${existing.total} hesap)`}`);
  process.exit(0);
}
if (setPassword) {
  const user = existing.user;
  if (!user) fail('bu e-postayla hesap yok; önce hesap açılmalı');
  if (user.user_metadata?.must_change_password !== true) {
    fail('davetli kendi şifresini zaten koymuş; hiçbir şey değiştirilmedi');
  }
  const password = readInvitePassword(ops);
  if (!password) fail('private/ops.md "Geçici şifre" satırı boş, yer tutucu ya da 6 karakterden kısa');
  const updated = await api(url, key, 'PUT', `/auth/v1/admin/users/${user.id}`, resetPasswordBody(password, user.user_metadata));
  if (updated.status !== 200) {
    fail(`şifre değiştirilemedi (HTTP ${updated.status}${updated.json?.error_code ? `, ${updated.json.error_code}` : ''})`);
  }
  const flag = updated.json?.user_metadata?.must_change_password === true;
  console.log(`[davet] şifre ops.md'deki değerle değiştirildi (${user.id.slice(0, 8)}…); ilk girişte değiştirme zorunlu: ${flag ? 'evet' : 'HAYIR'}`);
  process.exit(flag ? 0 : 1);
}
if (existing.user) fail('bu e-postayla hesap zaten açık; hiçbir şey değiştirilmedi');

const password = generateTempPassword();
// Şifre önce ops.md'ye yazılır: hesap açılıp şifre kaybolmasın.
writeFileSync(opsPath, writeInvitePassword(ops, password));

const created = await api(url, key, 'POST', '/auth/v1/admin/users', createUserBody(email, password));
if (created.status !== 200 || !created.json?.id) {
  fail(`hesap açılamadı (HTTP ${created.status}${created.json?.error_code ? `, ${created.json.error_code}` : ''})`);
}
const id = created.json.id;

const profile = await api(url, key, 'PATCH', `/rest/v1/profiles?user_id=eq.${id}`, INVITE_PROFILE, {
  prefer: 'return=representation',
});
const row = Array.isArray(profile.json) ? profile.json[0] : null;
if (profile.status !== 200 || row?.data_source !== INVITE_PROFILE.data_source || row?.sport !== INVITE_PROFILE.sport) {
  fail(`hesap açıldı (${id.slice(0, 8)}…) ama profil güncellenemedi (HTTP ${profile.status}); elle düzeltilmeli`);
}

console.log(`[davet] hesap açıldı (${id.slice(0, 8)}…), e-posta doğrulanmış, ilk girişte şifre değiştirme zorunlu`);
console.log(`[davet] profil: ${row.data_source} · ${row.sport}; rıza ve sorular boş (ilk girişte sorulur)`);
console.log('[davet] geçici şifre private/ops.md "Davetli hesabı" bölümünde');
