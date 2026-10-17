// Haftalık raporun PDF'i (karar 0051): ekrandaki raporun görünüm nesnesinden (weekly-report-view) yazdırılabilir HTML.
// Saf modül; PDF'e çevirme ve paylaşma lib/share-pdf'te. Sayı hesaplamaz: sayılar görünümden, cümleler ekranla aynı
// copy fonksiyonlarından. Kimlik yok: ad, e-posta ya da hesap bilgisi yazılmaz; hangi bölümün gireceğini kullanıcı seçer.

import { addIsoDays, shortSleep, weekLength, type DayLevel, type MetricReading } from '@hooplab/engine';
import { loadGroups, palettes } from '@hooplab/theme';

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';

import { coachFooter, weeklyCoachLabel } from '../copy/coach.ts';
import { previousWeekEnergyText, weeklyEnergyDetail, weeklyEnergyFooter, weeklyEnergyLabel } from '../copy/energy.ts';
import { wellnessLabels } from '../copy/labels.ts';
import { bandDigits, bandNote, formatBand, formatDecimal, formatRolling, formatSleep, levelLabels, levelStates } from '../copy/recovery.ts';
import { spotName } from '../copy/region-load.ts';
import { sources } from '../copy/sources.ts';
import { averageWeeksLabel, formatLoad, formatRatio, loadGroupLabels } from '../copy/training-load.ts';
import {
  aboveText,
  averageNote,
  checkinBaselineText,
  checkinCountText,
  currentLoadNote,
  currentRecoveryNote,
  dayTypesText,
  fluidText,
  historyFooter,
  historyNote,
  levelCountsText,
  lowDaysText,
  mealDaysText,
  nightKindLabels,
  nightsFooter,
  nutritionFooter,
  painFooter,
  phaseText,
  positionsText,
  previousWeekText,
  ratioTileNote,
  sessionsText,
  sleepText,
  weekRangeText,
  weeklyTitle,
  weightChangeText,
  weightFooter,
} from '../copy/weekly-report.ts';
import { formatShortDate, formatShortDay } from '../utils/format-date.ts';
import type { WeeklyReportView } from './weekly-report-view.ts';

/** PDF'e girebilecek bölümler, ekrandaki sırayla. */
export const pdfSectionKeys = ['coach', 'load', 'recovery', 'nights', 'checkin', 'pain', 'nutrition', 'weight', 'energy'] as const;
export type PdfSection = (typeof pdfSectionKeys)[number];

export const pdfSectionLabels: Record<PdfSection, string> = {
  coach: weeklyCoachLabel,
  load: 'Antrenman yükü',
  recovery: 'Toparlanma',
  nights: 'Gece notları',
  checkin: 'Sabah check-in',
  pain: 'Ağrı',
  nutrition: 'Beslenme ve sıvı',
  weight: 'Sabah kilosu',
  energy: 'Yakılan enerji',
};

/** Paylaşılan dosyanın adı: kimlik yok, yalnız hafta. */
export function pdfFileName(weekStart: string): string {
  return `HoopLab-haftalik-${weekStart}.pdf`;
}

/** A4, 72 PPI (expo-print sayfa ölçüsü pikselle). */
export const pdfPage = { width: 595, height: 842 } as const;

const palette = palettes.light;
const dash = '–';

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const e = escapeHtml;

function section(title: string, body: string, footer?: string): string {
  return `<section><h2>${e(title)}</h2>${body}${footer ? `<p class="foot">${e(footer)}</p>` : ''}</section>`;
}

/** Etiket / değer tablosu; değer yoksa satır yazılmaz. */
function rows(items: readonly (readonly [string, string | null | undefined])[]): string {
  const body = items
    .filter((r): r is readonly [string, string] => typeof r[1] === 'string' && r[1] !== '')
    .map(([label, value]) => `<tr><th>${e(label)}</th><td>${e(value)}</td></tr>`)
    .join('');
  return `<table class="rows">${body}</table>`;
}

