// app.json'un üzerine kullanıcıya özgü kimliği ekler (0009, 0024): iOS paket kimliği, EAS proje
// kimliği, sahibi ve EAS Update adresi. Değerler yerelde apps/mobile/.env.local'dan, EAS derlemesinde
// EAS ortam değişkenlerinden gelir; repoya yazılmaz. Değer yoksa Expo Go'da geliştirme aynen çalışır.

import type { ConfigContext, ExpoConfig } from 'expo/config';

import { resolveBuildIdentity } from './src/lib/build-identity.ts';

// Portfolyo sayfasının web demosu (0050) alt yolda yayınlanır (GitHub Pages: /hooplab/demo). O derlemede
// çıktı tek sayfadır: Pages rota başına dosyayı dinamik rotalarda bulamaz, 404.html kopyası yakalar.
const WEB_BASE_URL = /^\/[A-Za-z0-9/_-]*[A-Za-z0-9_-]$/;

export default ({ config }: ConfigContext): ExpoConfig => {
  const id = resolveBuildIdentity(process.env);
  const webBaseUrl = process.env.HOOPLAB_WEB_BASE_URL?.trim();
  if (webBaseUrl && !WEB_BASE_URL.test(webBaseUrl)) throw new Error('HOOPLAB_WEB_BASE_URL geçersiz (ör. /hooplab/demo).');
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
    ...(webBaseUrl
      ? {
          web: { ...config.web, output: 'single' as const },
          experiments: { ...config.experiments, baseUrl: webBaseUrl },
        }
      : {}),
    extra: {
      ...config.extra,
      ...(id.projectId ? { eas: { ...config.extra?.eas, projectId: id.projectId } } : {}),
    },
  };
};
