// EAS sarmalayıcısının saf işlevleri (karar 0024 eki, 2026-11-14).
//
// Etkileşimsiz `eas submit`, App Store Connect uygulama numarasını (ascAppId) yalnız eas.json'dan okur;
// ortam değişkeni çözülmez (eas-cli 24.10 ve 27.10 kaynağı: @expo/eas-json IosSubmitProfileFieldsToEvaluate).
// 0009 gereği repoya kişiye ait kimlik yazılmadığı için numara .env.local'da (HOOPLAB_ASC_APP_ID) durur;
// sarmalayıcı onu yalnız gönderim yapan komut süresince eas.json'a ekler ve sonra geri alır.

const ASC_APP_ID = /^\d{1,30}$/;

/** Komut TestFlight'a gönderim yapıyor mu: `submit` ya da `build ... --auto-submit[...]`. */
export function needsAscAppId(args) {
  const command = args.find((a) => !a.startsWith('-'));
  if (command === 'submit') return true;
  if (command === 'build') return args.some((a) => a === '--auto-submit' || a.startsWith('--auto-submit-with-profile'));
  return false;
}

export function isValidAscAppId(value) {
  return typeof value === 'string' && ASC_APP_ID.test(value);
}

/** eas.json metnindeki her submit profiline ios.ascAppId ekler; profil yoksa metin aynen döner. */
export function withAscAppId(easJsonText, ascAppId) {
  if (!isValidAscAppId(ascAppId)) throw new Error('HOOPLAB_ASC_APP_ID yalnız rakamlardan oluşmalı.');
  const json = JSON.parse(easJsonText);
  const profiles = json.submit ?? {};
  for (const name of Object.keys(profiles)) {
    const profile = profiles[name] ?? {};
    profiles[name] = { ...profile, ios: { ...(profile.ios ?? {}), ascAppId } };
  }
  return `${JSON.stringify(json, null, 2)}\n`;
}

/** Yarıda kalmış bir çalıştırmanın bıraktığı ascAppId'leri siler (boş kalan ios bölümü de gider). */
export function withoutAscAppId(easJsonText) {
  const json = JSON.parse(easJsonText);
  for (const profile of Object.values(json.submit ?? {})) {
    if (!profile || !profile.ios || !('ascAppId' in profile.ios)) continue;
    delete profile.ios.ascAppId;
    if (Object.keys(profile.ios).length === 0) delete profile.ios;
  }
  return `${JSON.stringify(json, null, 2)}\n`;
}

/** eas.json metninde herhangi bir ascAppId var mı (repoya girmemeli). */
export function hasAscAppId(easJsonText) {
  const json = JSON.parse(easJsonText);
  return Object.values(json.submit ?? {}).some((p) => p && p.ios && 'ascAppId' in p.ios);
}
