#!/usr/bin/env node
// ../private klasörünü yapılandırılmış yedek hedefine kopyalar (yalnız yeni veya değişmiş dosyalar).
//
// Hedef, repo dışındaki ../private/backup-target.txt dosyasının ilk satırından okunur
// (ör. G:\Drive'ım\HoopLab-yedek\private) veya HOOPLAB_BACKUP_DIR ortam değişkeninden.
//
// Bilinçli olarak AYNA DEĞİL, eklemeli kopya: kaynakta silinen dosya yedekte kalır. Böylece private
// klasörü yanlışlıkla silinirse yedek de silinmez. Dosya adları çıktıya yazılmaz (yalnız sayılar).
//
// Kullanım: node tools/backup/backup-private.mjs [--quiet]
// Çıkış: 0 (yedek alındı veya yapılandırılmamış) · 1 (hedefe yazılamadı)

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Bazı dosya sistemleri (ör. Google Drive) zaman damgasını kaba hassasiyetle saklar:
// ölçüldü, Drive milisaniye altını atıyor. Aynı boyutta ve 2 saniye içindeki dosya güncel sayılır.
const MTIME_TOLERANCE_MS = 2000;

/** src altındaki her dosyayı, dest'te yoksa veya src daha yeniyse kopyalar. */
export function copyNewer(src, dest) {
  let copied = 0;
  let skipped = 0;
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) {
      const r = copyNewer(from, to);
      copied += r.copied;
      skipped += r.skipped;
    } else if (st.isFile()) {
      if (existsSync(to)) {
        const dt = statSync(to);
        if (dt.size === st.size && dt.mtimeMs >= st.mtimeMs - MTIME_TOLERANCE_MS) {
          skipped++;
          continue;
        }
      }
      copyFileSync(from, to);
      copied++;
    }
  }
  return { copied, skipped };
}

export function resolveTarget(privateDir, env = process.env) {
  if (env.HOOPLAB_BACKUP_DIR) return env.HOOPLAB_BACKUP_DIR;
  const cfg = path.join(privateDir, 'backup-target.txt');
  if (!existsSync(cfg)) return null;
  const line = readFileSync(cfg, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith('#'));
  return line ?? null;
}

function main() {
  const quiet = process.argv.includes('--quiet');
  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const privateDir = path.resolve(root, '..', 'private');
  if (!existsSync(privateDir)) {
    if (!quiet) console.log('[yedek] ../private yok; atlandı.');
    return 0;
  }
  const target = resolveTarget(privateDir);
  if (!target) {
    if (!quiet) console.log('[yedek] hedef yapılandırılmamış (../private/backup-target.txt); atlandı.');
    return 0;
  }
  // Hedefin üst klasörü yoksa (ör. Drive bağlı değil) yeni bir klasör ağacı yaratma: hata ver
  if (!existsSync(path.dirname(path.resolve(target)))) {
    console.error('[yedek] hedefin üst klasörü bulunamadı (Drive bağlı mı?); yedek ALINAMADI.');
    return 1;
  }
  const { copied, skipped } = copyNewer(privateDir, target);
  if (!quiet || copied) console.log(`[yedek] tamam: ${copied} dosya kopyalandı, ${skipped} dosya zaten güncel.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`[yedek] HATA, yedek alınamadı: ${err.message}`);
    process.exit(1);
  }
}
