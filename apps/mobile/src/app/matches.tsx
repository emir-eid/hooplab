// Takvim: maçlar (karar 0046) ve seyahatler (karar 0047). Dünden itibaren kayıtlı maçlar ve bitmemiş seyahatler;
// dokununca düzenlenir. Maç günü ile bir gün öncesi ve sonrası beslenmede maç çevresi sayılır; Bugün'de maç çevresi ve
// seyahat kartları çıkar.

import { addIsoDays, upcomingTrips, type Match, type Trip } from '@hooplab/engine';
import { layout } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { matchCalendarFooter, matchMeta, matchRowLabel } from '@/copy/match';
import { offsetLabel, tripCalendarFooter, tripRowLabel } from '@/copy/travel';
import { matchDaysAhead, matchListPastDays } from '@/data/match-view';
import { fetchMatches } from '@/data/matches';
import { tripDaysAhead, tripLookbackDays } from '@/data/trip-view';
import { fetchTrips } from '@/data/trips';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

export default function MatchesScreen() {
  const palette = usePalette();
  const [today] = useState(() => toLocalDate(new Date()));
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void fetchMatches(addIsoDays(today, -matchListPastDays), addIsoDays(today, matchDaysAhead)).then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setMatches(r.value);
          setError(null);
        } else setError(r.message);
      });
      void fetchTrips(addIsoDays(today, -tripLookbackDays), addIsoDays(today, tripDaysAhead)).then((r) => {
        if (cancelled) return;
        if (r.ok) setTrips(upcomingTrips(today, r.value));
        else setError(r.message);
      });
      return () => {
        cancelled = true;
      };
    }, [today]),
  );

  const tomorrow = addIsoDays(today, 1);
  return (
    <Screen>
      <PageHeader title="Takvim" backLabel="Bugün" />
      {error ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {matches ? (
        <ListGroup label="Maçlar" footer={matchCalendarFooter}>
          {matches.length === 0 ? <ListRow label="Takvimde maç yok" /> : null}
          {matches.map((m) => (
            <ListRow
              key={m.date}
              label={matchRowLabel(m, today, tomorrow)}
              value={matchMeta(m) || 'Saat yok'}
              onPress={() => router.push({ pathname: '/match-edit', params: { date: m.date } })}
            />
          ))}
          <ListRow label="Maç ekle" onPress={() => router.push('/match-edit')} />
        </ListGroup>
      ) : null}
      {trips ? (
        <ListGroup label="Seyahatler" footer={tripCalendarFooter}>
          {trips.length === 0 ? <ListRow label="Takvimde seyahat yok" /> : null}
          {trips.map((t) => (
            <ListRow
              key={t.id ?? t.departDate}
              label={tripRowLabel(t)}
              value={offsetLabel(t.offsetHours)}
              onPress={() => router.push({ pathname: '/trip-edit', params: { id: t.id ?? '' } })}
            />
          ))}
          <ListRow label="Seyahat ekle" onPress={() => router.push('/trip-edit')} />
        </ListGroup>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { marginHorizontal: layout.screenInset },
});
