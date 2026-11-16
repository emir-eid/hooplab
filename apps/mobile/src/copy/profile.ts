// Profil soruları ve Ben → Profil metinleri (karar 0061 sıra 4c). Döngü soruları yalnız Apple Sağlık profilinde
// sorulur: döngü verisi HealthKit'ten gelir. Veri kaynağı ve spor hesap açılırken atanır, burada yalnız gösterilir.

import type { DataSource, Sport } from '@hooplab/engine';

import type { Contraception, Profile, Sex } from '@/data/profile-row';

export const sexOptions: readonly { value: Sex | null; label: string }[] = [
  { value: 'kadin', label: 'Kadın' },
  { value: 'erkek', label: 'Erkek' },
  { value: null, label: 'Belirtmek istemiyorum' },
];

export const contraceptionOptions: readonly { value: Contraception; label: string }[] = [
  { value: 'yok', label: 'Yok' },
  { value: 'var', label: 'Var' },
  { value: 'belirtmek_istemiyorum', label: 'Belirtmek istemiyorum' },
];

export const sourceLabels: Record<DataSource, string> = { google_health: 'Google Health', apple_health: 'Apple Sağlık' };
export const sportLabels: Record<Sport, string> = { basketbol: 'Basketbol', fitness: 'Fitness' };

export const profileCopy = {
  title: 'Profil',
  setupSubtitle: "Birkaç kısa soru. Sonradan Ben → Profil'den değiştirebilirsin.",
  editSubtitle: 'Yanıtlarını istediğin zaman değiştirebilirsin.',
  sexTitle: 'Cinsiyet',
  sexNote: (asksCycle: boolean) =>
    asksCycle ? 'Yalnız senin hesabında saklanır. Kadın seçersen döngü takibi sorulur.' : 'Yalnız senin hesabında saklanır.',
  cycleTitle: 'Döngü takibi',
  cycleQuestion: "iPhone'daki Sağlık uygulamasında Döngü Takibi'ni kullanıyor musun?",
  cycleNote:
    'Döngü desteği hazırlanıyor. Açıksa ileride HRV ya da uyku nabzı işaretine "döngüyle uyumlu olabilir" notu eklenir; eşikler ve öneriler değişmez. Adet kayıtları telefondan çıkmaz, buluta yalnız döngü günü ve evre gider.',
  contraceptionTitle: 'Hormonal korunma',
  contraceptionNote: 'Hap ya da hormonlu spiral gibi yöntemler döngünün etkisini değiştirebilir; not buna göre yazılır.',
  accountTitle: 'Hesap',
  accountNote: 'Veri kaynağı ve spor hesap açılırken atanır; buradan değiştirilemez.',
  save: 'Kaydet',
} as const;

/** Ben ekranındaki özet. */
export function profileSummary(p: Profile): string {
  return p.sex === 'kadin' ? 'Kadın' : p.sex === 'erkek' ? 'Erkek' : 'Belirtilmedi';
}
