#!/usr/bin/env node
// Claude Code SessionStart hook'u: docs/STATE.md içindeki özet bloğunu ve kısa git/otomasyon durumunu
// oturum bağlamına ekler. /ac unutulsa bile oturum nerede kaldığımızı bilir.
// Kural: bu script oturumu ASLA bozmaz. Her hatada sessizce çıkar (çıkış 0).

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

const out = [];

const state = safe(() => readFileSync(path.join(root, 'docs', 'STATE.md'), 'utf8'));
if (state) {
  const m = state.match(/<!-- ozet:basla -->([\s\S]*?)<!-- ozet:bitti -->/);
  out.push('# HoopLab oturum bağlamı (otomatik, SessionStart hook)');
  out.push(m ? m[1].trim() : state.split(/\r?\n/).slice(0, 40).join('\n'));
}

const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const branch = safe(() => git(['status', '-sb']).split('\n')[0]);
const dirty = safe(() => git(['status', '--porcelain']).split('\n').filter(Boolean).length, 0);
if (branch) out.push(`\nGit: ${branch}${dirty ? ` · ${dirty} commit edilmemiş değişiklik` : ''}`);

const latest = (dir, filter) =>
  safe(() => readdirSync(path.join(root, dir)).filter(filter).sort().at(-1) ?? null);
const lastSession = latest('docs/sessions', (f) => /^\d{4}-\d{2}-\d{2}/.test(f));
const lastAudit = latest('docs/audits', (f) => /^\d{4}-\d{2}-\d{2}/.test(f));
if (lastAudit && (!lastSession || lastAudit.slice(0, 10) >= lastSession.slice(0, 10))) {
  out.push(`Yeni denetim raporu var: docs/audits/${lastAudit}`);
}

const pendingInbox = safe(
  () =>
    readdirSync(path.join(root, 'research', 'inbox'))
      .filter((f) => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f))
      .filter((f) => /durum:\s*bekliyor/i.test(readFileSync(path.join(root, 'research', 'inbox', f), 'utf8'))).length,
  0,
);
if (pendingInbox) out.push(`Bekleyen literatür önerisi: ${pendingInbox} dosya (research/inbox)`);

if (!existsSync(path.resolve(root, '..', 'private'))) out.push('UYARI: ../private klasörü yok; kişisel veri yazılacak yer eksik.');

out.push('\nTam açılış için kullanıcı /ac yazar. Oturum sonunda /kapat.');
process.stdout.write(out.join('\n') + '\n');
