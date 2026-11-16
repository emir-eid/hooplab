// Rıza ekranı (karar 0061 sıra 6): profiles.consented_at boşsa uygulama yalnız bu ekranı açar (_layout.tsx).
// Onaydan önce Apple senkronu, bildirim kaydı ve koç çalışmaz; onaylamayanın oturumu kapanır. Sahibine çıkmaz.

import { spacing } from '@hooplab/theme';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { ListGroup, ListRow } from '@/components/list';
import { Text } from '@/components/text';
import { consentCopy, consentVersion, privacyUrl } from '@/copy/consent';
import { saveConsent } from '@/data/profile';
import { usePalette } from '@/theme/appearance';

export default function ConsentScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const insets = useSafeAreaInsets();
  const { signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await saveConsent(consentVersion);
    // Başarılıysa profil yenilenir ve gezinme bu ekranı kendisi kapatır.
    if (!r.ok) {
      setError(r.message);
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top + spacing[4] }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader title={consentCopy.title} subtitle={consentCopy.subtitle} closable={false} />
        {consentCopy.sections.map((s) => (
          <FormBlock key={s.title} title={s.title}>
            <Text variant="bodyCompact">{s.body}</Text>
          </FormBlock>
        ))}
        <View style={styles.links}>
          <ListGroup footer={consentCopy.declineNote}>
            <ListRow label={consentCopy.privacyLink} onPress={() => void WebBrowser.openBrowserAsync(privacyUrl)} />
            <ListRow label={consentCopy.decline} onPress={() => void signOut()} />
          </ListGroup>
        </View>
      </GestureScrollView>
      <FormDock label={consentCopy.accept} onPress={accept} disabled={false} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  links: { marginTop: spacing[4] },
});
