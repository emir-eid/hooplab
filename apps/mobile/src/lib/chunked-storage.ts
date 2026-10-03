// Büyük değerleri küçük parçalara bölerek saklayan anahtar-değer adaptörü.
// expo-secure-store değer başına ~2048 bayt kabul eder; Supabase oturumu buna sığmaz ve düz
// setItemAsync onu bazen sessizce yazmaz (LESSONS "Expo / React Native"). Saf modül: depoyu
// dışarıdan alır, testi yanında (chunked-storage.test.ts).
//
// Düzen: `<anahtar>` altında manifest ({"v":1,"g":"a","n":3}), parçalar `<anahtar>.<g>.<i>` altında.
// Yazarken parçalar önce, manifest en son yazılır; parçalar manifestte olmayan kuşağa (a/b) gider.
// Böylece yazma yarıda kalırsa eski manifest bozulmamış eski parçaları göstermeye devam eder.

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

type Generation = 'a' | 'b';

interface Manifest {
  v: 1;
  g: Generation;
  n: number;
}

/** SecureStore sınırının (~2048 bayt) altında pay bırakır. */
export const DEFAULT_MAX_CHUNK_BYTES = 1800;

function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * Metni UTF-8 bayt sayısına göre böler; çok baytlı bir karakter (Türkçe harf, emoji) iki
 * parçaya ayrılmaz. Boş metin tek boş parça verir.
 */
export function splitByUtf8Bytes(value: string, maxBytes: number): string[] {
  if (!Number.isInteger(maxBytes) || maxBytes < 4) {
    throw new RangeError('maxBytes en az 4 olmalı (en uzun UTF-8 karakteri 4 bayt)');
  }
  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;
  // for...of kod noktası üzerinde gezer; vekil çiftler (emoji) bölünmez.
  for (const char of value) {
    const bytes = utf8Length(char.codePointAt(0) ?? 0);
    if (currentBytes + bytes > maxBytes) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  chunks.push(current);
  return chunks;
}

function parseManifest(raw: string | null): Manifest | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { v, g, n } = value as Record<string, unknown>;
  if (v !== 1 || (g !== 'a' && g !== 'b')) return null;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) return null;
  return { v, g, n };
}

const chunkKey = (key: string, g: Generation, i: number) => `${key}.${g}.${i}`;

export interface ChunkedStorageOptions {
  maxChunkBytes?: number;
}

/**
 * `store` üzerine parçalayan bir depolama kurar. Supabase `auth.storage` arayüzüyle uyumludur.
 * Aynı anahtardaki işlemler sırayla çalışır; bir yazma ile silme birbirinin arasına girmez.
 */
export function createChunkedStorage(
  store: KeyValueStore,
  { maxChunkBytes = DEFAULT_MAX_CHUNK_BYTES }: ChunkedStorageOptions = {},
): KeyValueStore {
  const queues = new Map<string, Promise<unknown>>();

  function serialize<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = queues.get(key) ?? Promise.resolve();
    const next = previous.then(task, task);
    const settled = next.catch(() => undefined);
    queues.set(key, settled);
    void settled.then(() => {
      if (queues.get(key) === settled) queues.delete(key);
    });
    return next;
  }

  async function removeChunks(key: string, manifest: Manifest): Promise<void> {
    for (let i = 0; i < manifest.n; i++) {
      await store.removeItem(chunkKey(key, manifest.g, i));
    }
  }

  return {
    getItem: (key) =>
      serialize(key, async () => {
        const manifest = parseManifest(await store.getItem(key));
        if (!manifest) return null;
        let value = '';
        for (let i = 0; i < manifest.n; i++) {
          const chunk = await store.getItem(chunkKey(key, manifest.g, i));
          // Eksik parça: değer güvenilir değil. Yarım oturum yerine "oturum yok" döner.
          if (chunk === null) return null;
          value += chunk;
        }
        return value;
      }),

    setItem: (key, value) =>
      serialize(key, async () => {
        const previous = parseManifest(await store.getItem(key));
        const g: Generation = previous?.g === 'a' ? 'b' : 'a';
        const chunks = splitByUtf8Bytes(value, maxChunkBytes);
        for (const [i, chunk] of chunks.entries()) {
          await store.setItem(chunkKey(key, g, i), chunk);
        }
        const manifest: Manifest = { v: 1, g, n: chunks.length };
        await store.setItem(key, JSON.stringify(manifest));
        if (previous) await removeChunks(key, previous);
      }),

    removeItem: (key) =>
      serialize(key, async () => {
        const manifest = parseManifest(await store.getItem(key));
        // Önce manifest: silme yarıda kalırsa geriye bozuk oturum değil sahipsiz parça kalır.
        await store.removeItem(key);
        if (manifest) await removeChunks(key, manifest);
      }),
  };
}
