// Bugün ekranının toparlanma bölümleri (maket: .state, .advice, "Gece verisi"); karar 0021.
// Solunum kişisel bantla okunur ve tek gece notu düşebilir, ama günün durumuna girmez (karar 0028).
// Sayılar motordan (packages/engine), metinler copy/recovery'den; burada yalnız yerleşim.

import { layout, radius, size, spacing } from "@hooplab/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Card } from "@/components/card";
import { HrvChart } from "@/components/hrv-chart";
import { Icon } from "@/components/icon";
import { ExplainButton, InfoButton, openExplainer } from "@/components/info-button";
import { GroupLabel, ListGroup, ListRow } from "@/components/list";
import { Text } from "@/components/text";
import {
  bandNote,
  bandSectionNote,
  formatBand,
  formatDecimal,
  formatSleep,
  hrvChartTitle,
  hrvLineLegend,
  levelLabels,
  levelStates,
  rollingLabel,
  rollingSpoken,
  sleepRollingLabel,
  statusAdvice,
  statusChips,
  statusReason,
} from "@/copy/recovery";
import type { ExplainerId } from "@/copy/explainers";
import {
  respirationHighBody,
  respirationHighFooter,
  respirationHighTitle,
  respirationNote,
} from "@/copy/personal-baseline";
import type { RecoveryView } from "@/data/recovery-view";
import { usePalette } from "@/theme/appearance";
import { formatShortDate } from "@/utils/format-date";

const openMethod = () => router.push("/recovery-method");

/** "Bugünün durumu": büyük etiket, gerekçe, çipler ve tek öneri. Hale ekranın kendisinde çizilir. */
export function RecoveryState({ view }: { view: RecoveryView }) {
  const palette = usePalette();
  const state = levelStates[view.status.level];
  const chips = statusChips(view);
  const advice = statusAdvice(view);
  const label = view.empty ? "Veri bekleniyor" : levelLabels[view.status.level];

  return (
    <>
      <View style={styles.state}>
        <Text variant="eyebrow" tone="inkSecondary">
          Bugünün durumu
        </Text>
        <Text
          variant={state ? "display" : "title2"}
          style={styles.label}
          accessibilityRole="header"
        >
          {label}
        </Text>
        <View style={styles.reasonRow}>
          <Text variant="body" style={styles.reason}>
            {statusReason(view)}
          </Text>
          <InfoButton
            onPress={openMethod}
            accessibilityLabel="Kaynaklar ve yöntem"
            style={styles.cite}
          />
        </View>
        {chips.length > 0 ? (
          <View style={styles.chips}>
            {chips.map((c) => (
              <View
                key={c}
                style={[styles.chip, { backgroundColor: palette.chip }]}
              >
                <Text variant="footnote">{c}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {advice ? (
        <Card style={styles.advice}>
          <View
            style={[
              styles.adviceIcon,
              {
                backgroundColor: state
                  ? palette.derived.statusTint[state]
                  : palette.cardMuted,
              },
            ]}
          >
            <Icon
              name="today"
              size={22}
              strokeWidth={2}
              color={state ? palette.statusInk[state] : palette.inkSecondary}
            />
          </View>
          <View style={styles.adviceText}>
            <Text variant="footnote" tone="inkMuted">
              Bugün için
            </Text>
            <Text variant="bodyCompact">{advice}</Text>
          </View>
        </Card>
      ) : null}
    </>
  );
}

export interface TileProps {
  label: string;
  value: string;
  unit: string;
  note: string;
  /** Bu ölçüm günün durumuna katkı verdi mi (nokta ve not durum renginde). */
  flagged: boolean;
  state: "green" | "yellow" | "red" | null;
  /** Verilirse kart dokunulabilir ve açıklama alt sayfasını açar (karar 0026). */
  explain?: ExplainerId;
}

export function Tile({ label, value, unit, note, flagged, state, explain }: TileProps) {
  const palette = usePalette();
  const accent = flagged && state ? palette.statusInk[state] : null;
  return (
    <Pressable
      disabled={!explain}
      onPress={explain ? () => openExplainer(explain, value === "–" ? undefined : `${value} ${unit}`.trim()) : undefined}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: palette.card, boxShadow: palette.shadow.card },
        pressed && styles.pressed,
      ]}
      accessibilityRole={explain ? "button" : undefined}
      accessibilityLabel={`${label}: ${value} ${unit}, ${note}`}
      accessibilityHint={explain ? "Ne olduğunu ve nasıl okunduğunu açar" : undefined}
    >
      <View style={styles.tileHead}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                flagged && state ? palette.status[state] : palette.dot,
            },
          ]}
        />
        <Text variant="footnote" tone="inkSecondary" style={styles.tileLabel}>
          {label}
        </Text>
        {explain ? (
          <View style={[styles.tileInfo, { borderColor: palette.inkMuted }]}>
            <Text variant="micro" tone="inkMuted" style={styles.tileInfoText}>
              i
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.valueRow}>
        <Text variant="metric">{value}</Text>
        <Text variant="footnote" tone="inkMuted">
          {unit}
        </Text>
      </View>
      <Text
        variant="caption"
        tone="inkMuted"
        style={accent ? { color: accent } : undefined}
      >
        {note}
      </Text>
    </Pressable>
  );
}

