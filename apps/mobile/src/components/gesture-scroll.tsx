// Gesture Handler'ın ScrollView'u, kendi native hareketini bağlamla verir. İçindeki sürüklemeli kontroller
// (ScaleSlider, BodyView, grafikler) bu hareketi `block` ile kendi hareketleri bitene veya başarısız olana dek
// bekletir (LESSONS). Gesture Handler 3'ün ScrollView'u hook API'siyle yazılmış; kontroller de hook API'sinde.

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView, type NativeGesture } from 'react-native-gesture-handler';

const GestureScrollContext = createContext<NativeGesture | null>(null);

export function GestureScrollView(props: ScrollViewProps & { children: ReactNode }) {
  // ScrollView bunu yalnız hareketin kimliği değişince çağırır; setState kararlı olduğundan döngü olmaz.
  const [scrollGesture, setScrollGesture] = useState<NativeGesture | null>(null);
  return (
    <GestureScrollContext.Provider value={scrollGesture}>
      <ScrollView {...props} onGestureUpdate_CAN_CAUSE_INFINITE_RERENDER={setScrollGesture} />
    </GestureScrollContext.Provider>
  );
}

/** Çevreleyen GestureScrollView'un kaydırma hareketi; yoksa (veya henüz kurulmadıysa) undefined. */
export function useGestureScrollBlock(): NativeGesture | undefined {
  return useContext(GestureScrollContext) ?? undefined;
}
