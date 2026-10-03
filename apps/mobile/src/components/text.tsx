// Uygulamadaki tek metin bileşeni: yazı stili @hooplab/theme `type` token'ından, renk etkin paletten.
// allowFontScaling kapatılmaz (Dynamic Type; packages/theme README).

import { type, type TextVariant } from '@hooplab/theme';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { usePalette } from '@/theme/appearance';

export type TextTone = 'ink' | 'inkSecondary' | 'inkMuted' | 'onInk' | 'onStrong' | 'onResult';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({ variant = 'body', tone = 'ink', style, ...rest }: TextProps) {
  const palette = usePalette();
  return <RNText style={[type[variant], { color: palette[tone] }, style]} {...rest} />;
}
