import assert from 'node:assert/strict';
import { test } from 'node:test';

import { painEntries, painMapFromRows, painOf, regionMax, setPain } from './pain-map.ts';

const leftAchilles = { region: 'achilles', side: 'left' } as const;
const rightAchilles = { region: 'achilles', side: 'right' } as const;
const back = { region: 'lower_back', side: 'center' } as const;

test('0 değeri kaydı siler, ölçek dışı değer yazılmaz', () => {
  let map = setPain({}, leftAchilles, 3);
  assert.equal(painOf(map, leftAchilles), 3);
  map = setPain(map, leftAchilles, 0);
  assert.deepEqual(map, {});
  assert.deepEqual(setPain({}, leftAchilles, 11), {});
  assert.deepEqual(setPain({}, leftAchilles, 2.5), {});
});

test('rozet bölgenin en yüksek tarafını gösterir', () => {
  const map = setPain(setPain({}, leftAchilles, 2), rightAchilles, 6);
  assert.equal(regionMax(map, 'achilles'), 6);
  assert.equal(regionMax(map, 'calf'), 0);
});

test('veritabanı listesi bölge sırasıyla, yalnız ağrılı noktalar', () => {
  const map = setPain(setPain({}, back, 4), rightAchilles, 2);
  assert.deepEqual(painEntries(map), [
    { region: 'achilles', side: 'right', pain: 2 },
    { region: 'lower_back', side: 'center', pain: 4 },
  ]);
});

test('satırlardan harita; tanınmayan satır atlanır', () => {
  const map = painMapFromRows([
    { region: 'achilles', side: 'left', pain: 3 },
    { region: 'knee', side: 'left', pain: 5 },
    { region: 'lower_back', side: 'left', pain: 5 },
  ]);
  assert.deepEqual(painEntries(map), [{ region: 'achilles', side: 'left', pain: 3 }]);
});
