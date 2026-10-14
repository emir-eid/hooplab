// Toparlanma yöntemi ve kaynakları (karar 0021, 0028): Bugün'deki durumun nasıl hesaplandığı, sayılar motor sabitlerinden.

import { recoveryBand, recoveryMinValues, respirationNightRule, shortSleep } from '@hooplab/engine';

import { GroupFooter, GroupLabel, ListGroup, ListRow } from '@/components/list';
import { Card } from '@/components/card';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { recoverySources } from '@/copy/recovery-sources';

const sd = String(recoveryBand.sdMultiplier).replace('.', ',');

export default function RecoveryMethodScreen() {
  return (
    <Screen>
      <PageHeader title="Nasıl hesaplanıyor?" backLabel="Bugün" />

      <GroupLabel>Ne izleniyor</GroupLabel>
      <Card>
        <Text variant="bodyCompact">
          Gece derin uykudaki HRV (RMSSD), aynı gecenin uyku nabzı (REM dışı uykudaki ortalama) ve uyku süresi. Bütün
          gecenin HRV'si uyku evrelerinden etkilendiği için derin uyku değeri izlenir. Fitbit uygulamasındaki dinlenik nabız
          bütün gün verisinden hesaplanır ve yöntemi belgelenmemiş; burada kullanılmaz. İki sayı da Fitbit uygulamasındakinden
          farklı olabilir.
        </Text>
      </Card>

      <GroupLabel>Kişisel bant</GroupLabel>
      <Card>
        <Text variant="bodyCompact">
          {`Son ${recoveryBand.rollingDays} günün ortalaması, ondan önceki ${recoveryBand.baselineDays / 7} haftanın ortalaması ± ${sd} standart sapmayla karşılaştırılır. Tek gece gürültülüdür; durum ortalamadan çıkar.`}
        </Text>
        <Text variant="bodyCompact">
          {`Ortalama için son ${recoveryBand.rollingDays} günde en az ${recoveryMinValues.rolling}, bant için en az ${recoveryMinValues.baseline} gece gerekir. Daha azsa sonuç gösterilmez.`}
        </Text>
      </Card>

      <GroupLabel>Solunum</GroupLabel>
      <Card>
        <Text variant="bodyCompact">
          {`Gece solunumu aynı bantla okunur ama günün durumuna girmez. Son gece önceki ${recoveryBand.baselineDays / 7} haftanın ortalamasından ${respirationNightRule.aboveBaselineMean} nefes/dk veya daha fazla yüksekse ayrı bir not çıkar; not tanı değildir.`}
        </Text>
      </Card>

      <GroupLabel>Günün durumu</GroupLabel>
      <Card>
        <Text variant="bodyCompact">Toparlan: HRV bandın altında ve uyku nabzı bandın üstünde.</Text>
        <Text variant="bodyCompact">
          {`Kontrollü: HRV bandın dışında (iki yönde) ya da son ${shortSleep.rollingNights} gecenin uyku ortalaması ${shortSleep.minHours} saatin altında.`}
        </Text>
        <Text variant="bodyCompact">Hazır: bunların hiçbiri yok.</Text>
        <Text variant="bodyCompact">
          Uyku nabzı tek başına bandın üstündeyse durum değişmez, not olarak gösterilir: nabzın yüklenmedeki değişimi küçük
          ve günlük oynama içinde kalabiliyor; belirgin yükselişi daha çok alkol ya da hastalıkla geliyor.
        </Text>
      </Card>
      <GroupFooter>
        Çalışmalarda test edilen kural yalnız HRV'dir: bant içinde planlanan yoğunluk, dışında düşük yoğunluk. Nabız ve
        uykuyla birleşim HoopLab'in seçimidir; doğrulanmış bir hazır olma skoru değildir. Kaynaklar çoğunlukla dayanıklılık
        sporcularından ve sabah ölçümünden; basketbola ve gece bileklik ölçümüne aktarım bir varsayımdır.
      </GroupFooter>

      <ListGroup label="Kaynaklar">
        {recoverySources.map((s) => (
          <ListRow key={s.id} label={s.cite} detail={`${s.kind} · ${s.use}`} />
        ))}
      </ListGroup>
    </Screen>
  );
}
