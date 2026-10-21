// Web çıktısının kök HTML'i (yalnız web; native'de kullanılmaz). Expo'nun varsayılan şablonu
// (@expo/router-server/build/static/html.js) ve PWA yedek yolu için ana ekran bilgileri (karar 0054).
// Service worker yok: önbellek güncellemeleri kilitleyebilir, yalnız manifest en düşük riskli başlangıç.
// Portfolyonun demo derlemesi (0050) yüklenebilir uygulama gibi görünmesin diye manifesti almaz.

import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { demoOnlyBuild } from '@/lib/demo-only';

// Alt yolda yayınlanan derlemede (experiments.baseUrl) adresler o yolun altında olur.
const base = process.env.EXPO_BASE_URL ?? '';

export default function Root({ children }: PropsWithChildren) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();
  return (
    <html lang="tr" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        {demoOnlyBuild ? null : (
          <>
            <link rel="manifest" href={`${base}/manifest.webmanifest`} />
            <link rel="apple-touch-icon" href={`${base}/icons/icon-180.png`} />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-title" content="HoopLab" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="theme-color" content="#EFEDE8" media="(prefers-color-scheme: light)" />
            <meta name="theme-color" content="#0E0F11" media="(prefers-color-scheme: dark)" />
          </>
        )}
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
