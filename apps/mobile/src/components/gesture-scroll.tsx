// Gesture Handler'ın ScrollView'u, ref'ini bağlamla verir. İçindeki sürüklemeli kontroller (ScaleSlider,
// BodyView) bu ref'le kaydırmayı kendi hareketleri bitene veya başarısız olana dek bekletir (LESSONS).

import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const GestureScrollContext = createContext<RefObject<ScrollView | null> | null>(null);

export function GestureScrollView(props: ScrollViewProps & { children: ReactNode }) {
  const ref = useRef<ScrollView>(null);
  return (
    <GestureScrollContext.Provider value={ref}>
      <ScrollView ref={ref} {...props} />
    </GestureScrollContext.Provider>
  );
}

/** Çevreleyen GestureScrollView'un ref'i; yoksa null. */
export function useGestureScrollRef(): RefObject<ScrollView | null> | null {
  return useContext(GestureScrollContext);
}
