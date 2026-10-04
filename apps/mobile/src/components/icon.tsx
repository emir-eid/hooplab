// Çizgi ikonları. Yollar design/maketler/veri.js'teki ikon setinden (24 × 24, yuvarlak uçlu çizgi).

import Svg, { Circle, Path } from 'react-native-svg';

const paths = {
  today: (
    <>
      <Circle cx={12} cy={12} r={4.2} />
      <Path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
  trend: (
    <>
      <Path d="M3 17l5.5-5.5 4 4L21 7" />
      <Path d="M15 7h6v6" />
    </>
  ),
  coach: (
    <>
      <Path d="M4 5.5h16v10.5H9.5L5 20v-4H4z" />
      <Path d="M8.5 10.5h7" />
    </>
  ),
  me: (
    <>
      <Circle cx={12} cy={8.5} r={3.8} />
      <Path d="M4.5 20.5c1.2-3.9 4-5.6 7.5-5.6s6.3 1.7 7.5 5.6" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  chevron: <Path d="M9 5l7 7-7 7" />,
  chevronBack: <Path d="M15 5l-7 7 7 7" />,
} as const;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, color, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {paths[name]}
    </Svg>
  );
}
