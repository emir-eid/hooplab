// "Nasıl hesaplanıyor?" ekranının kaynak listesi. Kimlikler research/sources dosya adlarıdır, künyeler copy/sources'tan;
// recovery-sources.test.ts listenin rules/toparlanma.json'daki kaynaklarla aynı kaldığını denetler.

import { recoveryBand, recoveryMinValues, respirationNightRule, shortSleep } from '@hooplab/engine';

import { formatDecimal, weeks } from './recovery.ts';
import { sources, type SourceCite, type SourceId } from './sources.ts';

export interface SourceRef extends SourceCite {
  id: SourceId;
  /** Uygulamada ne için kullanıldığı. */
  use: string;
}

const ref = (id: SourceId, use: string): SourceRef => ({ id, ...sources[id], use });

export const recoverySources: readonly SourceRef[] = [
  ref('manresa-rocamora-2021', `${recoveryBand.rollingDays} günlük ortalama, ${weeks(recoveryBand.baselineDays)} haftalık bant, ± ${formatDecimal(recoveryBand.sdMultiplier)} SD`),
  ref('vesterinen-2016', 'Bant dışında düşük yoğunluk kuralı'),
  ref('duking-2021', 'Giyilebilir cihazla ölçülen HRV'),
  ref('plews-2014', `Haftada en az ${recoveryMinValues.rolling} geçerli gece`),
  ref('plews-2013', 'Ortalamayla okuma, HRV nabızla birlikte'),
  ref('buchheit-2014', 'Derin uyku HRV, anlamlı değişim'),
  ref('bellenger-2016', 'HRV tek başına yetmez'),
  ref('nuuttila-2022', 'Gece nabzı tutarlı ve yüklenmeye duyarlı'),
  ref('bosquet-2008', 'Nabız değişimi küçük, tek başına durumu değiştirmez'),
  ref('roete-2021', 'Dinlenik ölçümler aşırı yüklenmeyi yansıtmadı'),
  ref('altini-2021', 'Nabız antrenmandan çok alkol ve hastalıkla yükselir'),
  ref('walsh-2021', `${shortSleep.minHours} saatin altı kısa uyku`),
  ref('natarajan-2021', `Gece solunumu kişi içinde kararlı; ${respirationNightRule.aboveBaselineMean} nefes/dk notu`),
  ref('renteria-2024', 'Sporcularda kişisel başlangıca göre solunum'),
  ref('miller-2020', 'Gece solunumunda olağandan sapma'),
  ref('nicolo-2020', 'Solunumu etkileyen etkenler'),
];

/**
 * Apple Health profilinin listesi (karar 0061): ortak kurallar (bant, veri yeterliliği, uyku, solunum) ve Apple
 * sürümleri (hrv-olcu-apple, nabiz-olcu-apple, gunun-durumu-apple). recovery-sources.test.ts denetler.
 */
export const recoverySourcesApple: readonly SourceRef[] = [
  ref('manresa-rocamora-2021', `${recoveryBand.rollingDays} günlük ortalama, ${weeks(recoveryBand.baselineDays)} haftalık bant, ± ${formatDecimal(recoveryBand.sdMultiplier)} SD`),
  ref('vesterinen-2016', "HRV'ye dayalı karar kuralı; Apple'da uygulanmaz"),
  ref('duking-2021', 'Giyilebilir cihazla ölçülen HRV'),
  ref('plews-2014', `Haftada en az ${recoveryMinValues.rolling} geçerli gece`),
  ref('plews-2013', 'Ortalamayla okuma, HRV nabızla birlikte'),
  ref('buchheit-2014', 'İki işaret aynı yönde: en ağır durum'),
  ref('task-force-1996', 'SDNN ile RMSSD aynı ölçü değil'),
  ref('munoz-2015', 'Kısa kayıtta SDNN daha az güvenilir'),
  ref('dobbs-2019', 'Taşınabilir cihazlarda en büyük hata SDNN’de'),
  ref('miller-2022', 'Uykuda saatin nabzı EKG’ye yakın, HRV’si daha zayıf'),
  ref('ogrady-2024', 'Apple Watch: dinlenik nabız doğru, HRV hatası büyük'),
  ref('bonneval-2025', 'Apple Watch: dinlenirken nabız ve HRV doğruluğu'),
  ref('hirten-2021', 'Uzun süreli kişisel SDNN izlemesi'),
  ref('nuuttila-2022', 'Gece nabzı tutarlı ve yüklenmeye duyarlı'),
  ref('lambe-2026b', 'Saat nabzının ortalama farkı ve tek ölçüm oynaması'),
  ref('choe-2025', 'Saat nabzının hatası geçerlik sınırının altında'),
  ref('altini-2021', 'Nabız antrenmandan çok alkol ve hastalıkla yükselir'),
  ref('walsh-2021', `${shortSleep.minHours} saatin altı kısa uyku`),
  ref('natarajan-2021', `Gece solunumu kişi içinde kararlı; ${respirationNightRule.aboveBaselineMean} nefes/dk notu`),
  ref('renteria-2024', 'Sporcularda kişisel başlangıca göre solunum'),
  ref('miller-2020', 'Gece solunumunda olağandan sapma'),
  ref('nicolo-2020', 'Solunumu etkileyen etkenler'),
];

/**
 * Fitness profili (karar 0061 sıra 4): uyku kuralının kaynağı genel yetişkin konsensüsü (uyku-kisa-fitness) ve durum
 * dili temkinli (gunun-durumu-dil-fitness). Kısa uykunun durumdaki yeri günün durumu kuralından (walsh-2021) kalır.
 */
function fitnessList(list: readonly SourceRef[]): SourceRef[] {
  return [
    ...list.map((s) => (s.id === 'walsh-2021' ? { ...s, use: 'Kısa uykunun günün durumuna katılması' } : s)),
    ref('watson-2015', `Yetişkinde gecede en az ${shortSleep.minHours} saat`),
    ref('hirshkowitz-2015', 'Yetişkin uyku süresi aralığı'),
    ref('medellin-ruiz-2020', 'HRV rehberli antrenman planlıdan üstün değil: temkinli dil'),
  ];
}

export const recoverySourcesFitness: readonly SourceRef[] = fitnessList(recoverySources);
export const recoverySourcesAppleFitness: readonly SourceRef[] = fitnessList(recoverySourcesApple);
