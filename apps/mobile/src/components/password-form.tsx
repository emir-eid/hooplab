// Şifre formu (karar 0061 sıra 6): ilk girişte geçici şifre yerine kendi şifreni koyma (password-setup) ve sonradan
// Ben → Şifreyi değiştir (password). Şifre ve geçici şifre bayrağı tek istekte değişir (auth/session.tsx).

import { spacing } from '@hooplab/theme';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { checkNewPassword, MIN_PASSWORD_LENGTH } from '@/auth/password';
import { useSession } from '@/auth/session';
import { FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { ListGroup, ListRow } from '@/components/list';
import { TextFieldRow, wideLabelWidth } from '@/components/text-field';
import { usePalette } from '@/theme/appearance';

const copy = {
  title: { setup: 'Şifreni koy', edit: 'Şifreyi değiştir' },
  subtitle: {
    setup: 'Sana verilen geçici şifre yerine yalnız senin bildiğin bir şifre koy. Sonraki girişlerde bunu kullanacaksın.',
    edit: 'Yeni şifre bundan sonraki bütün girişlerde geçerli olur.',
  },
  footer: `En az ${MIN_PASSWORD_LENGTH} karakter. Başka bir yerde kullandığın şifreyi seçme.`,
  save: 'Kaydet',
} as const;

export function PasswordForm({ mode, onSaved }: { mode: 'setup' | 'edit'; onSaved: () => void }) {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const insets = useSafeAreaInsets();
  const { changePassword, signOut } = useSession();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const repeatRef = useRef<ComponentRef<typeof TextInput>>(null);

  async function save() {
    if (busy) return;
    const problem = checkNewPassword(password, repeat);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const message = await changePassword(password);
    if (message) {
      setError(message);
      setBusy(false);
      return;
    }
    onSaved();
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: mode === 'setup' ? insets.top + spacing[4] : 0 }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }} keyboardShouldPersistTaps="handled">
        <FormHeader title={copy.title[mode]} subtitle={copy.subtitle[mode]} closable={mode === 'edit'} />
        <View style={styles.fields}>
          <ListGroup footer={copy.footer}>
            <TextFieldRow
              label="Yeni şifre"
              labelWidth={wideLabelWidth}
              value={password}
              onChangeText={setPassword}
              placeholder="Yeni şifren"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => repeatRef.current?.focus()}
              editable={!busy}
            />
            <TextFieldRow
              ref={repeatRef}
              label="Tekrar"
              labelWidth={wideLabelWidth}
              value={repeat}
              onChangeText={setRepeat}
              placeholder="Aynı şifre"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={save}
              editable={!busy}
            />
          </ListGroup>
        </View>
        {mode === 'setup' ? (
          <View style={styles.fields}>
            <ListGroup>
              <ListRow label="Çıkış yap" onPress={() => void signOut()} />
            </ListGroup>
          </View>
        ) : null}
      </GestureScrollView>
      <FormDock
        label={copy.save}
        onPress={save}
        disabled={password.length === 0 || repeat.length === 0}
        loading={busy}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fields: { marginTop: spacing[4] },
});
