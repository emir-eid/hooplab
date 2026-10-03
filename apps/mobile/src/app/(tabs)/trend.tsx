import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';

export default function TrendScreen() {
  return (
    <Screen>
      <PageHeader title="Trend" />
      <ComingSoon
        title="Haftalar boyunca"
        body="Antrenman yükü, uyku ve toparlanma eğrileri hesap motoruyla birlikte burada olacak."
      />
    </Screen>
  );
}
