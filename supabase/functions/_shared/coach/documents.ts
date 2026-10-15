// Modele giden belgeler (karar 0032): "günün sayıları" özel içerikli belge (her ölçüm ayrı blok, citations
// blok kimliğiyle döner) ve her kaynak özeti ayrı düz metin belge. Sayıların metni burada yazılır; denetçi
// (audit.ts) modelin cümlelerindeki sayıları bu bloklarla karşılaştırır.
//
// Sayılar uygulamadaki gösterimle aynı yuvarlanır (copy/recovery.ts formatDecimal, copy/training-load.ts):
// koçun cümlesi ekrandaki sayıyla çelişmesin. Eşikler ve pencere uzunlukları istemciden değil, kanıt tabanındaki
// kural değerlerinden (research/rules → kb-data.ts) okunur.

import type { Kb, KbRuleValue, KbSource } from './kb.ts';
import {
  presentMetrics,
  type BandMetric,
  type BodyRegion,
  type BodySide,
  type CoachSnapshot,
  type DayLevel,
  type DayType,
  type MatchBrief,
  type TravelContext,
  type TravelDirection,
  type TravelPhase,
  type MetricKey,
  type Range,
  type RecoverySignal,
  type Venue,
  type WellnessItem,
} from './snapshot.ts';

/** Günün sayıları belgesinde bir blok. `id` ölçüm anahtarı, dizilerde `regions.0` gibi. */
export interface NumbersBlock {
  id: string;
  metric: MetricKey | 'day' | 'travel';
  text: string;
  /** Tahmin olan değer (CLAUDE.md §3); denetçi bu bloğa dayanan cümlede "tahmin" sözünü arar. */
  estimate: boolean;
}

/** Messages API document bloğu (citations açık). Biçim: platform.claude.com/docs/en/build-with-claude/citations */
export type DocumentParam =
  | {
      type: 'document';
      source: { type: 'content'; content: { type: 'text'; text: string }[] };
      title: string;
      context?: string;
      citations: { enabled: true };
    }
  | {
      type: 'document';
      source: { type: 'text'; media_type: 'text/plain'; data: string };
      title: string;
      context?: string;
      citations: { enabled: true };
    };

/** document_index → belgenin ne olduğu. Denetçi alıntıları bununla çözer. */
export type DocumentEntry = { kind: 'numbers'; blocks: readonly NumbersBlock[] } | { kind: 'source'; sourceId: string };

export interface CoachDocuments {
  /** İstekteki sırayla; citations'taki document_index bu dizinin indisidir. */
  documents: DocumentParam[];
  layout: DocumentEntry[];
}

export const numbersTitle = 'Günün sayıları';

// --- Kural değerleri ---

export class MissingRuleValueError extends Error {
  constructor(ruleId: string, key: string) {
    super(`Kural değeri yok: ${ruleId}.${key}`);
    this.name = 'MissingRuleValueError';
  }
}

function ruleValue(kb: Kb, ruleId: string, key: string): KbRuleValue {
  const value = kb.rules.find((r) => r.id === ruleId)?.value;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new MissingRuleValueError(ruleId, key);
  const v = (value as { readonly [key: string]: KbRuleValue })[key];
  if (v === undefined) throw new MissingRuleValueError(ruleId, key);
  return v;
}

function ruleNumber(kb: Kb, ruleId: string, key: string): number {
  const v = ruleValue(kb, ruleId, key);
  if (typeof v !== 'number') throw new MissingRuleValueError(ruleId, key);
  return v;
}

function ruleString(kb: Kb, ruleId: string, key: string): string {
  const v = ruleValue(kb, ruleId, key);
  if (typeof v !== 'string') throw new MissingRuleValueError(ruleId, key);
  return v;
}

function ruleStrings(kb: Kb, ruleId: string, key: string): string[] {
  const v = ruleValue(kb, ruleId, key);
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) throw new MissingRuleValueError(ruleId, key);
  return v as string[];
}

