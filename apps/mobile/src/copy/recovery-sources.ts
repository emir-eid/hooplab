// "Nasıl hesaplanıyor?" ekranının kaynak listesi. Kimlikler research/sources dosya adlarıdır;
// recovery-sources.test.ts listenin rules/toparlanma.json'daki kaynaklarla aynı kaldığını denetler.

export interface SourceRef {
  id: string;
  cite: string;
  kind: string;
  /** Uygulamada ne için kullanıldığı. */
  use: string;
}

export const recoverySources: readonly SourceRef[] = [
  { id: 'manresa-rocamora-2021', cite: 'Manresa-Rocamora ve ark., 2021', kind: 'Meta-analiz', use: '7 günlük ortalama, 4 haftalık bant, ± 0,5 SD' },
  { id: 'vesterinen-2016', cite: 'Vesterinen ve ark., 2016', kind: 'Randomize kontrollü çalışma', use: 'Bant dışında düşük yoğunluk kuralı' },
  { id: 'duking-2021', cite: 'Düking ve ark., 2021', kind: 'Meta-analiz', use: 'Giyilebilir cihazla ölçülen HRV' },
  { id: 'plews-2014', cite: 'Plews ve ark., 2014', kind: 'Kohort', use: 'Haftada en az 3 geçerli gece' },
  { id: 'plews-2013', cite: 'Plews ve ark., 2013', kind: 'Derleme', use: 'Ortalamayla okuma, HRV nabızla birlikte' },
  { id: 'buchheit-2014', cite: 'Buchheit, 2014', kind: 'Derleme', use: 'Derin uyku HRV, anlamlı değişim' },
  { id: 'bellenger-2016', cite: 'Bellenger ve ark., 2016', kind: 'Meta-analiz', use: 'HRV tek başına yetmez' },
  { id: 'walsh-2021', cite: 'Walsh ve ark., 2021', kind: 'Uzman konsensüsü', use: '7 saatin altı kısa uyku' },
];
