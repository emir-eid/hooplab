// Gesture Handler'ın ScrollView'u, ref'ini bağlamla verir. İçindeki sürüklemeli kontroller (ScaleSlider,
// BodyView) bu ref'le kaydırmayı kendi hareketleri bitene veya başarısız olana dek bekletir (LESSONS).
// Gesture Handler 3'te ScrollView hook API'siyle yeniden yazıldı ve eski API'deki hareketlerle (Gesture.Pan)
// ilişki kurulamıyor; kontroller hook API'sine geçene dek eski uygulama (LegacyScrollView) kullanılır.

import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import type { ScrollViewProps } from 'react-native';
import { LegacyScrollView } from 'react-native-gesture-handler';

const GestureScrollContext = createContext<RefObject<LegacyScrollView | null> | null>(null);

export function GestureScrollView(props: ScrollViewProps & { children: ReactNode }) {
  const ref = useRef<LegacyScrollView>(null);
  return (
    <GestureScrollContext.Provider value={ref}>
      <LegacyScrollView ref={ref} {...props} />
    </GestureScrollContext.Provider>
  );
}

/** Çevreleyen GestureScrollView'un ref'i; yoksa null. */
export function useGestureScrollRef(): RefObject<LegacyScrollView | null> | null {
  return useContext(GestureScrollContext);
}