function ruleRange(kb: Kb, ruleId: string, key: string): Range {
  const v = ruleValue(kb, ruleId, key);
  if (!Array.isArray(v) || v.length !== 2 || typeof v[0] !== 'number' || typeof v[1] !== 'number') {
    throw new MissingRuleValueError(ruleId, key);
  }
  return [v[0], v[1]];
}

// --- Biçim (uygulamadaki gösterimle aynı) ---

/** 6.25 → "6,3" (copy/recovery.ts formatDecimal). */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

/** Tam sayıysa ondalıksız, değilse tek ondalık: 2 → "2", 1.5 → "1,5". */
const dec = (n: number) => formatDecimal(n, Number.isInteger(n) ? 0 : 1);

/** Binlik ayırıcılı tam sayı: 8027 → "8.027" (copy/training-load.ts formatLoad). */
export function formatLoad(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 0,23 → "+%23" (copy/training-load.ts formatChange). */
function formatChange(change: number): string {
  const pct = Math.round(change * 100);
  return pct === 0 ? '%0' : `${pct > 0 ? '+' : '−'}%${Math.abs(pct)}`;
}

const signed = (n: number, digits = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatDecimal(Math.abs(n), digits)}`;
const signedDec = (n: number) => signed(n, Number.isInteger(n) ? 0 : 1);
const range = ([a, b]: Range, digits = 0) => `${formatDecimal(a, digits)}–${formatDecimal(b, digits)}`;
const decRange = ([a, b]: Range) => `${dec(a)}–${dec(b)}`;
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

/**
 * 6.4 saat → "6,4 saat (6 sa 24 dk)": model iki yazımdan birini kullanabilsin. Aşağı kesilir (uygulamadaki gibi):
 * 6,996 saat "7,0 saat" yazıp "7 saatin altında: kısa" denmesin.
 */
function hours(h: number): string {
  const total = Math.floor(h * 60 + 1e-9);
  return `${formatDecimal(Math.floor(h * 10 + 1e-9) / 10)} saat (${Math.floor(total / 60)} sa ${total % 60} dk)`;
}

// Uygulamadaki etiketlerle aynı (copy/labels.ts, copy/recovery.ts, copy/nutrition.ts); test denetler.
export const levelLabels: Record<DayLevel, string> = {
  ready: 'Hazır',
  caution: 'Kontrollü',
  recover: 'Toparlan',
  insufficient: 'Bant oluşuyor',
};
export const dayTypeLabels: Record<DayType, string> = { rest: 'Dinlenme', training: 'Antrenman', match: 'Maç çevresi', high: 'Yoğun' };
export const regionLabels: Record<BodyRegion, string> = {
  calf: 'Baldır',
  achilles: 'Aşil',
  ankle: 'Ayak bileği',
  patellar_tendon: 'Patellar tendon',
  quadriceps: 'Quadriceps',
  hamstring: 'Hamstring',
  adductor: 'Adduktor',
  hip: 'Kalça',
  lower_back: 'Bel',
  shoulder: 'Omuz',
};
export const sideLabels: Record<BodySide, string> = { left: 'Sol', right: 'Sağ', center: 'Orta' };
export const wellnessTitles: Record<WellnessItem, string> = {
  sleep_quality: 'Uyku kalitesi',
  fatigue: 'Yorgunluk',
  soreness: 'Kas ağrısı',
  stress: 'Stres',
  mood: 'Ruh hali',
};
const signalTexts: Record<RecoverySignal, string> = {
  hrv_low: 'HRV bandın altında',
  hrv_high: 'HRV bandın üstünde',
  rhr_high: 'uyku nabzı bandın üstünde',
  sleep_short: 'uyku kısa',
};
const positionTexts = { below: 'altında', within: 'içinde', above: 'üstünde' } as const;

// --- Bloklar ---

interface BandText {
  name: string;
  unit: string;
  digits: number;
  rollingDays: number;
  baselineDays: number;
  sd: number;
}

function bandSentence(m: BandMetric, t: BandText): string {
  const parts: string[] = [];
  parts.push(
    m.rolling === null
      ? `${t.name}: son ${t.rollingDays} günün ortalaması hesaplanamadı (yeterli gece yok)`
      : `${t.name}: son ${t.rollingDays} günün ortalaması ${formatDecimal(m.rolling, t.digits)} ${t.unit}`,
  );
  if (m.lastNight !== null) parts.push(`son gece ${formatDecimal(m.lastNight, t.digits)} ${t.unit}`);
  let text = `${parts.join('; ')}.`;
  if (m.band === null) {
    text += ' Kişisel bant henüz oluşmadı (yeterli gece yok).';
  } else {
    text += ` Kişisel bant (önceki ${t.baselineDays} günün ortalaması ± ${dec(t.sd)} SD): ${formatDecimal(m.band.low, t.digits)}–${formatDecimal(m.band.high, t.digits)} ${t.unit}`;
    text += m.position === null ? '.' : `; ortalama bandın ${positionTexts[m.position]}.`;
  }
  return text;
}

function blocksFor(snapshot: CoachSnapshot, key: MetricKey, kb: Kb): NumbersBlock[] {
  const block = (text: string, estimate = false, id: string = key): NumbersBlock => ({ id, metric: key, text, estimate });
  const band = (rule: string) => ({
    rollingDays: ruleNumber(kb, rule, 'rolling_days'),
    baselineDays: ruleNumber(kb, rule, 'baseline_days'),
    sd: ruleNumber(kb, rule, 'sd_multiplier'),
  });

  switch (key) {
    case 'status': {
      const s = snapshot.status!;
      const label = `Günün durumu: ${levelLabels[s.level]}.`;
      if (s.level === 'insufficient') return [block(`${label} Kişisel bant için henüz yeterli gece yok.`)];
      // Not işaretleri (uyku nabzı tek başına) durumu değiştirmez; "Toparlan"da HRV ile birlikte nedendir (karar 0041).
      const noteOnly = new Set(s.level === 'recover' ? [] : ruleStrings(kb, 'gunun-durumu', 'note_only'));
      const causes = s.signals.filter((x) => !noteOnly.has(x));
      const notes = s.signals.filter((x) => noteOnly.has(x));
      let text = causes.length === 0 ? `${label} Bandın dışında bir işaret yok.` : `${label} Nedeni: ${causes.map((x) => signalTexts[x]).join(', ')}.`;
      if (notes.length > 0) text += ` Not: ${notes.map((x) => signalTexts[x]).join(', ')}; tek başına durumu değiştirmez.`;
      return [block(text)];
    }
    case 'hrv':
      return [block(bandSentence(snapshot.hrv!, { name: 'HRV (derin uyku, RMSSD)', unit: 'ms', digits: 0, ...band('toparlanma-bant') }))];
    case 'rhr':
      return [block(bandSentence(snapshot.rhr!, { name: 'Uyku nabzı (REM dışı uyku ortalaması)', unit: 'atım/dk', digits: 0, ...band('toparlanma-bant') }))];
    case 'respiration': {
      const r = snapshot.respiration!;
      let text = bandSentence(r, { name: 'Gece solunum hızı', unit: 'nefes/dk', digits: 1, ...band('solunum-bant') });
      const rise = ruleNumber(kb, 'solunum-tek-gece', 'above_baseline_mean');
      const days = ruleNumber(kb, 'solunum-tek-gece', 'baseline_days');
      if (r.nightHigh === true) {
        text += ` Son gece, önceki ${days} günün ortalamasının ${dec(rise)} nefes/dk veya daha fazla üstünde. Bu bir tanı değil; ateş, öksürük veya halsizlik varsa doktora danışılır. Günün durumuna girmez.`;
      } else if (r.nightHigh === false) {
        text += ` Son gece, önceki ${days} günün ortalamasının ${dec(rise)} nefes/dk üstüne çıkmadı.`;
      }
      return [block(text)];
    }
    case 'signs': {
      // Gece işaretleri (karar 0039): tanı koymayan notlar. Model yorumlamaz; yönlendirmeyi uygulama sabit metinle yapar.
      const s = snapshot.signs!;
      const rhrRise = ruleNumber(kb, 'gece-nabzi-yuksek', 'above_baseline_median');
      const rhrNights = ruleNumber(kb, 'gece-nabzi-yuksek', 'consecutive_nights');
      const rhrDays = ruleNumber(kb, 'gece-nabzi-yuksek', 'baseline_days');
      const spo2Floor = ruleNumber(kb, 'gece-spo2-dusuk', 'below_pct');
      const spo2Drop = ruleNumber(kb, 'gece-spo2-dusuk', 'below_baseline_median');
      const spo2Need = ruleNumber(kb, 'gece-spo2-dusuk', 'nights_required');
      const spo2Window = ruleNumber(kb, 'gece-spo2-dusuk', 'nights_window');
      const skinRise = ruleNumber(kb, 'cilt-sicakligi-yuksek', 'above_baseline');
      const skinNights = ruleNumber(kb, 'cilt-sicakligi-yuksek', 'consecutive_nights');
      const flagged: string[] = [];
      if (s.rhrHigh === true) flagged.push(`son ${dec(rhrNights)} gece uyku nabzı önceki ${dec(rhrDays)} günün medyanının ${dec(rhrRise)} atım/dk veya daha fazla üstünde`);
      if (s.spo2Low === true) {
        flagged.push(`son ${dec(spo2Window)} gecenin en az ${dec(spo2Need)}'sinde gece SpO2 ortalaması %${dec(spo2Floor)}'in altında ya da kişisel medyanın ${dec(spo2Drop)} puan veya daha fazla altında`);
      }
      if (s.skinTempHigh === true) flagged.push(`son ${dec(skinNights)} gece cilt sıcaklığı kişisel tabanın ${dec(skinRise)} °C veya daha fazla üstünde`);
      if (flagged.length === 0) return [block('Gece işaretleri (tahmin, tanı değil; gece nabzı, SpO2, cilt sıcaklığı): not yok.', true)];
      return [
        block(
          `Gece işaretleri (tahmin, tanı değil): ${flagged.join('; ')}. Ateş ölçümü değil; hastalık başlangıcında da, ağır yük, stres, alkol, seyahat veya yükseklikte de görülebilir. Belirti varsa antrenmana çıkmadan doktora danışılır. Günün durumuna girmez.`,
          true,
        ),
      ];
    }
    case 'sleep': {
      const s = snapshot.sleep!;
      const nights = ruleNumber(kb, 'uyku-kisa', 'rolling_nights');
      const min = ruleNumber(kb, 'uyku-kisa', 'min_hours');
      let text =
        s.rollingHours === null
          ? `Uyku: son ${nights} gecenin ortalaması hesaplanamadı (yeterli gece yok).`
          : `Uyku: son ${nights} gecenin ortalaması ${hours(s.rollingHours)}.`;
      if (s.lastNightHours !== null) text += ` Son gece ${hours(s.lastNightHours)}.`;
      if (s.short === true) text += ` Ortalama ${dec(min)} saatin altında: uyku kısa.`;
      else if (s.short === false) text += ` Ortalama ${dec(min)} saatin altında değil.`;
      return [block(text)];
    }
    case 'checkin': {
      const c = snapshot.checkin!;
      const max = ruleNumber(kb, 'checkin-olcek', 'total_max');
      const days = ruleNumber(kb, 'checkin-kisisel', 'baseline_days');
      let text = `Sabah check-in toplamı: ${c.total} / ${max}.`;
      if (c.baselineMean === null || c.z === null) {
        text += ' Kişisel kıyas için henüz yeterli check-in yok.';
      } else {
        text += ` Önceki ${days} günün ortalaması ${formatDecimal(c.baselineMean)}; bugün ${signed(c.z)} SD.`;
        if (c.low) {
          const zMax = ruleNumber(kb, 'checkin-kisisel', 'z_note_max');
          text += ` Alıştığından belirgin düşük (${signedDec(zMax)} SD veya altı)`;
          text += c.topDrop ? `; en çok düşen madde: ${wellnessTitles[c.topDrop].toLocaleLowerCase('tr')}.` : '.';
        }
      }
      return [block(text)];
    }
    case 'load': {
      const l = snapshot.load!;
      const weekDays = ruleNumber(kb, 'yuk-haftalik', 'week_days');
      const avgWeeks = ruleNumber(kb, 'yuk-haftalik', 'average_weeks');
      const parts: string[] = [];
      if (l.week !== null) parts.push(`son ${weekDays} gün ${formatLoad(l.week)} AU`);
      if (l.previousWeek !== null) parts.push(`önceki ${weekDays} gün ${formatLoad(l.previousWeek)} AU`);
      let text = parts.length
        ? `Antrenman yükü (seans RPE × dakika): ${parts.join(', ')}`
        : 'Antrenman yükü (seans RPE × dakika): henüz hesaplanamadı';
      text += l.weekChange === null ? '.' : ` (${formatChange(l.weekChange)}).`;
      if (l.weeklyAverage !== null) text += ` Son ${avgWeeks} haftanın haftalık ortalaması ${formatLoad(l.weeklyAverage)} AU.`;
      if (l.monotony !== null) text += ` Monotonluk ${formatDecimal(l.monotony)}`;
      if (l.strain !== null) text += `${l.monotony !== null ? ',' : ' '} gerilim ${formatLoad(l.strain)} AU`;
      if (l.monotony !== null || l.strain !== null) text += ' (eşiksiz).';
      const blocks = [block(text)];

      const minDays = ruleNumber(kb, 'yuk-orani', 'min_history_days');
      if (l.ratio === null) {
        blocks.push(block(`Alıştığın seviyeye göre oran (tahmin): ${minDays} günlük kayıt geçmişi olmadan hesaplanmaz.`, true, 'load.ratio'));
      } else {
        let ratioText = `Alıştığın seviyeye göre oran (tahmin, yalnız bağlam, sakatlık tahmini değil): ${formatDecimal(l.ratio)}×.`;
        if (l.spike) {
          const ratioMin = ruleNumber(kb, 'yuk-artis-notu', 'ratio_min');
          ratioText += ` Oran ${formatDecimal(ratioMin)} veya üstünde: bu hafta yük alıştığın seviyenin belirgin üstünde.`;
        }
        blocks.push(block(ratioText, true, 'load.ratio'));
      }
      return blocks;
    }
    case 'regions':
      return snapshot.regions!.map((r, i) => {
        let text = `Bölge yükü (tahmin): ${regionLabels[r.region]}, son ${dec(r.windowHours)} saatte ${r.sessions} seans, ${formatLoad(r.load)} AU`;
        if (r.hoursSinceLoaded !== null) text += `; son yüklenmeden bu yana ${Math.round(r.hoursSinceLoaded)} saat`;
        if (r.typical !== null) text += `; olağan ${formatLoad(r.typical)} AU`;
        return block(`${text}.`, true, `regions.${i}`);
      });
    case 'pain': {
      const maxNrs = ruleNumber(kb, 'bolge-agri-izleme', 'max_nrs');
      return snapshot.pain!.map((p, i) => {
        const where = p.side === 'center' ? regionLabels[p.region] : `${sideLabels[p.side]} ${regionLabels[p.region].toLocaleLowerCase('tr')}`;
        let text = `Ağrı izleme (tahmin, tanı değil): ${where}, bu sabah ağrı ${p.pain}/10`;
        if (p.yesterdayPain !== null) text += ` (dün ${p.yesterdayPain}/10)`;
        const reasons = p.reasons.map((r) =>
          r === 'high' ? `sabah ağrısı ${dec(maxNrs)}/10'un üstünde` : 'bölge dün yüklendi ve ağrı bugün azalmadı',
        );
        if (reasons.length) text += `. ${capitalize(reasons.join('; '))}`;
        return block(`${text}.`, true, `pain.${i}`);
      });
    }
    case 'nutrition': {
      const n = snapshot.nutrition!;
      let text = `Beslenme hedefi (gün tipi: ${dayTypeLabels[n.dayType].toLocaleLowerCase('tr')}): karbonhidrat ${decRange(n.carbsPerKg)} g/kg`;
      if (n.carbsG) text += ` (${range(n.carbsG)} g)`;
      text += `, protein ${range(n.proteinPerKg, 1)} g/kg`;
      if (n.proteinG) text += ` (${range(n.proteinG)} g)`;
      text += n.carbsG || n.proteinG ? '.' : '. Sabah kilosu girilmediği için gram hedefi yok.';
      const blocks = [block(text)];

      if (n.meals === 0) {
        // Kayıt yokluğu bir tahmin değil, olgu: "tahmin" sözü istenmez.
        blocks.push(block('Bugün öğün kaydı yok.', false, 'nutrition.intake'));
      } else {
        let intake = `Bugün kayıtlı alım (tahmin; kayıt gerçek alımın altında kalabilir): ${n.meals} öğün`;
        if (n.intakeCarbsG !== null) intake += `, karbonhidrat ${Math.round(n.intakeCarbsG)} g`;
        if (n.intakeProteinG !== null) intake += `, protein ${Math.round(n.intakeProteinG)} g`;
        intake += '.';
        const pos: string[] = [];
        if (n.carbsPosition) pos.push(`karbonhidrat hedef aralığının ${positionTexts[n.carbsPosition]}`);
        if (n.proteinPosition) pos.push(`protein hedef aralığının ${positionTexts[n.proteinPosition]}`);
        if (pos.length) intake += ` Kayda göre ${pos.join(', ')}.`;
        blocks.push(block(intake, true, 'nutrition.intake'));
      }
      return blocks;
    }
    case 'fluid':
      return [block(`Bugün içilen sıvı: ${formatDecimal(snapshot.fluid!.totalL)} L (hedefsiz kayıt).`)];
    case 'sweatTest': {
      const s = snapshot.sweatTest!;
      // copy/nutrition.ts ile aynı: "−%2,1".
      const pct = `${s.changePercent > 0 ? '+' : s.changePercent < 0 ? '−' : ''}%${formatDecimal(Math.abs(s.changePercent))}`;
      let text = `Bugünkü ter testi: ter kaybı ${formatDecimal(s.lossL)} L, ter oranı ${formatDecimal(s.rateLPerH)} L/saat, seans boyunca kilo değişimi ${pct}.`;
      if (s.lossNote) text += ` Kayıp seans öncesi kilonun %${dec(ruleNumber(kb, 'kilo-kaybi-notu', 'loss_percent_min'))}'si veya üstünde.`;
      if (s.gainNote) text += ' Seansta kilo arttı: gerekenden fazla içilmiş olabilir.';
      if (s.fluidTargetL) {
        const below = ruleNumber(kb, 'sivi-hedefi', 'short_recovery_hours_below');
        text += ` Sonraki seansa ${dec(below)} saatten az varsa ${formatDecimal(s.fluidTargetL[0])}–${formatDecimal(s.fluidTargetL[1])} L sıvı.`;
      }
      return [block(text)];
    }
  }
}