function weekDays(view: WeeklyReportView): string[] {
  return Array.from({ length: weekLength }, (_, i) => addIsoDays(view.weekStart, i));
}

function dayHeads(view: WeeklyReportView): string {
  const last = view.dates.at(-1)!;
  return weekDays(view)
    .map((d) => `<td class="${d > last ? 'future' : ''}">${e(formatShortDay(d))}</td>`)
    .join('');
}

// --- Bölümler ---

function loadSection(view: WeeklyReportView): string {
  const l = view.load;
  const r = l.reading;
  if (l.empty) return section(pdfSectionLabels.load, '<p>Henüz seans kaydı yok.</p>');

  // Günlük yük çubukları: tür gruplarına göre yığılmış (renkler seans türü, risk rengi değil; karar 0026).
  const max = Math.max(1, ...l.days.map((d) => d.load ?? 0));
  const barW = 22;
  const slot = 70;
  const h = 64;
  const bars = weekDays(view)
    .map((date, i) => {
      const day = l.days.find((d) => d.date === date);
      const x = i * slot + (slot - barW) / 2;
      if (!day || day.load === null || day.load === 0) {
        return day ? `<rect x="${x}" y="${h - 2}" width="${barW}" height="2" fill="${palette.dot}"/>` : '';
      }
      let y = h;
      return loadGroups
        .map((g) => {
          const part = day.parts[g];
          if (part <= 0) return '';
          const ph = (part / max) * h;
          y -= ph;
          return `<rect x="${x}" y="${y.toFixed(1)}" width="${barW}" height="${ph.toFixed(1)}" fill="${palette.loadGroup[g]}"/>`;
        })
        .join('');
    })
    .join('');
  // Yatayda sayfa genişliğine esner (preserveAspectRatio none): çubuklar altındaki gün sütunlarına otursun.
  const chart = `<svg class="chart" viewBox="0 0 ${slot * weekLength} ${h}" preserveAspectRatio="none" width="100%" height="${h}">${bars}</svg>`;
  const legend = loadGroups
    .map((g) => `<span><i style="background:${palette.loadGroup[g]}"></i>${e(loadGroupLabels[g])} ${e(formatLoad(l.parts[g]))}</span>`)
    .join('');
  const daily = weekDays(view)
    .map((date) => {
      const day = l.days.find((d) => d.date === date);
      return `<td>${day ? (day.load === null ? dash : e(formatLoad(day.load))) : ''}</td>`;
    })
    .join('');

  const end = r.end;
  const metrics = end
    ? rows([
        [`${averageWeeksLabel} (AU/hafta)`, `${end.weeklyAverage === null ? dash : formatLoad(end.weeklyAverage)} · ${averageNote(end)}`],
        ['Alıştığına göre', `${end.ratio === null ? dash : formatRatio(end.ratio)} · ${ratioTileNote(end)}`],
        ['Monotonluk', `${end.monotony === null ? dash : formatDecimal(end.monotony)} · önceki: ${historyNote(r.history.map((x) => x.monotony), (n) => formatDecimal(n))}`],
        ['Gerilim (AU)', `${end.strain === null ? dash : formatLoad(end.strain)} · önceki: ${historyNote(r.history.map((x) => x.strain), formatLoad)}`],
      ])
    : '';

  const body = `
    <div class="head">
      <div><div class="label">${view.phase === 'complete' ? 'Haftanın yükü' : 'Bugüne kadar'}</div>
      <div class="metric">${r.total === null ? dash : e(formatLoad(r.total))} <small>AU</small></div></div>
      <div class="right">${e(previousWeekText(view))}<br>${e(sessionsText(view))}</div>
    </div>
    ${chart}
    <table class="days"><tr>${dayHeads(view)}</tr><tr class="sub">${daily}</tr></table>
    <div class="legend">${legend}</div>
    ${metrics}`;
  return section(pdfSectionLabels.load, body, end ? historyFooter(r.history.map((x) => x.total)) : currentLoadNote);
}

