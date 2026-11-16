// Bugün'de "Adım" kartı (karar 0061 sıra 6, yalnız fitness profili): bugün şu ana kadar; dün ve 7 gün ortalaması
// etiketli satırlarda (enerji kartıyla aynı düzen). Hedef, renk ve uyarı yok; kartta tek sade cümle başvuru noktasını söyler.

import { layout } from '@hooplab/theme';
import { StyleSheet, View } from 'react-native';

import { Tile } from '@/components/recovery-section';
import { formatSteps, stepsNote, stepsPageRows, stepsRows, stepsTitle } from '@/copy/steps';
import type { StepsView } from '@/data/steps-view';

const dash = '–';

export function StepsCard({ view }: { view: StepsView }) {
  const { reading } = view;
  return (
    <View style={styles.grid}>
      <Tile
        label={stepsTitle}
        explain="steps"
        value={reading.today === null ? dash : formatSteps(reading.today)}
        unit="adım"
        note={stepsNote(reading, view.updatedAt)}
        rows={stepsRows(reading)}
        pageRows={stepsPageRows(reading)}
        flagged={false}
        state={null}
        wide
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', marginHorizontal: layout.cardInset, marginTop: layout.cardGap },
});
