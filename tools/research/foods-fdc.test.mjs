// foods-fdc.mjs: CSV ayrıştırma ve FDC alanlarının doldurulması (sentetik küçük tablolarla).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fillFromCsv, parseCsv, renderEngineData, validateSpec } from './foods-fdc.mjs';

const spec = {
  database: 'test',
  foods: [{ id: 'muz', name: 'Muz', group: 'fruit', fdc_id: 1, portion: { label: '1 orta boy', fdc_amount: 1, fdc_modifier: 'medium' } }],
};

test('CSV: tırnaklı alan, virgül ve kaçışlı tırnak', () => {
  const rows = parseCsv('"a","b"\r\n"1, iki","x ""y"""\n"3",""\n');
  assert.deepEqual(rows, [
    { a: '1, iki', b: 'x "y"' },
    { a: '3', b: '' },
  ]);
});

test('elle seçilen alanlar denetlenir', () => {
  assert.deepEqual(validateSpec(spec), []);
  const bad = { foods: [{ ...spec.foods[0], group: 'candy' }, spec.foods[0]] };
  assert.equal(validateSpec(bad).length, 2);
});

test('FDC alanları doldurulur; ölçü tek eşleşmeli', () => {
  const tables = {
    food: [{ fdc_id: '1', description: 'Bananas, raw' }],
    food_nutrient: [
      { fdc_id: '1', nutrient_id: '1005', amount: '22.84' },
      { fdc_id: '1', nutrient_id: '1003', amount: '1.09' },
    ],
    food_portion: [
      { fdc_id: '1', seq_num: '1', amount: '1', modifier: 'medium', portion_description: '', gram_weight: '118' },
      { fdc_id: '1', seq_num: '2', amount: '1', modifier: 'large', portion_description: '', gram_weight: '136' },
    ],
  };
  const { doc, errors } = fillFromCsv(spec, tables);
  assert.deepEqual(errors, []);
  assert.deepEqual(doc.foods[0].per_100g, { carbs: 22.84, protein: 1.09 });
  assert.equal(doc.foods[0].portion.grams, 118);
  assert.match(renderEngineData(doc), /\{ id: 'muz', name: 'Muz', group: 'fruit', fdcId: 1, portionLabel: '1 orta boy', portionGrams: 118, carbsPer100g: 22.84, proteinPer100g: 1.09 \}/);

  const twice = { ...tables, food_portion: [tables.food_portion[0], { ...tables.food_portion[0], seq_num: '3' }] };
  assert.equal(fillFromCsv(spec, twice).errors.length, 1);
  assert.equal(fillFromCsv({ foods: [{ ...spec.foods[0], fdc_id: 2 }] }, tables).errors.length, 1);
});
