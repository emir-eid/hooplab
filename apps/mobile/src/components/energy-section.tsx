// Bugün'de "Yakılan enerji" kartı (karar 0043): bilekliğin günlük toplamı, bugün şu ana kadar; dün ve 7 gün ortalaması
// etiketli satırlarda (karar 0042 düzeni). Tahmin: eşik, hedef ve durum rengi yok; alımla yan yana konmaz.

import { layout } from '@hooplab/theme';
import { StyleSheet, View } from 'react-native';

import { Tile } from '@/components/recovery-section';
import { energyNote, energyPageRows, energyRows, energyTitle, formatKcal } from '@/copy/energy';
import type { EnergyView } from '@/data/energy-view';

export function EnergyCard({ view }: { view: EnergyView }) {
  const { reading } = view;
  return (
    <View style={styles.grid}>
      <Tile
        label={energyTitle}
        explain="energy"
        value={reading.today === null ? '–' : formatKcal(reading.today)}
        unit="kcal"
        note={energyNote(reading, view.updatedAt)}
        rows={energyRows(reading)}
        pageRows={energyPageRows(reading)}
        flagged={false}
        state={null}
        wide
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    marginHorizontal: layout.cardInset,
    marginTop: layout.cardGap,
  },
});
