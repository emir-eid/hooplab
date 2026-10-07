// Öğün kaydı (karar 0030): besin listesinden gram, etiketten giriş, hedef aralığa göre yer. Sentetik değerlerle.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  dayIntake,
  foodById,
  foodGroups,
  foods,
  itemMacros,
  mealMacros,
  nutritionTargets,
  rangePosition,
  reachesProteinDose,
  type Meal,
} from '../src/index.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('besin listesi research/foods/foods.json ile aynı (üretilmiş dosya elle değişmemiş)', () => {
  const doc = JSON.parse(readFileSync(new URL('../../../research/foods/foods.json', import.meta.url), 'utf8')) as {
    foods: {
      id: string;
      name: string;
      group: string;
      fdc_id: number;
      portion: { label: string; grams: number };
      per_100g: { carbs: number; protein: number };
    }[];
  };
  assert.deepEqual(
    foods.map((f) => ({ ...f })),
    doc.foods.map((f) => ({
      id: f.id,
      name: f.name,
      group: f.group,
      fdcId: f.fdc_id,
      portionLabel: f.portion.label,
      portionGrams: f.portion.grams,
      carbsPer100g: f.per_100g.carbs,
      proteinPer100g: f.per_100g.protein,
    })),
  );
  assert.equal(new Set(foods.map((f) => f.id)).size, foods.length);
  for (const f of foods) {
    assert.ok((foodGroups as readonly string[]).includes(f.group), f.id);
    assert.ok(f.portionGrams > 0 && f.carbsPer100g >= 0 && f.proteinPer100g >= 0, f.id);
    assert.ok(f.carbsPer100g + f.proteinPer100g <= 100, f.id);
  }
});

test('kalem: 100 g değeri × ev ölçüsünün gramı × çarpan', () => {
  const rice = foodById('pilav-pirinc')!;
  const m = itemMacros({ food: 'pilav-pirinc', portions: 1.5 })!;
  close(m.carbsG, (rice.carbsPer100g * rice.portionGrams * 1.5) / 100);
  close(m.proteinG, (rice.proteinPer100g * rice.portionGrams * 1.5) / 100);
  assert.equal(itemMacros({ food: 'yok-boyle-besin', portions: 1 }), null);
  assert.equal(itemMacros({ food: 'pilav-pirinc', portions: 4 }), null);
});

test('etiketten giriş: 0-300 g, ikisi birden sıfır olamaz, ad en çok 40 karakter', () => {
  assert.deepEqual(itemMacros({ label: 'Bar', carbsG: 22, proteinG: 20 }), { carbsG: 22, proteinG: 20 });
  assert.deepEqual(itemMacros({ label: null, carbsG: 0, proteinG: 5 }), { carbsG: 0, proteinG: 5 });
  assert.equal(itemMacros({ label: null, carbsG: 0, proteinG: 0 }), null);
  assert.equal(itemMacros({ label: null, carbsG: 301, proteinG: 0 }), null);
  assert.equal(itemMacros({ label: 'x'.repeat(41), carbsG: 10, proteinG: 0 }), null);
});

test('öğün toplamı; hesaba girmeyen kalem sayılır', () => {
  const m = mealMacros([
    { food: 'muz', portions: 1 },
    { label: null, carbsG: 10, proteinG: 25 },
    { food: 'listeden-cikmis', portions: 1 },
  ]);
  const banana = itemMacros({ food: 'muz', portions: 1 })!;
  close(m.carbsG, banana.carbsG + 10);
  close(m.proteinG, banana.proteinG + 25);
  assert.equal(m.skipped, 1);
});

test('aralıktaki yer yuvarlanmış gramla: ekrandaki sayıyla aynı karar', () => {
  assert.equal(rangePosition(449.4, [450, 630]), 'below');
  assert.equal(rangePosition(449.5, [450, 630]), 'within');
  assert.equal(rangePosition(630.4, [450, 630]), 'within');
  assert.equal(rangePosition(630.5, [450, 630]), 'above');
});

test('öğün dozu: ≈ 0,3 g/kg × kilo (protein-gunluk); kilo yoksa null', () => {
  const t = nutritionTargets('training', 90); // öğün dozu 27 g
  assert.equal(t.proteinPerMealG, 27);
  assert.equal(reachesProteinDose(26.6, t), true);
  assert.equal(reachesProteinDose(26.4, t), false);
  assert.equal(reachesProteinDose(40, nutritionTargets('training', null)), null);
});

test('günün alımı: toplam, hedefe göre yer ve dozdaki öğün sayısı', () => {
  const t = nutritionTargets('training', 90); // karbonhidrat 450-630, protein 108-180
  const meals: Meal[] = [
    { id: 'a', localDate: '2026-10-31', slot: 'breakfast', items: [{ label: null, carbsG: 100, proteinG: 30 }] },
    { id: 'b', localDate: '2026-10-31', slot: 'lunch', items: [{ label: null, carbsG: 200, proteinG: 20 }] },
  ];
  const d = dayIntake(meals, t);
  assert.equal(d.meals, 2);
  assert.equal(d.carbsG, 300);
  assert.equal(d.proteinG, 50);
  assert.equal(d.carbsPosition, 'below');
  assert.equal(d.proteinPosition, 'below');
  assert.equal(d.mealsAtProteinDose, 1);

  const none = dayIntake([], t);
  assert.equal(none.carbsPosition, null);
  assert.equal(none.mealsAtProteinDose, 0);

  const noWeight = dayIntake(meals, nutritionTargets('training', null));
  assert.equal(noWeight.carbsPosition, null);
  assert.equal(noWeight.mealsAtProteinDose, null);
  assert.equal(noWeight.carbsG, 300);
});
