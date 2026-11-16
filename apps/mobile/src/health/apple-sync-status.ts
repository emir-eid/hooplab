// Ben ekranındaki Apple Sağlık satırının metni (karar 0061 sıra 3d). Saf; testte sabit saatle denetlenir.

import type { AppleSyncState } from './apple-sync.ts';

export interface AppleSyncSummary {
  value: string;
  detail: string;
}

function time(iso: string, now: Date): string {
  const d = new Date(iso);
  const hhmm = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? hhmm : `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${hhmm}`;
}

export function describeAppleSync(state: AppleSyncState, running: boolean, now: Date): AppleSyncSummary {
  if (running) return { value: 'Eşitleniyor', detail: 'İlk eşitleme son üç ayı yükler, birkaç dakika sürebilir.' };
  if (state.lastError) {
    return {
      value: 'Eşitlenemedi',
      detail: state.lastSuccessAt
        ? `Son başarılı eşitleme ${time(state.lastSuccessAt, now)}. Dokun, yeniden dene.`
        : 'Dokun, yeniden dene. İzinleri Ayarlar > Sağlık > Veri Erişimi > HoopLab altında açabilirsin.',
    };
  }
  if (state.cursor) return { value: 'Yarım kaldı', detail: 'Uygulama açıkken kaldığı yerden sürer. Dokun, şimdi sürdür.' };
  if (state.lastSuccessAt) return { value: time(state.lastSuccessAt, now), detail: 'Saat yeni veri eşitledikçe kendiliğinden güncellenir.' };
  return { value: 'Henüz eşitlenmedi', detail: 'Dokun, izin ver ve eşitle.' };
}
