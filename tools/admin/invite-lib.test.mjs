import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createUserBody, generateTempPassword, readInviteEmail, writeInvitePassword } from './invite-lib.mjs';

const OPS = `# ops

- E-posta: sahip@ornek.test

## Davetli hesabı (0061 sıra 6)

<!-- not -->
- E-posta: davetli@ornek.test
- Geçici şifre: (Claude yazar)
`;

test('e-posta yalnız davetli bölümünden okunur', () => {
  assert.equal(readInviteEmail(OPS), 'davetli@ornek.test');
  assert.equal(readInviteEmail(OPS.replace('davetli@ornek.test', '')), null);
  assert.equal(readInviteEmail(OPS.replace('davetli@ornek.test', 'gecersiz')), null);
  assert.equal(readInviteEmail('# ops\n- E-posta: sahip@ornek.test\n'), null);
});

test('geçici şifre yalnız davetli bölümüne yazılır', () => {
  const out = writeInvitePassword(OPS, 'abcd-EFGH');
  assert.match(out, /- Geçici şifre: abcd-EFGH\n/);
  assert.match(out, /- E-posta: sahip@ornek\.test/);
  assert.equal(out.split('Geçici şifre').length, 2);
  assert.throws(() => writeInvitePassword('# ops\n', 'x'), /bölümü yok/);
  assert.throws(() => writeInvitePassword(OPS.replace(/- Geçici şifre:.*\n/, ''), 'x'), /satırı yok/);
});

test('geçici şifre: 4 grup, karıştırılan karakter yok, her seferinde farklı', () => {
  const a = generateTempPassword();
  assert.match(a, /^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);
  assert.doesNotMatch(a, /[01OlI]/);
  assert.notEqual(a, generateTempPassword());
});

test('yeni kullanıcı doğrulanmış ve şifre değiştirmesi zorunlu', () => {
  assert.deepEqual(createUserBody('d@o.test', 'p'), {
    email: 'd@o.test',
    password: 'p',
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
});
