// Profil soruları (karar 0061 sıra 4c): ilk girişte bir kez (profile-setup) ve sonradan Ben → Profil'de (profile).
// Döngü takibi ve hormonal korunma yalnız Apple Sağlık profilinde ve "Kadın" seçiliyken sorulur.

import { spacing } from '@hooplab/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { ListGroup, ListRow } from '@/components/list';
import { Text } from '@/components/text';
import { contraceptionOptions, profileCopy, sexOptions, sourceLabels, sportLabels } from '@/copy/profile';
import { saveProfileAnswers, useProfile } from '@/data/profile';
import type { Contraception, Sex } from '@/data/profile-row';
import { usePalette } from '@/theme/appearance';

export function ProfileForm({ mode, onSaved }: { mode: 'setup' | 'edit'; onSaved: () => void }) {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const asksCycle = profile.dataSource === 'apple_health';
  // İlk girişte hiçbir seçenek seçili gelmez; düzenlemede kayıtlı yanıt.
  const [sex, setSex] = useState<Sex | null | undefined>(mode === 'setup' ? undefined : profile.sex);
  const [cycle, setCycle] = useState<boolean | undefined>(mode === 'setup' ? undefined : profile.cycleTracking);
  const [contraception, setContraception] = useState<Contraception | null>(mode === 'setup' ? null : profile.contraception);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showCycle = asksCycle && sex === 'kadin';
  const showContraception = showCycle && cycle === true;
  const complete = sex !== undefined && (!showCycle || cycle !== undefined) && (!showContraception || contraception !== null);

  async function save() {
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    const r = await saveProfileAnswers({ sex: sex ?? null, cycleTracking: showCycle && cycle === true, contraception: showContraception ? contraception : null });
    if (r.ok) onSaved();
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: mode === 'setup' ? insets.top + spacing[4] : 0 }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader
          title={profileCopy.title}
          subtitle={mode === 'setup' ? profileCopy.setupSubtitle : profileCopy.editSubtitle}
          closable={mode === 'edit'}
        />
        <FormBlock title={profileCopy.sexTitle}>
          <ChipSet>
            {sexOptions.map((o) => (
              <Chip key={o.label} label={o.label} selected={sex === o.value} onPress={() => setSex(o.value)} />
            ))}
          </ChipSet>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {profileCopy.sexNote(asksCycle)}
          </Text>
        </FormBlock>
        {showCycle ? (
          <FormBlock title={profileCopy.cycleTitle}>
            <Text variant="bodyCompact" style={styles.question}>
              {profileCopy.cycleQuestion}
            </Text>
            <ChipSet>
              <Chip label="Evet" selected={cycle === true} onPress={() => setCycle(true)} />
              <Chip label="Hayır" selected={cycle === false} onPress={() => setCycle(false)} />
            </ChipSet>
            <Text variant="caption" tone="inkMuted" style={styles.note}>
              {profileCopy.cycleNote}
            </Text>
          </FormBlock>
        ) : null}
        {showContraception ? (
          <FormBlock title={profileCopy.contraceptionTitle}>
            <ChipSet>
              {contraceptionOptions.map((o) => (
                <Chip key={o.value} label={o.label} selected={contraception === o.value} onPress={() => setContraception(o.value)} />
              ))}
            </ChipSet>
            <Text variant="caption" tone="inkMuted" style={styles.note}>
              {profileCopy.contraceptionNote}
            </Text>
          </FormBlock>
        ) : null}
        {mode === 'edit' ? (
          <View style={styles.account}>
            <ListGroup label={profileCopy.accountTitle} footer={profileCopy.accountNote}>
              <ListRow label="Veri kaynağı" value={sourceLabels[profile.dataSource]} />
              <ListRow label="Spor" value={sportLabels[profile.sport]} />
            </ListGroup>
          </View>
        ) : null}
      </GestureScrollView>
      <FormDock label={profileCopy.save} onPress={save} disabled={!complete} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  note: { marginTop: spacing[2.5] },
  question: { marginBottom: spacing[2.5] },
  account: { marginTop: spacing[4] },
});
