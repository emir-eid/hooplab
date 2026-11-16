// Rıza ekranı metni (karar 0061 sıra 6). Metin değişirse consentVersion da değişir; kayıtlı sürüm hangi metnin
// onaylandığını gösterir. Gizlilik politikası (hooplab.dev) aynı bilgiyi daha ayrıntılı verir; ikisi birlikte güncellenir.

export const consentVersion = '2026-11-16';

export const privacyUrl = 'https://hooplab.dev/tr/gizlilik/';

export interface ConsentSection {
  title: string;
  body: string;
}

export const consentCopy = {
  title: 'Başlamadan önce',
  subtitle: 'HoopLab sağlık verini işler. Neyin nereye gittiğini okuyup onaylaman gerekiyor.',
  sections: [
    {
      title: 'Ne saklanır',
      body:
        "Apple Sağlık'tan okunan günlük özetler (uyku, nabız, HRV, enerji, adım, antrenmanlar), uygulamaya kendi girdiklerin (check-in, ağrı, öğün, su, kilo) ve profil yanıtların. Döngü takibini açarsan yalnız döngü günü ve evre saklanır; adet kayıtları telefondan çıkmaz.",
    },
    {
      title: 'Nerede durur',
      body:
        "Veriler Supabase'te, Frankfurt'taki (AB) sunucuda saklanır. Hesabın yalnız kendi verini görür; başka bir kullanıcı senin verini göremez.",
    },
    {
      title: 'Uygulamanın sahibi',
      body:
        'HoopLab bir kişinin kendisi için yaptığı özel bir uygulama ve sen davetlisin. Veritabanını o yönetir; bu yüzden verilerini teknik olarak görebilir. Verini başkasıyla paylaşmaz, satmaz, reklamda kullanmaz.',
    },
    {
      title: 'AI koç',
      body:
        'Koçu kullanırsan uygulamanın hesapladığı sayılar (ör. "uyku nabzı olağan aralığının üstünde") Anthropic\'e (Claude API) gider. Adın, e-postan ve ham kayıtların gitmez. Koçu kullanmazsan hiçbir şey gitmez.',
    },
    {
      title: 'Silme',
      body:
        'Hesabının ve tüm verinin silinmesini istediğinde uygulamanın sahibine yazman yeterli. Hesap silinince bütün satırların da silinir. Apple Sağlık iznini istediğin zaman iPhone Ayarlar → Sağlık → Veri Erişimi bölümünden kapatabilirsin.',
    },
    {
      title: 'Tıbbi değil',
      body:
        'HoopLab tıbbi bir cihaz değildir, teşhis koymaz. Değerler kişisel ortalamana göre yorumlanır; bazıları tahmindir ve öyle işaretlenir. Göğüs ağrısı, çarpıntı ya da olağandışı bir belirtide doktora başvur.',
    },
  ] satisfies ConsentSection[],
  privacyLink: 'Gizlilik politikasının tamamı',
  accept: 'Okudum, onaylıyorum',
  decline: 'Onaylamıyorum, çıkış yap',
  declineNote: 'Onaylamazsan hiçbir veri okunmaz ya da gönderilmez ve oturumun kapanır.',
} as const;
