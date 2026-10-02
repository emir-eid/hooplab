import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { copyNewer, resolveTarget } from './backup-private.mjs';

function setup() {
  const base = mkdtempSync(path.join(tmpdir(), 'hooplab-yedek-'));
  const src = path.join(base, 'private');
  const dest = path.join(base, 'yedek', 'private');
  mkdirSync(path.join(src, 'journal'), { recursive: true });
  writeFileSync(path.join(src, 'journal', 'a.md'), 'bir');
  writeFileSync(path.join(src, 'b.txt'), 'iki');
  return { base, src, dest };
}

test('ilk yedek her şeyi kopyalar, ikincisi hiçbir şeyi', () => {
  const { base, src, dest } = setup();
  try {
    assert.deepEqual(copyNewer(src, dest), { copied: 2, skipped: 0 });
    assert.equal(readFileSync(path.join(dest, 'journal', 'a.md'), 'utf8'), 'bir');
    assert.deepEqual(copyNewer(src, dest), { copied: 0, skipped: 2 });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('değişen dosya yeniden kopyalanır', () => {
  const { base, src, dest } = setup();
  try {
    copyNewer(src, dest);
    const f = path.join(src, 'b.txt');
    writeFileSync(f, 'iki, güncellendi');
    const future = new Date(Date.now() + 5000);
    utimesSync(f, future, future);
    assert.equal(copyNewer(src, dest).copied, 1);
    assert.equal(readFileSync(path.join(dest, 'b.txt'), 'utf8'), 'iki, güncellendi');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('zaman damgasını kaba saklayan hedefte (Drive) aynı dosya tekrar kopyalanmaz', () => {
  const { base, src, dest } = setup();
  try {
    copyNewer(src, dest);
    // Drive davranışını taklit et: yedeğin zaman damgası kaynaktan birkaç yüz ms geride
    for (const rel of ['b.txt', path.join('journal', 'a.md')]) {
      const s = path.join(src, rel);
      const t = new Date(Date.now() - 60_000);
      utimesSync(s, t, t);
      const older = new Date(t.getTime() - 400);
      utimesSync(path.join(dest, rel), older, older);
    }
    assert.equal(copyNewer(src, dest).copied, 0);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('kaynakta silinen dosya yedekte KALIR (ayna değil, eklemeli)', () => {
  const { base, src, dest } = setup();
  try {
    copyNewer(src, dest);
    rmSync(path.join(src, 'b.txt'));
    copyNewer(src, dest);
    assert.ok(existsSync(path.join(dest, 'b.txt')));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('hedef: ortam değişkeni, sonra yapılandırma dosyası (BOM ve yorum toleranslı)', () => {
  const { base, src } = setup();
  try {
    assert.equal(resolveTarget(src, {}), null);
    writeFileSync(path.join(src, 'backup-target.txt'), '\uFEFF# yorum\nD:\\Yedek\\private\n');
    assert.equal(resolveTarget(src, {}), 'D:\\Yedek\\private');
    assert.equal(resolveTarget(src, { HOOPLAB_BACKUP_DIR: 'X:\\baska' }), 'X:\\baska');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
