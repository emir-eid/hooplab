// app.json'un üzerine kullanıcıya özgü kimliği ekler (0009, 0024): iOS paket kimliği, EAS proje
// kimliği, sahibi ve EAS Update adresi. Değerler yerelde apps/mobile/.env.local'dan, EAS derlemesinde
// EAS ortam değişkenlerinden gelir; repoya yazılmaz. Değer yoksa Expo Go'da geliştirme aynen çalışır.

import type { ConfigContext, ExpoConfig } from 'expo/config';

import { resolveBuildIdentity } from './src/lib/build-identity.ts';

export default ({ config }: ConfigContext): ExpoConfig => {
  const id = resolveBuildIdentity(process.env);
  return {
    ...config,
    name: config.name ?? 'HoopLab',
    slug: config.slug ?? 'hooplab',
    ...(id.owner ? { owner: id.owner } : {}),
    ios: {
      ...config.ios,
      ...(id.bundleIdentifier ? { bundleIdentifier: id.bundleIdentifier } : {}),
      // Uygulama yalnız HTTPS kullanır (muaf şifreleme); her TestFlight yüklemesinde soru çıkmasın.
      config: { ...config.ios?.config, usesNonExemptEncryption: false },
    },
    ...(id.updatesUrl ? { updates: { ...config.updates, url: id.updatesUrl } } : {}),
    extra: {
      ...config.extra,
      ...(id.projectId ? { eas: { ...config.extra?.eas, projectId: id.projectId } } : {}),
    },
  };
};
