// Davetli hesabının saf mantığı (karar 0061 sıra 6; testli: invite-lib.test.mjs). Ağ, CLI ve dosya işleri
// invite-user.mjs'te. E-posta ve geçici şifre yalnız ../private/ops.md içinde durur; repoya ve çıktıya girmez.

import { randomInt } from 'node:crypto';

const EMAIL_LINE = /^- E-posta:[ \t]*(.*)$/m;
const PASSWORD_LINE = /^- Geçici şifre:[ \t]*(.*)$/m;
const SECTION = '## Davetli hesabı (0061 sıra 6)';

/** ops.md'deki davetli bölümünden e-posta; yoksa ya da geçersizse null. */
export function readInviteEmail(ops) {
  const start = ops.indexOf(SECTION);
  if (start < 0) return null;
  const m = EMAIL_LINE.exec(ops.slice(start));
  const email = m?.[1]?.trim() ?? '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Davetli bölümündeki geçici şifre satırını yazar; bölüm ya da satır yoksa hata (sessizce başka yere yazılmaz). */
export function writeInvitePassword(ops, password) {
  const start = ops.indexOf(SECTION);
  if (start < 0) throw new Error('ops.md içinde davetli bölümü yok');
  const section = ops.slice(start);
  if (!PASSWORD_LINE.test(section)) throw new Error('ops.md davetli bölümünde "Geçici şifre" satırı yok');
  return ops.slice(0, start) + section.replace(PASSWORD_LINE, `- Geçici şifre: ${password}`);
}

// Karıştırılabilen karakterler (0/O, 1/l/I) yok: şifre elle iletilecek.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Geçici şifre: 4'lü gruplar, tireyle (ör. abcd-EFGH-2345-wxyz); 16 karakter ~93 bit. */
export function generateTempPassword(groups = 4) {
  const parts = [];
  for (let g = 0; g < groups; g++) {
    let p = '';
    for (let i = 0; i < 4; i++) p += ALPHABET[randomInt(ALPHABET.length)];
    parts.push(p);
  }
  return parts.join('-');
}

/** Admin API'ye gidecek yeni kullanıcı gövdesi: e-posta doğrulanmış, ilk girişte şifre değiştirme zorunlu. */
export function createUserBody(email, password) {
  return { email, password, email_confirm: true, user_metadata: { must_change_password: true } };
}

/** Davetlinin profili (karar 0061): Apple Sağlık · fitness. Cinsiyet ve döngü ilk girişte davetliye sorulur. */
export const INVITE_PROFILE = { data_source: 'apple_health', sport: 'fitness' };
