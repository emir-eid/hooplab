import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { formatDayHeader } from '@/utils/format-date';

export default function TodayScreen() {
  return (
    <Screen>
      <PageHeader overline={formatDayHeader(new Date())} title="Bugün" />
      <ComingSoon
        title="Günün durumu"
        body="HRV, dinlenik nabız ve uykun kendi bandınla karşılaştırılıp burada özetlenecek. Önce Google Health bağlantısı kurulacak."
      />
    </Screen>
  );
}