const venueLabels: Record<Venue, string> = { home: 'iç saha', away: 'deplasman' };

function briefText(m: MatchBrief): string {
  return [m.startTime ? `başlama ${m.startTime}` : 'başlama saati girilmedi', m.venue ? venueLabels[m.venue] : null].filter(Boolean).join(', ');
}

/**
 * Maç çevresi (karar 0046): bugün, yarın, dün. Zamanlama ve gramlar uygulamanın motorundan; uyku kısalması
 * kanıt tabanındaki kural değerinden (mac-sonrasi), başlama saatine göre seçilir. Eşik değil, grup ortalaması.
 */
function matchDayText(snapshot: CoachSnapshot, kb: Kb): string {
  const m = snapshot.match;
  if (!m) return snapshot.matchDay ? 'Maç günü: bugün maç var.' : 'Maç günü: bugün maç işaretlenmedi.';
  const parts: string[] = [];
  if (m.today) {
    parts.push(`Maç günü: bugün maç var (${briefText(m.today)}).`);
    if (m.plan) {
      const p = m.plan;
      const carbs = p.mealCarbsG ? `, ${p.mealCarbsG[0]}–${p.mealCarbsG[1]} g karbonhidrat` : '';
      const ml = p.fluidMl ? ` ${p.fluidMl[0]}–${p.fluidMl[1]} mL` : '';
      parts.push(`Maç öncesi ana öğün ${p.meal[0]}–${p.meal[1]} arası${carbs}. Sıvı ${p.fluid[0]}–${p.fluid[1]} arası${ml}.`);
      if (p.nap) parts.push(`Şekerleme penceresi ${p.nap[0]}–${p.nap[1]}.`);
      if (p.postCarbsGPerHour !== null) {
        parts.push(`Maçtan sonra ${ruleNumber(kb, 'mac-sonrasi', 'post_carbs_hours')} saat, saatte ~${p.postCarbsGPerHour} g karbonhidrat.`);
      }
    }
  } else {
    parts.push('Maç günü: bugün maç yok.');
  }
  if (m.tomorrow) parts.push(`Yarın maç var (${briefText(m.tomorrow)}); bugün maçtan önceki gün.`);
  if (m.yesterday) {
    const start = m.yesterday.startTime;
    let sleep = '';
    if (start) {
      const night = start >= ruleString(kb, 'mac-sonrasi', 'night_start');
      const loss = ruleValue(kb, 'mac-sonrasi', 'sleep_shorter_min') as { readonly [k: string]: KbRuleValue };
      const minutes = night ? loss.night : loss.day;
      if (typeof minutes !== 'number') throw new MissingRuleValueError('mac-sonrasi', 'sleep_shorter_min');
      sleep = ` ${night ? 'Akşam' : 'Gündüz'} maçı gecesi için grup ortalaması uyku kısalması ~${minutes} dakika.`;
    }
    parts.push(`Dün maç vardı (${briefText(m.yesterday)}); bugün maçtan sonraki gün.${sleep}`);
  }
  return parts.join(' ');
}

