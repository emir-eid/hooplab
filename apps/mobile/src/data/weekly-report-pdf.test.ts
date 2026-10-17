// Haftalık rapor PDF'i (karar 0051): seçilen bölümler, boş hafta, kaçış ve kimliksiz çıktı.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDemoDb, type DemoScenario } from '../demo/demo-data.ts';
import { buildWeeklyReportHtml, escapeHtml, pdfFileName, pdfSectionKeys, pdfSectionLabels } from './weekly-report-pdf.ts';
import { buildWeeklyReportView, type WeeklyRows } from './weekly-report-view.ts';

const today = '2026-10-14';
const now = new Date('2026-10-14T09:00:00+03:00');
const lastWeek = '2026-10-05';
const thisWeek = '2026-10-12';

function demo(scenario: DemoScenario): WeeklyRows {
  const db = createDemoDb(scenario, today, now);
  return {
    sessions: db.sessions.map((s) => ({
      local_date: s.localDate,
      rpe: s.rpe,
      duration_min: s.durationMin,
      kind: s.kind,
      minutes_played: s.minutesPlayed,
      sweat: s.sweat !== null,
    })),
    earliestSession: db.sessions.map((s) => s.localDate).sort()[0] ?? null,
    healthDaily: db.healthDaily,
    energy: db.energy,
    sleep: db.sleep,
    checkins: db.checkins.map((c) => ({ local_date: c.local_date, ...c.answers })),
    pain: db.pain,
    weights: db.weights,
    dayTypes: [],
    matches: db.matches,
    meals: db.meals,
    fluids: db.fluids,
  };
}

const emptyRows: WeeklyRows = {
  sessions: [],
  earliestSession: null,
  healthDaily: [],
  energy: [],
  sleep: [],
  checkins: [],
  pain: [],
  weights: [],
  dayTypes: [],
  matches: [],
  meals: [],
  fluids: [],
};

const h2s = (html: string) => [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);

test('bütün bölümler ekrandaki sırayla; boş değer sızmaz', () => {
  for (const scenario of ['green', 'yellow', 'red'] as const) {
    for (const week of [lastWeek, thisWeek]) {
      const view = buildWeeklyReportView(demo(scenario), week, today);
      const html = buildWeeklyReportHtml(view, { sections: pdfSectionKeys, preparedOn: today });
      // Koç yorumu verilmedi: bölüm seçili olsa da yazılmaz.
      assert.deepEqual(
        h2s(html).map((t) => t?.replace(' · tahmin', '')),
        pdfSectionKeys.filter((k) => k !== 'coach').map((k) => pdfSectionLabels[k]),
      );
      assert.doesNotMatch(html, /undefined|NaN|null|\[object/);
    }
  }
});

test('yalnız seçilen bölümler girer; sıra seçime göre değil ekrana göre', () => {
  const view = buildWeeklyReportView(demo('green'), lastWeek, today);
  const html = buildWeeklyReportHtml(view, { sections: ['pain', 'load'], preparedOn: today });
  assert.deepEqual(h2s(html), [pdfSectionLabels.load, pdfSectionLabels.pain]);
  // Kilo ve beslenme seçilmedi: kilo değeri ve öğün satırı yok.
  assert.doesNotMatch(html, / kg/);
  assert.doesNotMatch(html, /Öğün kaydı/);
});

test('kayıtsız hafta: her bölüm boş durumunu yazar', () => {
  const view = buildWeeklyReportView(emptyRows, lastWeek, today);
  const html = buildWeeklyReportHtml(view, { sections: pdfSectionKeys, preparedOn: today });
  assert.match(html, /Henüz seans kaydı yok/);
  assert.match(html, /Bu hafta cihaz verisi yok/);
  assert.match(html, /Bu hafta check-in yok/);
  assert.match(html, /Bu hafta tartı yok/);
  assert.doesNotMatch(html, /undefined|NaN|null/);
});

test('kimlik yok: e-posta, kullanıcı kimliği ya da ad alanı yazılmaz', () => {
  const view = buildWeeklyReportView(demo('green'), lastWeek, today);
  const html = buildWeeklyReportHtml(view, { sections: pdfSectionKeys, preparedOn: today });
  assert.doesNotMatch(html, /@[a-z0-9-]+\.[a-z]/i);
  assert.doesNotMatch(html, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
  assert.equal(pdfFileName(lastWeek), 'HoopLab-haftalik-2026-10-05.pdf');
});

test('metin HTML olarak kaçışlanır', () => {
  assert.equal(escapeHtml(`<b a="1">'x' & y</b>`), '&lt;b a=&quot;1&quot;&gt;&#39;x&#39; &amp; y&lt;/b&gt;');
});

test('koç yorumu: cümleler numaralı dayanaklarla ve kaynak künyesiyle', () => {
  const view = buildWeeklyReportView(demo('green'), lastWeek, today);
  const coach = [
    { text: 'Bu hafta 7 gün Hazır geçti.', numbers: ['status'], sources: [] },
    { text: 'Kısa geçiş.', numbers: [], sources: [] },
    { text: 'Yoğunluğu planlandığı gibi sürdür.', numbers: [], sources: ['vesterinen-2016'] },
  ];
  const html = buildWeeklyReportHtml(view, { sections: ['coach', 'load'], preparedOn: today, coach });
  assert.deepEqual(h2s(html), [`${pdfSectionLabels.coach} · yapay zeka`, pdfSectionLabels.load]);
  assert.match(html, /Hazır geçti\.<sup>1<\/sup>/);
  assert.match(html, /<p>Kısa geçiş\.<\/p>/);
  assert.match(html, /<li value="2">Vesterinen ve ark\., 2016<\/li>/);
  // Yorum yoksa bölüm sessizce atlanır.
  assert.doesNotMatch(buildWeeklyReportHtml(view, { sections: ['coach'], preparedOn: today, coach: null }), /<h2>/);
});
