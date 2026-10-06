// Kaynak künyeleri: research/sources dosyalarının başlık bilgisinden (yazar, yıl, tür).
// sources.test.ts her satırı kaynak dosyasıyla karşılaştırır; yeni kaynak eklenince buraya da eklenir.

export interface SourceCite {
  cite: string;
  kind: string;
}

export const sources = {
  'andrade-2020': { cite: 'Andrade ve ark., 2020', kind: 'Sistematik derleme' },
  'bache-mathiesen-2024': { cite: 'Bache-Mathiesen ve ark., 2024', kind: 'Kohort' },
  'bahr-2014': { cite: 'Bahr ve ark., 2014', kind: 'Kesitsel çalışma' },
  'bellenger-2016': { cite: 'Bellenger ve ark., 2016', kind: 'Meta-analiz' },
  'bourdon-2017': { cite: 'Bourdon ve ark., 2017', kind: 'Uzman konsensüsü' },
  'buchheit-2014': { cite: 'Buchheit, 2014', kind: 'Derleme' },
  'burger-2024': { cite: 'Burger ve ark., 2024', kind: 'Derleme' },
  'chan-2024': { cite: 'Chan ve ark., 2024', kind: 'Sistematik derleme' },
  'conte-2018': { cite: 'Conte ve ark., 2018', kind: 'Kohort' },
  'danielsson-2020': { cite: 'Danielsson ve ark., 2020', kind: 'Sistematik derleme' },
  'ding-2026': { cite: 'Ding ve ark., 2026', kind: 'Meta-analiz' },
  'doeven-2018': { cite: 'Doeven ve ark., 2018', kind: 'Sistematik derleme' },
  'duking-2021': { cite: 'Düking ve ark., 2021', kind: 'Meta-analiz' },
  'ferioli-2020': { cite: 'Ferioli ve ark., 2020', kind: 'Kohort' },
  'finnern-2026': { cite: 'Finnern ve ark., 2026', kind: 'Meta-analiz' },
  'foster-1998': { cite: 'Foster, 1998', kind: 'Kohort' },
  'foster-2001': { cite: 'Foster ve ark., 2001', kind: 'Kesitsel çalışma' },
  'gabbett-2016': { cite: 'Gabbett, 2016', kind: 'Derleme' },
  'gabbett-2025': { cite: 'Gabbett ve ark., 2025', kind: 'Derleme' },
  'griffin-2019': { cite: 'Griffin ve ark., 2019', kind: 'Sistematik derleme' },
  'haddad-2017': { cite: 'Haddad ve ark., 2017', kind: 'Derleme' },
  'harper-2022': { cite: 'Harper ve ark., 2022', kind: 'Derleme' },
  'hawker-2011': { cite: 'Hawker ve ark., 2011', kind: 'Derleme' },
  'hooper-1995': { cite: 'Hooper ve ark., 1995', kind: 'Kohort' },
  'impellizzeri-2020': { cite: 'Impellizzeri ve ark., 2020', kind: 'Uzman görüşü' },
  'impellizzeri-2021': { cite: 'Impellizzeri ve ark., 2021', kind: 'Kohort' },
  'kalkhoven-2021': { cite: 'Kalkhoven ve ark., 2021', kind: 'Derleme' },
  'lian-2005': { cite: 'Lian ve ark., 2005', kind: 'Kesitsel çalışma' },
  'lolli-2017': { cite: 'Lolli ve ark., 2017', kind: 'Uzman görüşü' },
  'magnusson-2010': { cite: 'Magnusson ve ark., 2010', kind: 'Derleme' },
  'manresa-rocamora-2021': { cite: 'Manresa-Rocamora ve ark., 2021', kind: 'Meta-analiz' },
  'maupin-2020': { cite: 'Maupin ve ark., 2020', kind: 'Sistematik derleme' },
  'mclean-2010': { cite: 'McLean ve ark., 2010', kind: 'Kohort' },
  'miller-2005': { cite: 'Miller ve ark., 2005', kind: 'Kohort' },
  'murray-2017': { cite: 'Murray ve ark., 2017', kind: 'Kohort' },
  'panagiotakis-2017': { cite: 'Panagiotakis ve ark., 2017', kind: 'Kesitsel çalışma' },
  'plews-2013': { cite: 'Plews ve ark., 2013', kind: 'Derleme' },
  'plews-2014': { cite: 'Plews ve ark., 2014', kind: 'Kohort' },
  'ren-2024': { cite: 'Ren ve ark., 2024', kind: 'Kohort' },
  'saw-2016': { cite: 'Saw ve ark., 2016', kind: 'Sistematik derleme' },
  'seidler-2025': { cite: 'Seidler ve ark., 2025', kind: 'Kohort' },
  'serner-2019': { cite: 'Serner ve ark., 2019', kind: 'Kesitsel çalışma' },
  'silbernagel-2007': { cite: 'Silbernagel ve ark., 2007', kind: 'Randomize kontrollü çalışma' },
  'soligard-2016': { cite: 'Soligard ve ark., 2016', kind: 'Uzman konsensüsü' },
  'sprague-2018': { cite: 'Sprague ve ark., 2018', kind: 'Meta-analiz' },
  'todri-2025': { cite: 'Todri ve ark., 2025', kind: 'Kesitsel çalışma' },
  'vanrenterghem-2017': { cite: 'Vanrenterghem ve ark., 2017', kind: 'Uzman görüşü' },
  'vesterinen-2016': { cite: 'Vesterinen ve ark., 2016', kind: 'Randomize kontrollü çalışma' },
  'walsh-2021': { cite: 'Walsh ve ark., 2021', kind: 'Uzman konsensüsü' },
  'weiss-2017': { cite: 'Weiss ve ark., 2017', kind: 'Kohort' },
  'williams-2017': { cite: 'Williams ve ark., 2017', kind: 'Uzman görüşü' },
  'zhang-2026': { cite: 'Zhang ve ark., 2026', kind: 'Kohort' },
} as const satisfies Record<string, SourceCite>;

export type SourceId = keyof typeof sources;