const directionWords: Record<TravelDirection, string> = { east: 'doğu', west: 'batı' };

/**
 * Seyahat bloğu (karar 0047): evre, saat farkı, motorun uyum tahmini (gün; "Tahmin"). Uyum hızı kanıt tabanındaki
 * kural değerinden (jet-lag-uyum). Şehir ve tarih yok.
 */
function travelText(t: TravelContext, kb: Kb): string {
  const sign = t.offsetHours > 0 ? '+' : '−';
  const offset =
    t.offsetHours === 0
      ? 'saat farkı yok'
      : `saat farkı ${sign}${Math.abs(t.offsetHours)} saat (${directionWords[t.offsetHours > 0 ? 'east' : 'west']})`;
  const phase: Record<TravelPhase, string> = {
    before: t.daysUntil !== null ? `Seyahat ${t.daysUntil} gün sonra` : 'Seyahat yaklaşıyor',
    departure: 'Bugün gidiş yolculuğu',
    away: t.dayAway !== null ? `Seyahatin ${t.dayAway}. günü` : 'Seyahatte',
    return: 'Bugün dönüş yolculuğu',
    after: 'Dönüşten sonraki günler',
  };
  const parts = [`Seyahat: ${phase[t.phase]}, ${offset}.`];
  if (t.jetLag && t.direction) {
    const perDay = (ruleValue(kb, 'jet-lag-uyum', 'hours_per_day') as { readonly [k: string]: KbRuleValue })[t.direction];
    if (typeof perDay !== 'number') throw new MissingRuleValueError('jet-lag-uyum', 'hours_per_day');
    parts.push(`Jet lag bekleniyor; uyum yönü ${directionWords[t.direction]}, kaba kurala göre günde ~${perDay} saat.`);
    if (t.phase === 'before' && t.totalDays !== null) parts.push(`Tahmini uyum ~${t.totalDays} gün.`);
    else if (t.remainingDays !== null) parts.push(t.remainingDays === 0 ? 'Tahmini uyum tamamlandı.' : `Tahmini kalan uyum ~${t.remainingDays} gün.`);
    if (t.firstHours) parts.push(`Varıştan sonraki ilk ${ruleNumber(kb, 'jet-lag-varis', 'first_hours')} saat içinde.`);
    if (t.eastDelayHint) parts.push(`Doğuya ${ruleNumber(kb, 'jet-lag-uyum', 'east_delay_above_hours')} saatten fazla fark.`);
  }
  return parts.join(' ');
}

