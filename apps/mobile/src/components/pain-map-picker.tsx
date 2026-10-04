// Ağrı haritası girişi (maket: check-in'deki "Ağrı ve sertlik" bloğu). Bölge çipine dokununca altında
// o bölgenin tarafları açılır; her taraf 0-10 kaydırıcı. Çipteki rozet bölgenin en yüksek değeri.
// Vücut görünümü geldiğinde aynı bölge listesi (@hooplab/engine bodyRegions) orada da kullanılacak.

import { bodyRegions, painScale, sidesOf, type BodyRegion } from '@hooplab/engine';
import { spacing } from '@hooplab/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { ScaleSlider } from '@/components/scale-slider';
import { Text } from '@/components/text';
import { regionLabels, sideLabels } from '@/copy/labels';
import { painOf, regionMax, setPain, type PainMap } from '@/data/pain-map';
import { usePalette } from '@/theme/appearance';

interface PainMapPickerProps {
  value: PainMap;
  onChange: (value: PainMap) => void;
}

export function PainMapPicker({ value, onChange }: PainMapPickerProps) {
  const palette = usePalette();
  const [open, setOpen] = useState<BodyRegion | null>(null);

  return (
    <View>
      <ChipSet>
        {bodyRegions.map((region) => {
          const max = regionMax(value, region);
          return (
            <Chip
              key={region}
              label={regionLabels[region]}
              role="button"
              selected={open === region}
              accessibilityHint={open === region ? 'Kapatmak için dokun' : 'Ağrıyı girmek için dokun'}
              onPress={() => setOpen(open === region ? null : region)}
              {...(max > 0 ? { badge: max } : {})}
            />
          );
        })}
      </ChipSet>

      {open ? (
        <View style={[styles.editor, { borderTopColor: palette.line }]}>
          {sidesOf(open).map((side) => {
            const spot = { region: open, side };
            const pain = painOf(value, spot);
            const name = side === 'center' ? regionLabels[open] : `${regionLabels[open]} · ${sideLabels[side].toLocaleLowerCase('tr')}`;
            return (
              <View key={side} style={styles.side}>
                <View style={styles.sideHead}>
                  <Text variant="callout">{name}</Text>
                  <Text variant="footnoteMedium" tone="inkMuted">
                    {pain === 0 ? 'Yok' : `${pain} / ${painScale.max}`}
                  </Text>
                </View>
                <ScaleSlider
                  value={pain}
                  onChange={(next) => onChange(setPain(value, spot, next))}
                  min={painScale.min}
                  max={painScale.max}
                  label={`${name} ağrı veya sertlik`}
                  low="Yok"
                  high="En kötü"
                />
              </View>
            );
          })}
        </View>
      ) : (
        <Text variant="caption" tone="inkMuted" style={styles.hint}>
          Ağrıyan veya sertleşen bölgeye dokun. Boş bırakılan bölge "ağrı yok" sayılır.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    marginTop: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  side: {
    paddingTop: spacing[2],
  },
  sideHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  hint: {
    marginTop: spacing[3],
  },
});
