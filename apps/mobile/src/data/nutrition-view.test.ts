// Beslenme hedefi görünümü: sentetik satırlarla.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildNutritionView, toMeals, toStoredItems, toWeightSeries } from './nutrition-view.ts';

const today = '2026-10-31';

test('numeric metin olarak da gelse kilo okunur, sıralanır', () => {
  assert.deepEqual(
    toWeightSeries([
      { local_date: '2026-10-31', weight_kg: '80.40' },
      { local_date: '2026-10-30', weight_kg: 81 },
    ]),
    [
      { date: '2026-10-30', value: 81 },
      { date: '2026-10-31', value: 80.4 },
    ],
  );
});

test('gün tipi seanslardan; düzeltme varsa o kullanılır', () => {
  const v = buildNutritionView(today, [{ local_date: today, weight_kg: 90 }], [{ kind: 'game', durationMin: 100 }], null);
  assert.equal(v.inferred, 'high');
  assert.equal(v.dayType, 'high');
  assert.deepEqual(v.targets.carbsG, [720, 900]);
  assert.equal(v.todayWeight, 90);
  const o = buildNutritionView(today, [], [{ kind: 'game', durationMin: 100 }], 'rest');
  assert.equal(o.dayType, 'rest');
  assert.equal(o.override, 'rest');
  assert.equal(o.weight, null);
  assert.equal(o.targets.carbsG, null);
});

test('4 haftadan eski ve gelecek kilolar trende girmez', () => {
  const v = buildNutritionView(
    today,
    [
      { local_date: '2026-09-01', weight_kg: 95 },
      { local_date: '2026-11-01', weight_kg: 70 },
      { local_date: '2026-10-20', weight_kg: 88 },
    ],
    [],
    null,
  );
  assert.deepEqual(v.weights, [{ date: '2026-10-20', value: 88 }]);
  assert.equal(v.weight?.basis, 'latest');
  assert.equal(v.dayType, 'rest');
  assert.equal(v.todayWeight, null);
});

test('öğün satırları: snake_case kalem okunur, tanınmayan kalem ve öğün adı atlanır, kayıt sırası korunur', () => {
  const meals = toMeals([
    { id: 'b', local_date: today, slot: 'lunch', created_at: '2026-10-31T12:00:00Z', items: [{ food: 'muz', portions: 1 }] },
    {
      id: 'a',
      local_date: today,
      slot: 'breakfast',
      created_at: '2026-10-31T08:00:00Z',
      items: [{ label: 'Bar', carbs_g: 20, protein_g: 10 }, { kcal: 100 }],
    },
    { id: 'c', local_date: today, slot: 'brunch', items: [{ food: 'muz', portions: 1 }] },
    { id: 'd', local_date: today, slot: 'snack', items: [{ kcal: 1 }] },
  ]);
  assert.deepEqual(
    meals.map((m) => m.id),
    ['a', 'b'],
  );
  assert.deepEqual(meals[0]?.items, [{ label: 'Bar', carbsG: 20, proteinG: 10 }]);
  assert.deepEqual(toStoredItems(meals[0]!.items), [{ label: 'Bar', carbs_g: 20, protein_g: 10 }]);
});

test('bugünün öğünleri günün alımına girer; başka günün öğünü girmez', () => {
  const v = buildNutritionView(today, [{ local_date: today, weight_kg: 90 }], [], null, [
    { id: 'a', local_date: today, slot: 'lunch', items: [{ label: null, carbs_g: 100, protein_g: 30 }] },
    { id: 'b', local_date: '2026-10-30', slot: 'lunch', items: [{ label: null, carbs_g: 500, protein_g: 30 }] },
  ]);
  assert.equal(v.meals.length, 1);
  assert.equal(v.intake.carbsG, 100);
  assert.equal(v.intake.carbsPosition, 'below');
  assert.equal(v.intake.mealsAtProteinDose, 1);
});