function levelDot(level: DayLevel): string {
  const state = levelStates[level];
  return state
    ? `<span class="dot" style="background:${palette.status[state]}"></span>`
    : `<span class="dot" style="border:2px solid ${palette.dot}"></span>`;
}

function bandRow(r: MetricReading, unit: string): string {
  const band = formatBand(r, bandDigits(r));
  return `${formatRolling(r)} ${unit} · ${bandNote(r)} · aralığın ${band ? `${band} ${unit}` : 'oluşuyor'}`;
}

function recoverySection(view: WeeklyReportView): string {
  const r = view.recovery;
  if (r.empty) return section(pdfSectionLabels.recovery, '<p>Bu hafta cihaz verisi yok.</p>');
  const cells = weekDays(view)
    .map((date) => {
      const day = r.days.find((d) => d.date === date);
      return `<td>${day ? levelDot(day.level) : ''}</td>`;
    })
    .join('');
  const labels = weekDays(view)
    .map((date) => {
      const day = r.days.find((d) => d.date === date);
      return `<td>${day ? e(levelLabels[day.level]) : ''}</td>`;
    })
    .join('');
  const body = `
    <div class="label">Günün durumu</div>
    <table class="days"><tr>${cells}</tr><tr>${dayHeads(view)}</tr><tr class="sub">${labels}</tr></table>
    <p class="muted">${e(levelCountsText(r.counts))}</p>
    ${rows([
      ['HRV (hafta ort.)', r.hrv ? bandRow(r.hrv, 'ms') : null],
      ['Uyku nabzı (hafta ort.)', r.rhr ? bandRow(r.rhr, 'atım/dk') : null],
      [
        'Uyku (gece ort.)',
        `${r.sleepHours === null ? dash : `${formatSleep(r.sleepHours * 60)} sa`} · ${sleepText(view)} · hedef ort. en az ${formatSleep(shortSleep.minHours * 60)} sa`,
      ],
    ])}`;
  return section(pdfSectionLabels.recovery, body, view.phase === 'current' ? currentRecoveryNote : undefined);
}

function nightsSection(view: WeeklyReportView): string {
  if (view.nights.length === 0) return section(pdfSectionLabels.nights, '<p>Bu hafta gece notu yok.</p>');
  return section(
    pdfSectionLabels.nights,
    rows(view.nights.map((n) => [formatShortDate(n.date), n.kinds.map((k) => nightKindLabels[k]).join(' · ')] as const)),
    nightsFooter,
  );
}

function checkinSection(view: WeeklyReportView): string {
  const c = view.checkin;
  const items = c.items.map(
    (it) => [wellnessLabels[it.item].title, `${formatDecimal(it.mean)}${it.baselineMean === null ? '' : ` · olağan ${formatDecimal(it.baselineMean)}`}`] as const,
  );
  const body = `
    <div class="head">
      <div><div class="label">Ortalama toplam</div>
      <div class="metric">${c.meanTotal === null ? dash : e(formatDecimal(c.meanTotal))} <small>${e(checkinCountText(view))}</small></div></div>
      <div class="right">${e(checkinBaselineText(view))}${c.n > 0 && c.baselineMean !== null ? `<br>${e(lowDaysText(c.lowDates.length))}` : ''}</div>
    </div>
    ${items.length ? rows(items) : ''}`;
  return section(pdfSectionLabels.checkin, body);
}

