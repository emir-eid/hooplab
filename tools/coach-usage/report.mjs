// Koçun aylık token kullanımı raporu (karar 0032). Bağlı Supabase projesinden yalnız sayı, durum ve denetim sorun
// kodu sütunlarını okur (özet metni, soru, anlık değerler okunmaz) ve markdown raporu ekrana yazar.
//
//   npm run coach:usage                        → bu ayın raporu (bulut, `supabase db query --linked`)
//   npm run coach:usage -- --ay 2026-10        → belirli bir ay
//   npm run coach:usage -- --kredi 20          → Console'a yükleme yapıldıysa toplam kredi
//   npm run coach:usage -- --dosya rows.json   → veritabanı yerine kayıt dosyası (sorgunun JSON çıktısı)
//   npm run coach:usage -- --yerel             → yerel Supabase (`npm run db:start`)
//
// Saf mantık usage-lib.mjs'te (testli).

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCliJson } from '../setup/setup-lib.mjs';
import { CREDIT_USD, creditStatus, formatReport, monthReport, monthsOf, triggerFlags, USAGE_SQL } from './usage-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fail(message) {
  console.error(`Hata: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { month: null, credit: CREDIT_USD, file: null, local: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ay') out.month = argv[++i] ?? fail('--ay için YYYY-AA');
    else if (a === '--kredi') {
      out.credit = Number(argv[++i]);
      if (!Number.isFinite(out.credit) || out.credit <= 0) fail('--kredi pozitif bir sayı olmalı');
    } else if (a === '--dosya') out.file = argv[++i] ?? fail('--dosya için yol');
    else if (a === '--yerel') out.local = true;
    else fail(`bilinmeyen seçenek: ${a}`);
  }
  return out;
}

function supabaseCli() {
  const require = createRequire(import.meta.url);
  try {
    const pkgPath = require.resolve('supabase/package.json', { paths: [ROOT] });
    return path.join(path.dirname(pkgPath), require(pkgPath).bin.supabase);
  } catch {
    return fail('Supabase CLI bulunamadı. Önce kök klasörde: npm install');
  }
}

function queryRows({ local }) {
  // `--agent no`: CLI ajan altında çıktı biçimini değiştiriyor (LESSONS "Supabase"); parseCliJson iki biçimi de okur.
  const args = [supabaseCli(), 'db', 'query', local ? '--local' : '--linked', '-o', 'json', '--agent', 'no', USAGE_SQL];
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0) fail(`sorgu başarısız: ${(r.stderr ?? '').trim().split(/\r?\n/).at(-1) ?? ''}`);
  return parseCliJson(r.stdout);
}

/** Yerel tarih (YYYY-MM-DD); İsveç biçimi ISO tarihini verir. */
function localToday() {
  return new Date().toLocaleDateString('sv-SE');
}

const opts = parseArgs(process.argv.slice(2));
const rows = opts.file ? parseCliJson(readFileSync(opts.file, 'utf8')) : queryRows(opts);
if (!Array.isArray(rows)) fail('kayıtlar bir dizi değil');

const today = localToday();
const month = opts.month ?? today.slice(0, 7);
const firstDate = rows.map((r) => r.local_date).filter(Boolean).sort()[0] ?? null;
const months = monthsOf(rows);
if (!months.includes(month)) months.push(month);
months.sort();
const reports = months.map((m) => monthReport(rows, m, { today, firstDate }));
const report = reports.find((r) => r.month === month);

process.stdout.write(
  formatReport(report, {
    allMonths: reports,
    credit: creditStatus(rows, { credit: opts.credit }),
    flags: triggerFlags(reports),
  }),
);
