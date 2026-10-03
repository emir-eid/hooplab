import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';

export default function CoachScreen() {
  return (
    <Screen>
      <PageHeader title="Koç" />
      <ComingSoon
        title="Kaynaklı yorumlar"
        body="Hesaplanan değerlerini bilimsel kaynaklarla yorumlayan koç burada olacak. Kaynağı olmayan bir iddiada bulunmaz."
      />
    </Screen>
  );
}