/** Günün sayıları: ilk blok maç günü ve çevresi, varsa seyahat, sonra bulunan her ölçüm sabit sırayla. */
export function numbersBlocks(snapshot: CoachSnapshot, kb: Kb): NumbersBlock[] {
  const day: NumbersBlock = { id: 'day', metric: 'day', text: matchDayText(snapshot, kb), estimate: false };
  const t = snapshot.travel;
  const travel: NumbersBlock[] = t ? [{ id: 'travel', metric: 'travel', text: travelText(t, kb), estimate: t.jetLag }] : [];
  return [day, ...travel, ...presentMetrics(snapshot).flatMap((key) => blocksFor(snapshot, key, kb))];
}

export function sourceDocument(source: KbSource): DocumentParam {
  const ids = [source.doi && `DOI ${source.doi}`, source.pmid && `PMID ${source.pmid}`].filter(Boolean).join(', ');
  return {
    type: 'document',
    source: { type: 'text', media_type: 'text/plain', data: source.summary },
    title: source.id,
    context: `${source.title} (${source.year}${source.journal ? `, ${source.journal}` : ''}). Tür: ${source.type}. Kimler: ${source.population}.${ids ? ` ${ids}.` : ''} Bu metin HoopLab'in kendi özetidir.`,
    citations: { enabled: true },
  };
}

