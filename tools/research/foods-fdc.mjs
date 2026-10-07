#!/usr/bin/env node
// Öğün kaydının besin listesi (karar 0030): research/foods/foods.json'daki elle seçilmiş besinlerin
// FDC değerlerini (açıklama, ev ölçüsünün gramı, 100 g'daki karbonhidrat ve protein) doldurur ve
// motorun okuduğu packages/engine/src/foods-data.ts dosyasını üretir. Sayılar elle yazılmaz.
//
// Kullanım:
//   node tools/research/foods-fdc.mjs --from <SR Legacy CSV klasörü>   FDC değerlerini yaz + foods-data.ts üret
//   node tools/research/foods-fdc.mjs --online                         değerleri FDC API'siyle karşılaştır (DEMO_KEY,
//                                                                        20 besin başına 1 istek; anahtar FDC_API_KEY)
//   node tools/research/foods-fdc.mjs --check                          foods-data.ts, foods.json'la aynı mı (çevrimdışı)
//
// SR Legacy CSV: https://fdc.nal.usda.gov/download-datasets (FoodData_Central_sr_legacy_food_csv_2018-04), CC0.
// Çıkış kodları: 0 temiz · 1 uyuşmazlık · 2 betik hatası.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const foodsPath = path.join(repo, 'research/foods/foods.json');
const dataPath = path.join(repo, 'packages/engine/src/foods-data.ts');

/** FDC besin ögesi kimlikleri (nutrient.csv): 1005 karbonhidrat (farktan), 1003 protein. */
const NUTRIENT = { carbs: '1005', protein: '1003' };
const GROUPS = ['grain', 'legume', 'fruit', 'protein', 'dairy', 'nut'];

/** Tırnaklı alanları ve kaçışlı tırnakları ("") tanıyan küçük CSV ayrıştırıcı; ilk satır başlık. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

/** 100 g değerini iki ondalığa yuvarla (FDC'nin yayımladığı hassasiyet). */
const round2 = (n) => Math.round(n * 100) / 100;

/** Elle seçilen alanlar geçerli mi (FDC'ye bakmadan). */
export function validateSpec(doc) {
  const errors = [];
  const ids = new Set();
  for (const f of doc.foods ?? []) {
    const where = f.id ?? '(id yok)';
    if (!/^[a-z0-9-]+$/.test(f.id ?? '')) errors.push(`${where}: id küçük harf, rakam ve tire olmalı`);
    if (ids.has(f.id)) errors.push(`${where}: id tekrar ediyor`);
    ids.add(f.id);
    if (!f.name) errors.push(`${where}: name eksik`);
    if (!GROUPS.includes(f.group)) errors.push(`${where}: group '${f.group}' geçersiz`);
    if (!Number.isInteger(f.fdc_id)) errors.push(`${where}: fdc_id tam sayı olmalı`);
    if (!f.portion?.label || !(f.portion?.fdc_amount > 0) || !f.portion?.fdc_modifier) errors.push(`${where}: portion eksik`);
  }
  return errors;
}

/** SR Legacy CSV'lerinden FDC alanlarını doldurur; bulunamayan ya da birden çok eşleşen ölçü hatadır. */
export function fillFromCsv(doc, tables) {
  const errors = [];
  const foodById = new Map(tables.food.map((r) => [r.fdc_id, r]));
  const nutrients = new Map();
  for (const r of tables.food_nutrient) {
    if (r.nutrient_id !== NUTRIENT.carbs && r.nutrient_id !== NUTRIENT.protein) continue;
    const m = nutrients.get(r.fdc_id) ?? {};
    m[r.nutrient_id] = Number(r.amount);
    nutrients.set(r.fdc_id, m);
  }
  const foods = doc.foods.map((f) => {
    const key = String(f.fdc_id);
    const food = foodById.get(key);
    if (!food) {
      errors.push(`${f.id}: FDC ${key} SR Legacy'de yok`);
      return f;
    }
    const n = nutrients.get(key) ?? {};
    if (n[NUTRIENT.carbs] === undefined || n[NUTRIENT.protein] === undefined) errors.push(`${f.id}: karbonhidrat ya da protein değeri yok`);
    const portions = tables.food_portion.filter(
      (p) =>
        p.fdc_id === key &&
        Number(p.amount) === f.portion.fdc_amount &&
        (p.modifier === f.portion.fdc_modifier || p.portion_description === f.portion.fdc_modifier) &&
        (f.portion.fdc_seq === undefined || Number(p.seq_num) === f.portion.fdc_seq),
    );
    if (portions.length !== 1) errors.push(`${f.id}: ölçü '${f.portion.fdc_amount} ${f.portion.fdc_modifier}' ${portions.length} kez bulundu`);
    return {
      ...f,
      fdc_description: food.description,
      portion: { ...f.portion, grams: portions.length === 1 ? Number(portions[0].gram_weight) : null },
      per_100g: { carbs: round2(n[NUTRIENT.carbs] ?? NaN), protein: round2(n[NUTRIENT.protein] ?? NaN) },
    };
  });
  return { doc: { ...doc, foods }, errors };
}

