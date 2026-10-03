// Yüklenecek fontlar. Anahtarlar @hooplab/theme `fontFamily` adlarıyla birebir aynı olmalı (tip bunu zorlar).
// Değerler Metro varlık kimlikleri (number). @expo-google-fonts paketleri kökten değil alt yoldan import
// edilir; kök tüm ağırlıkları pakete katar (LESSONS).

import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import type { FontFamily } from '@hooplab/theme';

export const fontMap: Record<FontFamily, number> = {
  // opsz 96 kesimi; tema paketinin kendi dosyası (packages/theme README "Fontlar").
  BricolageGrotesque96pt_800ExtraBold: require('@hooplab/theme/fonts/BricolageGrotesque96pt_800ExtraBold.ttf'),
  BricolageGrotesque_700Bold,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
};
