// Gece işaretleri (karar 0039): sentetik serilerle (gerçek ölçüm yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addIsoDays,
  flaggedSigns,
  nightRhrRule,
  nightSpo2Rule,
  readIllnessSigns,
  readNightRhr,
  readNightSpo2,
  readSkinTemp,
  skinTempRule,
  type DayValue,
  type SkinTempValue,
} from '../src/index.ts';

const today = '2026-10-31';

/** Gün indeksi 0 = bugün; `values[0]` en eski. */
function series(values: readonly (number | null)[], last = today): DayValue[] {
  return values.map((value, i) => ({ date: addIsoDays(last, -(values.length - 1 - i)), value }));
}

const flat = (n: number, v: number) => Array.from({ length: n }, () => v);

test('gece nabzı: iki gece üst üste medyanın 4 üstü → not; biri 3 üstü → not yok', () => {
  const base = flat(28, 46);
  assert.equal(readNightRhr(series([...base, 50, 50]), today).flagged, true);
  assert.equal(readNightRhr(series([...base, 50, 49]), today).flagged, false);
  assert.equal(readNightRhr(series([...base, 46, 52]), today).flagged, false);
  const r = readNightRhr(series([...base, 51, 52]), today);
  assert.equal(r.baselineMedian, 46);
  assert.equal(r.baselineN, 28);
  assert.deepEqual(r.nights.map((n) => n.value), [51, 52]);
});

test('gece nabzı: taban medyan, değerlendirilen geceler tabana girmez, 28 günden eski gece sayılmaz', () => {
  // Medyan uç değerden etkilenmez: tek bir 70'lik gece tabanı kaydırmaz.
  const base = [...flat(27, 46), 70];
  assert.equal(readNightRhr(series([...base, 50, 50]), today).baselineMedian, 46);
  // 28 günden eski yüksek geceler tabana girmez.
  const old = series([...flat(10, 60), ...flat(28, 46), 50, 50]);
  assert.equal(readNightRhr(old, today).baselineMedian, 46);
});

test('gece nabzı: yakın tarihli ardışık iki gece ya da 7 gecelik taban yoksa hesaplanmaz', () => {
  const base = flat(28, 46);
  // Son gece önceki gün değil (araya eksik gece girdi).
  assert.equal(readNightRhr(series([...base, 50, null, 50]), today).flagged, null);
  // En yeni gece iki gün önce: "son gece" sayılmaz.
  assert.equal(readNightRhr(series([...base, 50, 50], addIsoDays(today, -2)), today).flagged, null);
  // Dünün gecesiyle biten çift sayılır (bugünün değeri henüz gelmemiş olabilir).
  assert.equal(readNightRhr(series([...base, 50, 50], addIsoDays(today, -1)), today).flagged, true);
  const thin = readNightRhr(series([...flat(nightRhrRule.minBaselineNights - 1, 46), 50, 50]), today);
  assert.equal(thin.flagged, null);
  assert.equal(thin.baselineN, nightRhrRule.minBaselineNights - 1);
  assert.equal(readNightRhr(series([...flat(nightRhrRule.minBaselineNights, 46), 50, 50]), today).flagged, true);
});

test('SpO2: son 3 gecenin 2si mutlak sınırın altında → not; tek gece → not yok', () => {
  const base = flat(28, 96);
  const two = readNightSpo2(series([...base, 93, 96, 92.9]), today);
  assert.equal(two.flagged, true);
  assert.deepEqual(two.reasons, ['below_floor', 'below_baseline']);
  assert.equal(readNightSpo2(series([...base, 96, 96, 92]), today).flagged, false);
  // Tam sınır (93,5) altı sayılmaz.
  const atFloor = readNightSpo2(series([...flat(28, 95), nightSpo2Rule.belowPct, nightSpo2Rule.belowPct, 95]), today);
  assert.deepEqual(atFloor.reasons, []);
});

test('SpO2: kişisel medyanın 3 puan altı (mutlak sınırın üstünde de olsa) → not', () => {
  const base = flat(28, 98);
  const r = readNightSpo2(series([...base, 95, 95, 97]), today);
  assert.equal(r.flagged, true);
  assert.deepEqual(r.reasons, ['below_baseline']);
  // 2,9 puan yetmez; kayan nokta sınırı tam 3'te tutar.
  assert.equal(readNightSpo2(series([...flat(28, 97.9), 95, 95, 97]), today).flagged, false);
  assert.equal(readNightSpo2(series([...flat(28, 97.7), 94.7, 94.7, 97]), today).flagged, true);
});

test('SpO2: taban yoksa yalnız mutlak sınır; yakın gece yoksa hesaplanmaz; eksik gece sayılmaz', () => {
  const noBase = readNightSpo2(series([92, 92, 96]), today);
  assert.equal(noBase.baselineMedian, null);
  assert.equal(noBase.flagged, true);
  assert.deepEqual(noBase.reasons, ['below_floor']);
  assert.equal(readNightSpo2(series([96, 96, 96]), today).flagged, false);
  assert.equal(readNightSpo2(series([92, 92], addIsoDays(today, -2)), today).flagged, null);
  // Pencerede iki gece eksikse tek düşük gece yetmez.
  assert.equal(readNightSpo2(series([...flat(28, 96), null, null, 92]), today).flagged, false);
});

function skin(deviations: readonly (number | null)[], last = today): SkinTempValue[] {
  return deviations.map((d, i) => ({
    date: addIsoDays(last, -(deviations.length - 1 - i)),
    nightly: d === null ? null : 33.2 + d,
    baseline: d === null ? null : 33.2,
  }));
}

test('cilt sıcaklığı: iki gece üst üste tabanın 0,3 °C üstü → not; sınırda kayan nokta hatası yok', () => {
  assert.equal(readSkinTemp(skin([0, 0.4, 0.5]), today).flagged, true);
  assert.equal(readSkinTemp(skin([0, 0.1, 0.5]), today).flagged, false);
  assert.equal(readSkinTemp(skin([0.29, 0.6]), today).flagged, false);
  // 36,6 − 36,3 kayan noktada 0,3'ün biraz üstü/altı çıkabilir; tam sınır not sayılır.
  const exact = [
    { date: addIsoDays(today, -1), nightly: 36.6, baseline: 36.3 },
    { date: today, nightly: 33.5, baseline: 33.2 },
  ];
  assert.equal(readSkinTemp(exact, today).flagged, true);
  assert.equal(skinTempRule.consecutiveNights, 2);
});

test('cilt sıcaklığı: taban ya da gece eksikse o gece sayılmaz; ardışık iki gece yoksa hesaplanmaz', () => {
  assert.equal(readSkinTemp(skin([0.5, null, 0.5]), today).flagged, null);
  assert.equal(readSkinTemp([{ date: today, nightly: 34, baseline: null }], today).flagged, null);
  assert.equal(readSkinTemp(skin([0.5, 0.5], addIsoDays(today, -2)), today).flagged, null);
});

test('flaggedSigns sabit sırayla yalnız not çıkanları verir', () => {
  const signs = readIllnessSigns(
    {
      rhr: series([...flat(28, 46), 51, 51]),
      spo2: series([...flat(28, 96), 96, 96, 96]),
      skinTemp: skin([0.4, 0.4]),
    },
    today,
  );
  assert.deepEqual(flaggedSigns(signs), ['rhr', 'skinTemp']);
});
