// "Nasıl hesaplanıyor?" ekranının kaynak listesi. Kimlikler research/sources dosya adlarıdır, künyeler copy/sources'tan;
// recovery-sources.test.ts listenin rules/toparlanma.json'daki kaynaklarla aynı kaldığını denetler.

import { sources, type SourceCite, type SourceId } from './sources.ts';

export interface SourceRef extends SourceCite {
  id: SourceId;
  /** Uygulamada ne için kullanıldığı. */
  use: string;
}

const ref = (id: SourceId, use: string): SourceRef => ({ id, ...sources[id], use });

export const recoverySources: readonly SourceRef[] = [
  ref('manresa-rocamora-2021', '7 günlük ortalama, 4 haftalık bant, ± 0,5 SD'),
  ref('vesterinen-2016', 'Bant dışında düşük yoğunluk kuralı'),
  ref('duking-2021', 'Giyilebilir cihazla ölçülen HRV'),
  ref('plews-2014', 'Haftada en az 3 geçerli gece'),
  ref('plews-2013', 'Ortalamayla okuma, HRV nabızla birlikte'),
  ref('buchheit-2014', 'Derin uyku HRV, anlamlı değişim'),
  ref('bellenger-2016', 'HRV tek başına yetmez'),
  ref('walsh-2021', '7 saatin altı kısa uyku'),
];
