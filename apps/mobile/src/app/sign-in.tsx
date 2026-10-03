// Giriş ekranı. Tek kullanıcı: kayıt yok, hesap Supabase panosunda bir kez açılır ve yeni kayıtlar
// kapatılır. Bağlantı değerleri eksikse form yerine nedeni gösterilir (kurulum sihirbazı ileride, 0009).

import { layout, spacing } from '@hooplab/theme';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Card } from '@/components/card';
import { ListGroup } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { Text } from '@/components/text';
import { TextFieldRow } from '@/components/text-field';
import { supabaseConfig } from '@/lib/supabase';
import { usePalette } from '@/theme/appearance';

const configProblems = {
  missing: 'Supabase adresi ve publishable anahtarı ayarlanmamış.',
  'invalid-url': 'Supabase adresi geçersiz. https:// ile başlamalı.',
  'secret-key': 'Uygulamaya gizli anahtar verilmiş. Bu anahtar herkese açık pakete giremez; publishable anahtarı kullan.',
  'invalid-key': 'Publishable anahtar tanınmadı. sb_publishable_ ile başlamalı.',
} as const;

export default function SignInScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    const message = await signIn(email, password);
    // Başarılıysa oturum değişir ve gezinme bu ekranı kendisi kapatır.
    if (message) {
      setError(message);
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + spacing[10], paddingBottom: insets.bottom + spacing[6] }}>
        <PageHeader overline="HoopLab" title="Giriş yap" />

        {supabaseConfig.ok ? (
          <>
            <Text variant="bodyCompact" tone="inkSecondary" style={styles.lead}>
              Supabase projende açtığın hesapla giriş yap. Oturum bu iPhone'da şifreli saklanır.
            </Text>
            <ListGroup>
              <TextFieldRow
                label="E-posta"
                value={email}
                onChangeText={setEmail}
                placeholder="ad@ornek.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!busy}
              />
              <TextFieldRow
                ref={passwordRef}
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                placeholder="Şifren"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                editable={!busy}
              />
            </ListGroup>
            {error ? (
              <Text
                variant="footnoteMedium"
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.error, { color: palette.statusInk.red }]}>
                {error}
              </Text>
            ) : null}
            <PrimaryButton label="Giriş yap" onPress={submit} disabled={!canSubmit} loading={busy} style={styles.button} />
          </>
        ) : (
          <Card>
            <Text variant="headline">Bağlantı ayarlanmadı</Text>
            <Text variant="bodyCompact" tone="inkSecondary">
              {configProblems[supabaseConfig.problem]}
            </Text>
            <Text variant="footnoteRegular" tone="inkMuted">
              apps/mobile/.env.local dosyasına EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              değerlerini yaz, sonra Metro'yu yeniden başlat.
            </Text>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  lead: {
    marginTop: spacing[2],
    marginBottom: spacing[5],
    marginHorizontal: layout.screenInset,
  },
  error: {
    marginTop: spacing[3],
    marginHorizontal: layout.cardInset + spacing[4],
  },
  button: {
    marginTop: spacing[6],
  },
});
