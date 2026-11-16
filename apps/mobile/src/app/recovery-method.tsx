// Toparlanma yöntemi ve kaynakları (karar 0021, 0028): Bugün'deki durumun nasıl hesaplandığı, sayılar motor sabitlerinden.

import { cycleIrregularRule, cyclePhaseRule, recoveryBand, recoveryMinValues, respirationNightRule, shortSleep } from '@hooplab/engine';

import { GroupFooter, GroupLabel, ListGroup, ListRow } from '@/components/list';
import { Card } from '@/components/card';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { cycleSources, recoverySources, recoverySourcesApple, recoverySourcesAppleFitness, recoverySourcesFitness } from '@/copy/recovery-sources';
import { useProfile } from '@/data/profile';

const sd = String(recoveryBand.sdMultiplier).replace('.', ',');

export default function RecoveryMethodScreen() {
  // Apple Health profilinde ölçüler ve günün durumunun dayanağı farklı (karar 0061); sahibinin ekranı değişmez.
  const profile = useProfile();
  const apple = profile.dataSource === 'apple_health';
  const fitness = profile.sport === 'fitness';
  // Döngü (karar 0061 sıra 5): yalnız Apple · kadın · döngü takibi açık profilde.
  const cycle = apple && profile.sex === 'kadin' && profile.cycleTracking;
  const pm = cyclePhaseRule.premenstrualDaysBeforeNext;
  const len = cyclePhaseRule.regularCycleDays;
  const list = apple ? (fitness ? recoverySourcesAppleFitness : recoverySourcesApple) : fitness ? recoverySourcesFitness : recoverySources;
  return (
    <Screen>
      <PageHeader title="Nasıl hesaplanıyor?" backLabel="Bugün" />

      <GroupLabel>Ne izleniyor</GroupLabel>
      <Card>
        {apple ? (
          <Text variant="bodyCompact">
            Uyku sırasındaki nabzın ortalaması, saatin uykuda aldığı HRV ölçümlerinin (SDNN) gecelik ortalaması ve uyku
            süresi. Apple Watch HRV'yi fırsat buldukça kısa kayıtlarla ölçer; uykuya özel bir değeri yok. Bu yüzden HRV
            tahmin olarak gösterilir ve başka cihazların RMSSD değeriyle karşılaştırılmaz.
          </Text>
        ) : (
          <Text variant="bodyCompact">
            Gece derin uykudaki HRV (RMSSD), aynı gecenin uyku nabzı (REM dışı uykudaki ortalama) ve uyku süresi. Bütün
            gecenin HRV'si uyku evrelerinden etkilendiği için derin uyku değeri izlenir. Fitbit uygulamasındaki dinlenik nabız
            bütün gün verisinden hesaplanır ve yöntemi belgelenmemiş; burada kullanılmaz. İki sayı da Fitbit uygulamasındakinden
            farklı olabilir.
          </Text>
        )}
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
      {apple ? (
        <>
          <Card>
            <Text variant="bodyCompact">Toparlan: HRV bandın altında ve uyku nabzı bandın üstünde.</Text>
            <Text variant="bodyCompact">
              {`Kontrollü: uyku nabzı bandın üstünde ya da son ${shortSleep.rollingNights} gecenin uyku ortalaması ${shortSleep.minHours} saatin altında.`}
            </Text>
            <Text variant="bodyCompact">Hazır: bunların hiçbiri yok.</Text>
            <Text variant="bodyCompact">
              HRV tek başına bandın dışındaysa durum değişmez, not olarak gösterilir: Apple Watch'ın HRV ölçümünde kişiye
              göre hata büyük, nabız ölçümü ise EKG'ye yakın. Bu yüzden durumun dayanağı uyku nabzıdır; uyku nabzının bandı
              yoksa durum hesaplanmaz.
            </Text>
          </Card>
          <GroupFooter>
            Bant içinde planlanan yoğunluk, dışında düşük yoğunluk kuralı HRV ile denendi; ölçüm hatası bandın genişliği
            kadar olabileceği için Apple Watch'ta uygulanmaz. Nabız, HRV ve uykunun birleşimi HoopLab'in seçimidir;
            doğrulanmış bir hazır olma skoru değildir. Bant yöntemi RMSSD çalışmalarından gelir; SDNN'ye ve bütün uyku
            nabzına aktarımı bir varsayımdır.
          </GroupFooter>
        </>
      ) : (
        <>
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
        {`Çalışmalarda test edilen kural yalnız HRV'dir: bant içinde planlanan yoğunluk, dışında düşük yoğunluk. Nabız ve uykuyla birleşim HoopLab'in seçimidir; doğrulanmış bir hazır olma skoru değildir. Kaynaklar çoğunlukla dayanıklılık sporcularından ve sabah ölçümünden; ${fitness ? 'düzenli antrenman yapan yetişkine' : 'basketbola'} ve gece bileklik ölçümüne aktarım bir varsayımdır.`}
      </GroupFooter>
        </>
      )}
      {fitness ? (
        <GroupFooter>
          Bu profilde günün durumu bir antrenman talimatı değil, izleme özetidir: HRV'ye göre yönlendirilen antrenman
          düzenli antrenman yapan sağlıklı kişilerde önceden planlanmış antrenmandan üstün bulunmadı. Öneriler bu yüzden
          temkinli; kendini nasıl hissettiğine göre ayarla.
        </GroupFooter>
      ) : null}

      {cycle ? (
        <>
          <GroupLabel>Döngü</GroupLabel>
          <Card>
            <Text variant="bodyCompact">
              {`Telefon, Sağlık'taki adet kayıtlarından döngü gününü sayar; buluta yalnız gün ve kaba evre gider, adet kaydının kendisi gitmez. Evre takvimle tahmin edilir: ilk ${cyclePhaseRule.menstrualDays.to} gün adet, beklenen adetten önceki ${pm.to - pm.from + 1} gün adet öncesi. Beklenen gün son ${cyclePhaseRule.historyCycles} döngünün ortancasından bulunur; en az ${cyclePhaseRule.minCyclesForBackwardCount} tam döngü ve ${len.min}-${len.max} günlük döngüler gerekir.`}
            </Text>
            <Text variant="bodyCompact">
              Adet öncesinde HRV aralığının altında ya da uyku nabzı üstündeyse not düşülür: bu küçük değişim birçok kadında
              görülür ve döngüyle uyumlu olabilir. Durum ve aralık değişmez. Evreye göre performans farkı önemsiz bulunduğu için
              döngüye göre antrenman önerisi yapılmaz.
            </Text>
            <Text variant="bodyCompact">
              {`${cycleIrregularRule.cycleDaysAbove} günü aşan bir döngü ya da Sağlık'ın döngü sapması uyarısı varsa evre hesaplanmaz; yalnız hekime danışma notu gösterilir.`}
            </Text>
          </Card>
        </>
      ) : null}

      <ListGroup label="Kaynaklar">
        {list.map((s) => (
          <ListRow key={s.id} label={s.cite} detail={`${s.kind} · ${s.use}`} />
        ))}
      </ListGroup>
      {cycle ? (
        <ListGroup label="Döngü kaynakları">
          {cycleSources.map((s) => (
            <ListRow key={s.id} label={s.cite} detail={`${s.kind} · ${s.use}`} />
          ))}
        </ListGroup>
      ) : null}
    </Screen>
  );
}
