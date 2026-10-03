// Tarih biçimleri. Intl'in Türkçe çıktısı motor ve cihaza göre değişebildiği için adlar burada sabit.

const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;
const months = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

/** Ekran başlığının üstündeki tarih: "Cuma, 16 Ekim" (cihazın yerel saatine göre). */
export function formatDayHeader(date: Date): string {
  return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}