function painSection(view: WeeklyReportView): string {
  const p = view.pain;
  if (p.spots.length === 0) {
    return section(pdfSectionLabels.pain, `<p>${p.checkinDays === 0 ? 'Bu hafta check-in yok.' : `${p.checkinDays} check-in'de ağrı girilmedi.`}</p>`);
  }
  const all = weekDays(view);
  const spotRows = p.spots
    .map((s) => {
      const cells = all
        .map((date) => {
          const d = s.days.find((x) => x.date === date);
          if (!d) return '<td></td>';
          if (d.pain === null) return '<td class="none"></td>';
          return `<td class="${d.pain > 0 ? 'pain' : ''}">${d.pain}</td>`;
        })
        .join('');
      const above = aboveText(s.aboveMonitoring);
      return `<tr><th>${e(spotName(s.spot))}${above ? `<br><small>${e(above)}</small>` : ''}</th>${cells}</tr>`;
    })
    .join('');
  const body = `<table class="grid"><tr><th></th>${dayHeads(view)}</tr>${spotRows}</table>`;
  return section(pdfSectionLabels.pain, body, painFooter);
}

function nutritionSection(view: WeeklyReportView): string {
  const n = view.nutrition;
  const hasTarget = n.mealDays > 0 && n.noTarget < n.mealDays;
  const body = rows([
    [mealDaysText(view), dayTypesText(n.dayTypes, n.matchDays)],
    ['Karbonhidrat', hasTarget ? positionsText(n.carbs) : null],
    ['Protein', hasTarget ? positionsText(n.protein) : null],
    ['Kilo olmadan hedef yok', n.noTarget > 0 ? `${n.noTarget} gün` : null],
    ['Su', fluidText(view)],
    ['Ter testi', n.sweatTests > 0 ? String(n.sweatTests) : null],
  ]);
  return section(pdfSectionLabels.nutrition, body, nutritionFooter);
}

function weightSection(view: WeeklyReportView): string {
  const w = view.weight;
  const change = weightChangeText(view);
  const value = w.mean === null ? 'Bu hafta tartı yok' : `${formatDecimal(w.mean)} kg · ${w.n} tartı${change ? ` · ${change}` : ''}`;
  return section(pdfSectionLabels.weight, rows([['Hafta ortalaması', value]]), weightFooter);
}

function energySection(view: WeeklyReportView): string {
  const en = view.energy;
  const body = rows([
    [weeklyEnergyLabel(en), weeklyEnergyDetail(en, view.phase === 'current') ?? null],
    ['Önceki hafta', previousWeekEnergyText(en)],
  ]);
  return section(`${pdfSectionLabels.energy} · tahmin`, body, weeklyEnergyFooter);
}

/** Koç yorumu (karar 0052): denetimden geçmiş cümleler, numaralı dayanaklar; sayılar "Haftanın sayıları"ndan. */
function coachSection(coach: readonly AuditSentence[]): string {
  let mark = 0;
  const notes: string[] = [];
  const lines = coach
    .map((s) => {
      if (s.numbers.length + s.sources.length === 0) return `<p>${e(s.text)}</p>`;
      const n = ++mark;
      const cites = s.sources.map((id) => (sources as Record<string, { cite: string; kind: string } | undefined>)[id]?.cite ?? id);
      notes.push(`<li value="${n}">${e(cites.length ? cites.join('; ') : 'Haftanın sayıları')}</li>`);
      return `<p>${e(s.text)}<sup>${n}</sup></p>`;
    })
    .join('');
  return section(`${pdfSectionLabels.coach} · yapay zeka`, `<div class="coach">${lines}</div><ol class="cites">${notes.join('')}</ol>`, coachFooter);
}

const builders: Record<Exclude<PdfSection, 'coach'>, (view: WeeklyReportView) => string> = {
  load: loadSection,
  recovery: recoverySection,
  nights: nightsSection,
  checkin: checkinSection,
  pain: painSection,
  nutrition: nutritionSection,
  weight: weightSection,
  energy: energySection,
};

export const pdfDisclaimer =
  'Sayılar uygulamanın hesap motorunda, sporcunun kendi geçmişine göre hesaplanır; her eşik bir kaynağa bağlıdır. Tanı değildir. "Tahmin" yazan değerler ölçüm değildir.';

const css = `
  @page { size: A4; margin: 32px 36px; }
  /* iOS yazdırırken arka plan renklerini düşürür: durum noktaları, lejant ve ağrı hücreleri renkli kalsın. */
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: ${palette.ink}; font-size: 10.5px; line-height: 1.4; margin: 0; }
  header { border-bottom: 2px solid ${palette.ink}; padding-bottom: 8px; margin-bottom: 4px; }
  header .brand { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: ${palette.inkMuted}; }
  h1 { font-size: 20px; margin: 2px 0 0; }
  header .meta { color: ${palette.inkMuted}; margin-top: 2px; }
  section { padding: 10px 0 8px; border-bottom: 1px solid ${palette.line}; page-break-inside: avoid; break-inside: avoid; }
  h2 { font-size: 12.5px; margin: 0 0 6px; }
  p { margin: 4px 0; }
  .muted, .foot, small, .right, .label, .sub td, .legend { color: ${palette.inkMuted}; }
  .foot { font-size: 9px; margin-top: 6px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .right { text-align: right; font-size: 9.5px; }
  .metric { font-size: 22px; font-weight: 600; }
  .metric small { font-size: 10px; font-weight: 400; }
  .chart { display: block; margin-top: 8px; }
  table { border-collapse: collapse; width: 100%; }
  .days td { width: ${100 / weekLength}%; text-align: center; padding: 2px 0; font-size: 9.5px; }
  .days td.future { opacity: 0.4; }
  .sub td { font-size: 9px; }
  .dot { display: inline-block; width: 14px; height: 14px; border-radius: 7px; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 6px 0 4px; font-size: 9.5px; }
  .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
  .rows { margin-top: 6px; }
  .rows th { text-align: left; font-weight: 500; padding: 3px 8px 3px 0; width: 38%; vertical-align: top; }
  .rows td { padding: 3px 0; }
  .rows tr + tr th, .rows tr + tr td { border-top: 1px solid ${palette.line}; }
  .grid th { text-align: left; font-weight: 500; padding: 3px 6px 3px 0; width: 30%; }
  .grid td { text-align: center; height: 20px; border: 2px solid #fff; }
  .grid td.pain { background: ${palette.line}; font-weight: 600; }
  .grid td.none { border: 1px dashed ${palette.dot}; }
  .coach p { margin: 0 0 5px; font-size: 11px; }
  .coach sup { font-size: 8px; margin-left: 1px; }
  .cites { margin: 6px 0 0; padding-left: 16px; font-size: 9px; color: ${palette.inkMuted}; }
  footer { margin-top: 10px; font-size: 9px; color: ${palette.inkMuted}; }
`;

export interface WeeklyPdfOptions {
  sections: readonly PdfSection[];
  /** Hazırlandığı gün (yerel, "2026-10-17"). */
  preparedOn: string;
  /** Haftanın kabul edilmiş koç yorumu (gösterilen cümleler); yoksa bölüm seçilse de yazılmaz. */
  coach?: readonly AuditSentence[] | null;
}

/** Seçilen bölümlerle tam HTML belgesi. Bölümler her zaman ekrandaki sırayla yazılır. */
export function buildWeeklyReportHtml(view: WeeklyReportView, options: WeeklyPdfOptions): string {
  const chosen = new Set(options.sections);
  const body = pdfSectionKeys
    .filter((k) => chosen.has(k))
    .map((k) => (k === 'coach' ? (options.coach?.length ? coachSection(options.coach) : '') : builders[k](view)))
    .join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${e(weeklyTitle)}</title><style>${css}</style></head><body>
<header><div class="brand">HoopLab</div><h1>${e(weeklyTitle)} · ${e(weekRangeText(view.weekStart, view.weekEnd))}</h1>
<div class="meta">${e(phaseText(view))} · hazırlandı ${e(formatShortDate(options.preparedOn))}</div></header>
${body}
<footer>${e(pdfDisclaimer)}</footer>
</body></html>`;
}
