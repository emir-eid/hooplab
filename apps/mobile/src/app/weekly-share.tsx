// Haftalık raporu PDF olarak paylaşma (karar 0051): hangi bölümün gireceğini kullanıcı seçer; PDF telefonda üretilir
// ve iOS paylaşım menüsüyle kullanıcının seçtiği yere gider. Sunucuya gitmez; ad ya da hesap bilgisi yazılmaz.
// Haftanın kabul edilmiş koç yorumu varsa (karar 0052) o da seçilebilir; yalnız saklanana bakılır, model çağrılmaz.

import { weekStartOf } from '@hooplab/engine';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { ListGroup, ListRow } from '@/components/list';
import { shareFooter, shareRowLabel, weekRangeText } from '@/copy/weekly-report';
import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';

import { fetchCoachWeekly } from '@/data/coach-weekly';
import { buildWeeklyCoachSnapshot } from '@/data/coach-weekly-snapshot';
import { fetchWeeklyReport } from '@/data/weekly-report';
import { buildWeeklyReportHtml, pdfFileName, pdfPage, pdfSectionKeys, pdfSectionLabels, type PdfSection } from '@/data/weekly-report-pdf';
import type { WeeklyReport } from '@/data/weekly-report-view';
import { sharePdf } from '@/lib/share-pdf';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

function isIsoWeek(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && weekStartOf(value) === value;
}

export default function WeeklyShareScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const params = useLocalSearchParams<{ week?: string }>();
  const [today] = useState(() => toLocalDate(new Date()));
  const week = isIsoWeek(params.week) ? params.week : null;
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [chosen, setChosen] = useState<ReadonlySet<PdfSection>>(() => new Set(pdfSectionKeys));
  const [coach, setCoach] = useState<AuditSentence[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(week ? null : 'Hafta bulunamadı.');

  useEffect(() => {
    if (!week) return;
    let cancelled = false;
    fetchWeeklyReport(week, today).then((r) => {
      if (cancelled) return;
      if (!r.ok) return setError(r.message);
      setReport(r.value);
      const snapshot = buildWeeklyCoachSnapshot(r.value.view);
      if (!snapshot) return;
      void fetchCoachWeekly(snapshot, 'peek').then((c) => {
        if (!cancelled && c.ok && c.value.response.status === 'accepted') setCoach(c.value.response.sentences);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [week, today]);

  // Koç yorumu yalnız varsa listelenir (ve PDF'e girer).
  const offered = pdfSectionKeys.filter((key) => key !== 'coach' || coach);
  const toggle = (key: PdfSection, on: boolean) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  async function share() {
    if (!report) return;
    setBusy(true);
    setError(null);
    try {
      const html = buildWeeklyReportHtml(report.view, { sections: pdfSectionKeys.filter((k) => chosen.has(k)), preparedOn: today, coach });
      await sharePdf({ html, fileName: pdfFileName(report.view.weekStart), ...pdfPage });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF hazırlanamadı.');
    } finally {
      setBusy(false);
    }
  }

  const subtitle = report ? `${weekRangeText(report.view.weekStart, report.view.weekEnd)} · girecek bölümleri seç.` : 'Girecek bölümleri seç.';

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader title={shareRowLabel} subtitle={subtitle} />
        <ListGroup label="Bölümler" footer={shareFooter}>
          {offered.map((key) => (
            <ListRow
              key={key}
              label={pdfSectionLabels[key]}
              accessory={
                <Switch
                  value={chosen.has(key)}
                  onValueChange={(on) => toggle(key, on)}
                  trackColor={{ true: palette.status.green }}
                  accessibilityLabel={pdfSectionLabels[key]}
                />
              }
            />
          ))}
        </ListGroup>
      </GestureScrollView>
      <FormDock
        label="PDF hazırla ve paylaş"
        onPress={() => void share()}
        disabled={!report || !offered.some((k) => chosen.has(k))}
        loading={busy || (!report && !error)}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