const dash = "–";

/** "Gece verisi": HRV grafiği ve dört ölçüm kartı. */
export function NightData({ view }: { view: RecoveryView }) {
  const palette = usePalette();
  const state = levelStates[view.status.level];
  const signals = view.status.signals;
  const { hrv, rhr, sleep, respiration } = view;
  const band = formatBand(hrv);
  const hrvValue =
    hrv.rolling === null ? dash : String(Math.round(hrv.rolling));
  const lastHrv = hrv.latest;
  // Grafikte seçilen gün; null iken başlık bugünün 7 günlük ortalamasını gösterir.
  const [selected, setSelected] = useState<number | null>(null);
  const day = selected !== null ? view.chart[selected] : undefined;
  const round = (v: number | null) =>
    v === null ? dash : String(Math.round(v));

  return (
    <>
      <View style={styles.sectionHead}>
        <GroupLabel>Gece verisi</GroupLabel>
        <Text variant="caption" tone="inkMuted" style={styles.sectionNote}>
          {bandSectionNote}
        </Text>
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHead}>
          <View accessibilityLiveRegion="polite">
            <View style={styles.titleRow}>
              <Text variant="footnote" tone="inkSecondary">
                {day
                  ? `${formatShortDate(day.date)} · gece`
                  : hrvChartTitle}
              </Text>
              <ExplainButton id="hrv" value={hrv.rolling === null ? undefined : `${hrvValue} ms`} />
            </View>
            <View style={styles.valueRow}>
              <Text variant="metric">{day ? round(day.value) : hrvValue}</Text>
              <Text variant="footnote" tone="inkMuted">
                ms
              </Text>
            </View>
          </View>
          {day ? (
            <View style={styles.chartHeadRight}>
              <Text variant="caption" tone="inkMuted">
                {`${rollingLabel} ${round(day.rolling)}`}
              </Text>
              {band ? (
                <Text variant="caption" tone="inkMuted">
                  bugünkü bant {band}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.chartHeadRight}>
              <Text
                variant="caption"
                tone="inkMuted"
                style={
                  state &&
                  (signals.includes("hrv_low") || signals.includes("hrv_high"))
                    ? { color: palette.statusInk[state] }
                    : undefined
                }
              >
                {bandNote(hrv)}
              </Text>
              {band ? (
                <Text variant="caption" tone="inkMuted">
                  bant {band}
                </Text>
              ) : null}
            </View>
          )}
        </View>
        <HrvChart
          days={view.chart}
          band={hrv.band}
          accent={state ? palette.status[state] : null}
          selected={selected}
          onSelect={setSelected}
          accessibilityLabel={`HRV, son ${view.chart.length} gün. ${rollingSpoken} ${hrvValue} milisaniye${band ? `, kişisel bant ${band}` : ", bant henüz yok"}.`}
        />
        <View style={styles.legend}>
          <Text variant="caption2" tone="inkMuted">
            {hrvLineLegend}
          </Text>
          <Text variant="caption2" tone="inkMuted">
            Nokta: tek gece
          </Text>
          {band ? (
            <Text variant="caption2" tone="inkMuted">
              Şerit: kişisel bant
            </Text>
          ) : null}
        </View>
      </Card>

      <View style={styles.grid}>
        <Tile
          label="Dinlenik nabız"
          explain="rhr"
          value={rhr.rolling === null ? dash : String(Math.round(rhr.rolling))}
          unit="atım/dk"
          note={
            rhr.rolling === null
              ? bandNote(rhr)
              : `${rollingLabel} · ${bandNote(rhr)}`
          }
          flagged={signals.includes("rhr_high")}
          state={state}
        />
        <Tile
          label="Uyku"
          explain="sleep"
          value={sleep.lastNight ? formatSleep(sleep.lastNight.minutes) : dash}
          unit="sa"
          note={
            sleep.rollingHours === null
              ? `${sleepRollingLabel} için veri az`
              : `${sleepRollingLabel} ${formatSleep(sleep.rollingHours * 60)}`
          }
          flagged={signals.includes("sleep_short")}
          state={state}
        />
        <Tile
          label="Son gece HRV"
          explain="hrvNight"
          value={lastHrv ? String(Math.round(lastHrv.value)) : dash}
          unit="ms"
          note="tek gece, gürültülü"
          flagged={false}
          state={state}
        />
        <Tile
          label="Solunum"
          explain="respiration"
          value={respiration.latest ? formatDecimal(respiration.latest.value) : dash}
          unit="/dk"
          note={respirationNote(respiration)}
          flagged={false}
          state={state}
        />
      </View>

      {respiration.nightHigh ? (
        <Card>
          <View style={styles.titleRow}>
            <Text variant="callout" style={styles.noteTitle}>
              {respirationHighTitle}
            </Text>
            <ExplainButton id="respiration" />
          </View>
          <Text variant="footnoteRegular" tone="inkSecondary" style={styles.noteBody}>
            {respirationHighBody(respiration)}
          </Text>
          <Text variant="caption" tone="inkMuted" style={styles.noteBody}>
            {respirationHighFooter}
          </Text>
        </Card>
      ) : null}

      {/* Etiketsiz liste grubunun üst boşluğu yok; kutucuk ızgarasına yapışmasın. */}
      <View style={styles.methodGap}>
        <ListGroup footer="İzleme özeti, tanı değil. Göğüs ağrısı, çarpıntı veya olağandışı nabız gibi bir belirti varsa doktora başvur.">
          <ListRow
            label="Nasıl hesaplanıyor?"
            detail="Yöntem ve kaynaklar"
            onPress={openMethod}
          />
        </ListGroup>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  state: {
    paddingTop: layout.stateTop,
    paddingHorizontal: layout.screenInset,
  },
  label: { marginTop: spacing[0.5] },
  reasonRow: {
    marginTop: spacing[3],
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[1.5],
  },
  reason: { flexShrink: 1, maxWidth: 330 },
  cite: { marginTop: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing[1.5] },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1.5],
    marginTop: spacing[4],
  },
  chip: {
    height: size.chip,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    justifyContent: "center",
  },
  advice: {
    marginTop: spacing[7],
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  adviceIcon: {
    width: size.iconTile,
    height: size.iconTile,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  adviceText: { flex: 1, gap: spacing[0.5] },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionNote: { marginRight: layout.screenInset },
  chartCard: { paddingHorizontal: spacing[3] },
  chartHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing[1],
  },
  chartHeadRight: { alignItems: "flex-end" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    paddingHorizontal: spacing[1],
    marginTop: spacing[1.5],
  },
  methodGap: { marginTop: layout.cardGap },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: layout.gridGap,
    marginHorizontal: layout.cardInset,
    marginTop: layout.cardGap,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingTop: spacing[3.5],
    paddingHorizontal: spacing[3.5],
    paddingBottom: spacing[3.5],
    borderRadius: radius.xl,
    borderCurve: "continuous",
  },
  tileHead: { flexDirection: "row", alignItems: "center", gap: spacing[1.5] },
  tileLabel: { flex: 1 },
  tileInfo: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileInfoText: { lineHeight: 14 },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[1],
    marginTop: spacing[2],
  },
  pressed: { opacity: 0.85 },
  noteTitle: { flex: 1 },
  noteBody: { marginTop: spacing[1.5] },
});
