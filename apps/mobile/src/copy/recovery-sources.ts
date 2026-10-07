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
  ref('walsh-2021', `${shortSleep.minHours} saatin altı kısa uyku`),
  ref('natarajan-2021', `Gece solunumu kişi içinde kararlı; ${respirationNightRule.aboveBaselineMean} nefes/dk notu`),
  ref('renteria-2024', 'Sporcularda kişisel başlangıca göre solunum'),
  ref('miller-2020', 'Gece solunumunda olağandan sapma'),
  ref('nicolo-2020', 'Solunumu etkileyen etkenler'),
];
