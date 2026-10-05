// Derlemenin kimliği: iOS paket kimliği, EAS proje kimliği ve sahibi. Kullanıcının kendi hesaplarından
// gelir, repoya sabit yazılmaz (0009, 0024): yerelde apps/mobile/.env.local, EAS derlemesinde EAS ortam
// değişkenleri. Değer yoksa alan hiç yazılmaz; Expo Go ve web önizlemesi kimliksiz çalışır.
// Saf fonksiyon; app.config.ts kullanır, testi yanında.

export interface BuildIdentity {
  bundleIdentifier?: string;
  projectId?: string;
  owner?: string;
  /** EAS Update adresi; proje kimliğinden türetilir (`eas update:configure` çıktısıyla aynı biçim). */
  updatesUrl?: string;
}

type Env = Record<string, string | undefined>;

const BUNDLE_ID = /^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)+$/;
const PROJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const OWNER = /^[a-z0-9][a-z0-9_-]*$/i;

function read(env: Env, key: string, pattern: RegExp): string | undefined {
  const value = env[key]?.trim();
  if (!value) return undefined;
  // Bozuk değerle derleme başlamasın: yanlış paket kimliği yeni bir uygulama açar, yanlış proje
  // kimliği güncellemeleri başka projeye yollar.
  if (!pattern.test(value)) throw new Error(`${key} geçersiz. apps/mobile/.env.local veya EAS ortam değişkenlerini kontrol et.`);
  return value;
}

export function resolveBuildIdentity(env: Env): BuildIdentity {
  const bundleIdentifier = read(env, 'HOOPLAB_IOS_BUNDLE_ID', BUNDLE_ID);
  const projectId = read(env, 'HOOPLAB_EAS_PROJECT_ID', PROJECT_ID);
  const owner = read(env, 'HOOPLAB_EAS_OWNER', OWNER);
  return {
    ...(bundleIdentifier ? { bundleIdentifier } : {}),
    ...(projectId ? { projectId, updatesUrl: `https://u.expo.dev/${projectId}` } : {}),
    ...(owner ? { owner } : {}),
  };
}