/** "Günün sayıları" belgesi: her blok ayrı içerik bloğu (alıntı blok indisiyle döner). */
export function numbersDocument(blocks: readonly NumbersBlock[]): DocumentParam {
  return {
    type: 'document',
    source: { type: 'content', content: blocks.map((b) => ({ type: 'text', text: b.text })) },
    title: numbersTitle,
    context:
      "Sporcunun bugünkü değerleri; HoopLab'in hesap motoru hesapladı. Her blok ayrı bir ölçümdür. 'Tahmin' yazan değerler doğrulanmış ölçüm değildir.",
    citations: { enabled: true },
  };
}

/**
 * Günlük özetin belgeleri: önce günün sayıları (document_index 0), sonra kaynaklar verilen sırayla.
 * Kaynaklar selectForRules(kb, snapshotRuleIds(snapshot)) ile seçilir.
 */
export function dailyDocuments(snapshot: CoachSnapshot, kb: Kb, sources: readonly KbSource[]): CoachDocuments {
  const blocks = numbersBlocks(snapshot, kb);
  const documents: DocumentParam[] = [numbersDocument(blocks), ...sources.map(sourceDocument)];
  const layout: DocumentEntry[] = [{ kind: 'numbers', blocks }, ...sources.map((s) => ({ kind: 'source' as const, sourceId: s.id }))];
  return { documents, layout };
}
