// Gruplu liste içinde metin alanı satırı (maket .row ölçüleri): solda etiket, sağda alan.
// ListGroup içine ListRow gibi konur. Kayıt formlarında da kullanılacak.

import { size, spacing, type } from '@hooplab/theme';
import type { Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface TextFieldRowProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  ref?: Ref<TextInput>;
}

export function TextFieldRow({ label, accessibilityLabel, ref, ...rest }: TextFieldRowProps) {
  const palette = usePalette();
  return (
    <View style={styles.row}>
      <Text variant="rowLabel" style={styles.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={palette.inkMuted}
        selectionColor={palette.ink}
        style={[styles.input, { color: palette.ink }]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  label: {
    width: 72,
  },
  input: {
    // lineHeight verilmez: iOS'ta tek satırlık TextInput'ta metni dikeyde kaydırır.
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
    letterSpacing: type.body.letterSpacing,
    flex: 1,
    // Dokunma alanı satırın tamamı kadar olsun.
    minHeight: size.row,
    paddingVertical: 0,
  },
});
