// Tarih biçimleri. Intl'in Türkçe çıktısı motor ve cihaza göre değişebildiği için adlar burada sabit.

const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;
const shortWeekdays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;
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

/** Yerel tarihin ("2026-10-04") kısa gün adı: "Paz". Biçim bozuksa boş metin. */
export function formatShortDay(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return shortWeekdays[date.getDay()] ?? '';
}

/** Yerel tarihin ("2026-10-03") gün ve ayı: "Cmt 3 Ekim". Biçim bozuksa boş metin. */
export function formatShortDate(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return `${shortWeekdays[date.getDay()] ?? ''} ${date.getDate()} ${months[date.getMonth()] ?? ''}`;
}
