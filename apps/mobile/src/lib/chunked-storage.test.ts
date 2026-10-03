import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createChunkedStorage,
  DEFAULT_MAX_CHUNK_BYTES,
  splitByUtf8Bytes,
  type KeyValueStore,
} from './chunked-storage.ts';

const SECURE_STORE_LIMIT = 2048;
const bytes = (s: string) => Buffer.byteLength(s, 'utf8');

/** SecureStore benzeri bellek deposu: sınırı aşan değeri reddeder, istenirse N. yazmada çöker. */
function memoryStore({ failOnWrite }: { failOnWrite?: number } = {}) {
  const data = new Map<string, string>();
  let writes = 0;
  const store: KeyValueStore = {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      writes++;
      if (failOnWrite !== undefined && writes === failOnWrite) throw new Error('yazma yarıda kaldı');
      if (bytes(value) > SECURE_STORE_LIMIT) throw new Error(`değer çok büyük: ${bytes(value)} bayt`);
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
  return { store, data };
}

// Sentetik, oturuma benzeyen büyük bir değer (gerçek token değil; JWT biçiminde de değil).
function syntheticSession(extra = ''): string {
  return JSON.stringify({
    access_token: 'synthetic-access.' + 'x'.repeat(1400),
    refresh_token: 'synthetic-refresh-' + 'r'.repeat(40),
    user: { id: '00000000-0000-4000-8000-000000000000', note: 'Ağrı: baldır, Aşil 🏀 ' + extra },
  });
}

test('bölme UTF-8 baytına göre yapılır, çok baytlı karakter ikiye ayrılmaz', () => {
  const value = 'ğ'.repeat(5) + '🏀'.repeat(3) + 'a';
  const chunks = splitByUtf8Bytes(value, 5);
  assert.equal(chunks.join(''), value);
  for (const chunk of chunks) assert.ok(bytes(chunk) <= 5, `${chunk} 5 baytı aştı`);
  // ğ 2 bayt: 5 baytlık parçaya iki tane sığar; emoji 4 bayt: tek başına.
  assert.deepEqual(chunks.slice(0, 3), ['ğğ', 'ğğ', 'ğ']);
  assert.ok(chunks.includes('🏀'));
});

test('boş metin tek boş parça verir; geçersiz sınır reddedilir', () => {
  assert.deepEqual(splitByUtf8Bytes('', 10), ['']);
  assert.throws(() => splitByUtf8Bytes('abc', 3), RangeError);
  assert.throws(() => splitByUtf8Bytes('abc', 10.5), RangeError);
});

test('SecureStore sınırını aşan oturum parçalanıp aynen geri okunur', async () => {
  const { store, data } = memoryStore();
  const storage = createChunkedStorage(store);
  const value = syntheticSession('ş'.repeat(2000));
  assert.ok(bytes(value) > SECURE_STORE_LIMIT * 2);

  await storage.setItem('sb-test-auth-token', value);
  assert.equal(await storage.getItem('sb-test-auth-token'), value);
  for (const stored of data.values()) assert.ok(bytes(stored) <= DEFAULT_MAX_CHUNK_BYTES);
});

test('anahtarlar SecureStore kuralına uyar (harf, rakam, nokta, tire, alt çizgi)', async () => {
  const { store, data } = memoryStore();
  await createChunkedStorage(store).setItem('sb-abc_def-auth-token', syntheticSession());
  for (const key of data.keys()) assert.match(key, /^[\w.-]+$/);
});

test('olmayan anahtar null döner; silinen değer ve parçaları kalmaz', async () => {
  const { store, data } = memoryStore();
  const storage = createChunkedStorage(store);
  assert.equal(await storage.getItem('yok'), null);

  await storage.setItem('k', syntheticSession());
  await storage.removeItem('k');
  assert.equal(await storage.getItem('k'), null);
  assert.equal(data.size, 0);
  await storage.removeItem('k'); // ikinci silme hata vermez
});

test('üzerine yazınca eski kuşağın parçaları temizlenir', async () => {
  const { store, data } = memoryStore();
  const storage = createChunkedStorage(store, { maxChunkBytes: 100 });
  await storage.setItem('k', 'a'.repeat(1000)); // 10 parça
  await storage.setItem('k', 'b'.repeat(150)); // 2 parça
  assert.equal(await storage.getItem('k'), 'b'.repeat(150));
  assert.equal(data.size, 3); // manifest + 2 parça
});

test('yazma yarıda kalırsa önceki değer bozulmadan okunur', async () => {
  const value = syntheticSession('eski');
  // 1. setItem ile değer yazılır; ikinci setItem ilk parçayı yazar, ikinci parçada çöker.
  const firstWrites = splitByUtf8Bytes(value, DEFAULT_MAX_CHUNK_BYTES).length + 1;
  const { store } = memoryStore({ failOnWrite: firstWrites + 2 });
  const storage = createChunkedStorage(store);
  await storage.setItem('k', value);

  await assert.rejects(storage.setItem('k', syntheticSession('yeni'.repeat(500))));
  assert.equal(await storage.getItem('k'), value);

  // Sonraki yazma başarılı olur ve yeni değer okunur.
  await storage.setItem('k', 'son');
  assert.equal(await storage.getItem('k'), 'son');
});

test('parçası eksik veya manifesti bozuk değer null döner', async () => {
  const { store, data } = memoryStore();
  const storage = createChunkedStorage(store, { maxChunkBytes: 100 });
  await storage.setItem('k', 'a'.repeat(300));
  const chunkKey = [...data.keys()].find((k) => k.startsWith('k.'));
  assert.ok(chunkKey);
  data.delete(chunkKey);
  assert.equal(await storage.getItem('k'), null);

  for (const broken of ['{bozuk', 'null', '{"v":2,"g":"a","n":1}', '{"v":1,"g":"c","n":1}', '{"v":1,"g":"a","n":0}']) {
    data.set('k', broken);
    assert.equal(await storage.getItem('k'), null, broken);
  }
});

test('aynı anahtardaki eşzamanlı işlemler sırayla uygulanır', async () => {
  const { store, data } = memoryStore();
  const storage = createChunkedStorage(store, { maxChunkBytes: 100 });
  const writes = Array.from({ length: 5 }, (_, i) => storage.setItem('k', String(i).repeat(250 + i)));
  const removal = storage.removeItem('k');
  const last = storage.setItem('k', 'son'.repeat(50));
  await Promise.all([...writes, removal, last]);
  assert.equal(await storage.getItem('k'), 'son'.repeat(50));
  assert.equal(data.size, 3); // manifest + 2 parça; ara yazmalardan artık kalmadı
});