/** foods.json'u besin başına tek satır biçiminde yazar (inceleme kolay olsun). */
export function formatFoodsJson(doc) {
  const { foods, ...head } = doc;
  const headJson = JSON.stringify(head, null, 2).replace(/\n}$/, '');
  const lines = foods.map((f) => `    ${JSON.stringify(f).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/^\{/, '{ ').replace(/\}$/, ' }')}`);
  return `${headJson},\n  "foods": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

/** Motorun okuduğu TS modülü. */
export function renderEngineData(doc) {
  const rows = doc.foods.map((f) => {
    const item = {
      id: f.id,
      name: f.name,
      group: f.group,
      fdcId: f.fdc_id,
      portionLabel: f.portion.label,
      portionGrams: f.portion.grams,
      carbsPer100g: f.per_100g.carbs,
      proteinPer100g: f.per_100g.protein,
    };
    const fields = Object.entries(item).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v.replace(/'/g, "\'")}'` : v}`);
    return `  { ${fields.join(', ')} },`;
  });
  return [
    '// OTOMATİK ÜRETİLDİ: node tools/research/foods-fdc.mjs. Elle değiştirme; kaynak research/foods/foods.json',
    `// (${doc.database}). Karar 0030, rules/beslenme.json → ogun-besin-listesi.`,
    '',
    "import type { Food } from './meals.ts';",
    '',
    'export const foods: readonly Food[] = [',
    ...rows,
    '];',
    '',
  ].join('\n');
}

async function checkOnline(doc) {
  const key = process.env.FDC_API_KEY || 'DEMO_KEY';
  const problems = [];
  for (let i = 0; i < doc.foods.length; i += 20) {
    const chunk = doc.foods.slice(i, i + 20);
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods?api_key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fdcIds: chunk.map((f) => f.fdc_id), format: 'full', nutrients: [203, 205] }),
    });
    if (!res.ok) throw new Error(`FDC API ${res.status}`);
    const items = await res.json();
    for (const f of chunk) {
      const it = items.find((x) => x.fdcId === f.fdc_id);
      if (!it) {
        problems.push(`${f.id}: FDC ${f.fdc_id} API'de yok`);
        continue;
      }
      if (it.description !== f.fdc_description) problems.push(`${f.id}: açıklama değişmiş ('${it.description}')`);
      const amount = (num) => it.foodNutrients?.find((n) => n.nutrient?.number === num)?.amount;
      if (round2(amount('205') ?? NaN) !== f.per_100g.carbs) problems.push(`${f.id}: karbonhidrat API'de ${amount('205')}`);
      if (round2(amount('203') ?? NaN) !== f.per_100g.protein) problems.push(`${f.id}: protein API'de ${amount('203')}`);
      const p = it.foodPortions?.find(
        (x) =>
          Number(x.amount) === f.portion.fdc_amount &&
          (x.modifier === f.portion.fdc_modifier || x.portionDescription === f.portion.fdc_modifier) &&
          (f.portion.fdc_seq === undefined || x.sequenceNumber === f.portion.fdc_seq),
      );
      if (!p || Number(p.gramWeight) !== f.portion.grams) problems.push(`${f.id}: ölçünün gramı API'de ${p?.gramWeight}`);
    }
  }
  return problems;
}

async function main(argv) {
  const doc = JSON.parse(readFileSync(foodsPath, 'utf8'));
  const specErrors = validateSpec(doc);
  if (specErrors.length) {
    console.error(specErrors.join('\n'));
    return 1;
  }
  const from = argv.indexOf('--from');
  if (from !== -1) {
    const dir = argv[from + 1];
    if (!dir) throw new Error('--from bir klasör ister');
    const read = (name) => parseCsv(readFileSync(path.join(dir, `${name}.csv`), 'utf8'));
    const { doc: filled, errors } = fillFromCsv(doc, { food: read('food'), food_nutrient: read('food_nutrient'), food_portion: read('food_portion') });
    if (errors.length) {
      console.error(errors.join('\n'));
      return 1;
    }
    writeFileSync(foodsPath, formatFoodsJson(filled));
    writeFileSync(dataPath, renderEngineData(filled));
    console.log(`${filled.foods.length} besin yazıldı: research/foods/foods.json, packages/engine/src/foods-data.ts`);
    return 0;
  }
  if (argv.includes('--online')) {
    const problems = await checkOnline(doc);
    if (problems.length) {
      console.error(problems.join('\n'));
      return 1;
    }
    console.log(`${doc.foods.length} besin FDC API'siyle aynı.`);
    return 0;
  }
  if (argv.includes('--check')) {
    const same = readFileSync(dataPath, 'utf8') === renderEngineData(doc);
    if (!same) {
      console.error('packages/engine/src/foods-data.ts foods.json ile aynı değil; betiği --from ile yeniden çalıştır.');
      return 1;
    }
    console.log(`foods-data.ts güncel (${doc.foods.length} besin).`);
    return 0;
  }
  console.error('Kullanım: --from <klasör> | --online | --check');
  return 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(e.message);
      process.exit(2);
    },
  );
}
