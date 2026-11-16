// Koç istemlerinin profile göre uyarlanması (karar 0061 sıra 4). Sahibinin (basketbol) tabanında istem bayt bayt
// aynı döner; fitness tabanında basketbol ve maç cümleleri çıkar, günün durumu temkinli dille anlatılır
// (gunun-durumu-dil-fitness). Değiştirilecek metin istemde yoksa modül yüklenirken değil, ilk çağrıda hata verir;
// testler her istemi fitness için bir kez kurar.

import { hasRule, isFitnessKb, type Kb } from './kb.ts';
import type { CoachSnapshot } from './snapshot.ts';

const ownerIdentity = 'Kullanıcı profesyonel bir basketbolcu; uygulamayı yalnız kendisi kullanıyor.';
const fitnessIdentity = 'Kullanıcı düzenli antrenman yapan bir yetişkin (fitness); profesyonel sporcu değil, maç takvimi yok.';

const replacements: readonly (readonly [string, string])[] = [
  [ownerIdentity, fitnessIdentity],
  ['profesyonel bir basketbolcunun', 'düzenli antrenman yapan bir yetişkinin'],
  ['ısınma, maç hazırlığı, beslenme', 'ısınma, beslenme'],
  [
    'Okuyan sporcunun kendisi ya da onun kondisyoneri, fizyoterapisti veya diyetisyeni olabilir.',
    'Okuyan kullanıcının kendisi ya da antrenörü, fizyoterapisti veya diyetisyeni olabilir.',
  ],
];

/** Fitness'ta istemden çıkan satırlar (maç günü ve maç çevresi yönergeleri). */
const droppedLinePrefixes = ['- Maç günüyse', '- Yarın maç varsa'];

/** Günün durumunu anlatan istemlere fitness'ta eklenen satır; "Teşhis koyma" satırından hemen sonra. */
const statusToneLine =
  '- Günün durumunu bir antrenman talimatı gibi sunma; yoğunluğu kendini nasıl hissettiğine göre ayarlamayı öner, kaynaklı.';

export interface FitnessPromptOptions {
  /** İstem günün durumunu anlatıyor mu (günlük ve haftalık özet)? */
  statusTone?: boolean;
  /** İstem günlük anlık değerleri (döngü bloğu dahil) yorumluyor mu (günlük özet)? */
  cycle?: boolean;
}

/**
 * Döngü takibi açık profilde günlük özet istemine eklenen satır (karar 0061 sıra 5; dongu-notu, dongu-duzensiz),
 * "Teşhis koyma" satırından hemen sonra. Sahibinin tabanında döngü kuralı yok: istem değişmez.
 */
export const cycleLine =
  '- Belgede döngü bloğu varsa: döngüyle uyumlu olabilir notunu en fazla bir cümleyle, "tahmin" diyerek ve kaynaklı aktar; durumu, bandı ya da öneriyi döngüye göre değiştirme, döngüye göre antrenman, beslenme veya takviye önerme. Döngü düzensizse döngü hakkında yorum yapma, sebep söyleme; yalnız kayıt eksik değilse hekime danışmasını söyle.';

function insertAfterDiagnosis(prompt: string, line: string): string {
  const lines = prompt.split('\n');
  const at = lines.findIndex((l) => l.startsWith('- Teşhis koyma'));
  if (at < 0) throw new Error('döngü istemi: satırın yeri bulunamadı');
  return [...lines.slice(0, at + 1), line, ...lines.slice(at + 1)].join('\n');
}

/** Fitness sürümü; her istemde en az kimlik cümlesi ya da uygulama tanımı değişmeli. */
export function fitnessPrompt(prompt: string, options: FitnessPromptOptions = {}): string {
  let out = prompt;
  let replaced = 0;
  for (const [from, to] of replacements) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
      replaced++;
    }
  }
  if (replaced === 0) throw new Error('fitness istemi: kullanıcı tanımı bulunamadı');
  let lines = out.split('\n').filter((line) => !droppedLinePrefixes.some((p) => line.startsWith(p)));
  if (options.statusTone) {
    const at = lines.findIndex((line) => line.startsWith('- Teşhis koyma'));
    if (at < 0) throw new Error('fitness istemi: durum satırının yeri bulunamadı');
    lines = [...lines.slice(0, at + 1), statusToneLine, ...lines.slice(at + 1)];
  }
  return lines.join('\n');
}

/** Tabana göre istem: sahibinde (ve fitness olmayan her profilde) verilen istem değişmeden döner. */
export function promptForKb(prompt: string, kb: Kb, options: FitnessPromptOptions = {}): string {
  const base = isFitnessKb(kb) ? fitnessPrompt(prompt, options) : prompt;
  return options.cycle && hasRule(kb, 'dongu-notu') ? insertAfterDiagnosis(base, cycleLine) : base;
}

/**
 * Anlık değerleri profile uydurur: maç kuralları tabanda yoksa (fitness) maç işareti ve maç çevresi, yük artış notu
 * kapalıysa not düşer. Uygulama zaten göndermez; eski bir sürüm gönderirse koç olmayan kurala takılıp hata vermesin.
 * Sahibinde aynı nesne döner.
 */
export function snapshotForKb(snapshot: CoachSnapshot, kb: Kb): CoachSnapshot {
  let out = snapshot;
  if (!hasRule(kb, 'mac-gunu') && (snapshot.matchDay || snapshot.match !== undefined)) {
    const { match: _match, ...rest } = out;
    out = { ...rest, matchDay: false };
  }
  if (!hasRule(kb, 'yuk-artis-notu') && out.load?.spike) out = { ...out, load: { ...out.load, spike: false } };
  // Döngü notu yalnız döngü kuralları tabanda varken (Apple · kadın); sahibinde ve diğer profillerde düşer.
  if (out.cycle !== undefined && !hasRule(kb, out.cycle.note === 'irregular' ? 'dongu-duzensiz' : 'dongu-notu')) {
    const { cycle: _cycle, ...rest } = out;
    out = rest;
  }
  return out;
}
