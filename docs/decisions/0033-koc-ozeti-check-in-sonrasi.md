# 0033. Koçun günlük özeti check-in'den sonra yazılır; kart cümleleri konularına göre gruplar

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-09
- **İlgili:** [0032](0032-ai-koc-tasarimi.md) (veri akışı ve biçim maddelerini ayrıntılandırır), [0017](0017-sabah-check-in-olcegi.md), [0022](0022-demo-modu.md)

## Bağlam
0032 "günlük özet günün ilk açılışında yazılır" diyordu. Sabah check-in genellikle ilk açılıştan sonra yapılır; özet ondan önce yazılırsa his ve ağrı haritası özete girmez, güncellemek de günlük 3 denemenin birini harcar.

0032'ye göre özetin biçimi (kaç cümle, hangi sıra) yönergeye kalıyordu, çünkü citations yapılandırılmış çıktıyla birlikte kullanılamıyor. İlk gerçek özet (2026-10-09) 8 uzun cümlelik tek bir paragraf olarak geldi. Kullanıcının yorumu: okuması zor ve üşendirici.

## Seçenekler
1. **İlk açılışta hemen yaz** (0032): basit; ama check-in'siz özet ya eksik kalır ya da bir deneme hakkına mal olur.
2. **Check-in'i bekle:** önce yalnız saklanan özete bakılır (`?peek=1`, model çağrılmaz). Check-in yoksa kart bekler ve "Check-in'siz yaz" düğmesi sunar; check-in yapılınca özet kendiliğinden yazılır.

Biçim için:
1. **Yönergeyle başlık istemek:** modele bağlı; denetçi başlığı "alıntısız cümle" sayabilir.
2. **Kartın gruplaması:** her cümlenin alıntıladığı günün sayıları bloğu zaten biliniyor. Kart cümleleri konuya göre (toparlanma, yük ve vücut, beslenme ve sıvı) kendisi gruplar; günün durumu cümlesi öne çıkar, her cümle ayrı satırda durur.

## Karar
**Check-in beklenir** (kullanıcı kararı, 2026-10-09) ve **biçimi kart kurar.** Yalnız kaynağa alıntı yapan cümle (yorum, öneri) önündeki cümlenin konusunda kalır; konular sabit sırayla gelir. Yönerge kısa cümle ister: 5-7 cümle, her biri en fazla 22 kelime, parantez içinde açıklama yok. Bu kural denetçide değil yönergede durur.

Özet gösterilemeyince (ret, hata) kart bunu söyler ve Bugün'deki "i" düğmelerine yönlendirir. Değerlerin açıklamalarını ayrıca listelemek ekranda çok yer kaplıyordu ve her kartın kendi açıklama düğmesini tekrarlıyordu.

## Sonuçlar
- Check-in yapılmayan günde özet ancak elle yazdırılır.
- Düzen modelin keyfine bağlı değil; yeni bir ölçüm eklenince `copy/coach.ts`'teki konu eşlemesine de eklenir (tip denetimi zorlar).
- **Yeniden değerlendirme:** kullanıcı check-in'i sık atlıyorsa ya da sabah özet geç kalıyor diyorsa; gruplanmış özet yine zor okunursa (o zaman cümle sınırı denetçiye taşınır).
