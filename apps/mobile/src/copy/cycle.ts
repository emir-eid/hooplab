// Döngü notu metinleri (karar 0061 sıra 5; rules/dongu.json). Not yalnız açıklamadır: durum, aralık ve öneri
// değişmez, döngüye göre antrenman önerilmez (dongu-notu). Düzensiz döngüde yorum yapılmaz, hekime yönlendirilir
// (dongu-duzensiz). Evre takvim sayımıyla tahmindir.

import { cycleIrregularRule, type CycleNote, type RecoverySignal } from '@hooplab/engine';

const signalText: Partial<Record<RecoverySignal, string>> = {
  hrv_low: "HRV'nin aralığının altına inmesi",
  rhr_high: 'uyku nabzının aralığının üstüne çıkması',
};

export const cycleNoteTitle = 'Döngü notu';

/** Adet öncesi evredeyken işarete düşen not; korunmada daha zayıf dil. */
export function cycleNoteText(note: CycleNote): string {
  if (note.kind === 'irregular') {
    return `Döngü kayıtlarında ${cycleIrregularRule.cycleDaysAbove} günü aşan bir döngü ya da Sağlık uygulamasının döngü sapması uyarısı var. Kayıt eksik değilse bir hekime danışmanı öneririz; HoopLab bu konuda yorum yapmaz.`;
  }
  const parts = note.signals.map((s) => signalText[s]).filter((t): t is string => t !== undefined);
  const what = parts.length > 1 ? `${parts[0]} ve ${parts[1]}` : (parts[0] ?? 'Bu işaret');
  const subject = what.charAt(0).toLocaleUpperCase('tr') + what.slice(1);
  const strength = note.weak
    ? 'hormonal korunma kullanırken bu etki genelde daha az belirgindir'
    : 'birçok kadında adetten önceki günlerde görülen küçük bir değişimdir';
  return `Adet öncesi günlerdesin (tahmin). ${subject} döngüyle uyumlu olabilir; ${strength}. Durum ve aralığın değişmez, başka bir sebebi de dışlamaz.`;
}
