#!/usr/bin/env node
// Claude Code PreCompact / SessionEnd hook'u: oturum dökümünü (transcript JSONL) repo DIŞINDAKİ
// ../private/transcripts/ klasörüne kopyalar. Döküm kişisel veri içerebilir; repoya asla girmez.
// Aynı oturum için tek dosya tutulur ve her çağrıda en güncel haliyle üzerine yazılır.
// Kural: bu script oturumu ASLA bozmaz. Her hatada sessizce çıkar (çıkış 0).

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const event = process.argv[2] ?? 'bilinmiyor';

function readStdin() {
  try {
    // BOM'u at: bazı kabuklar (ör. Windows PowerShell) boruya BOM ekler ve JSON.parse kırılır
    return JSON.parse(readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}');
  } catch {
    return {};
  }
}

function localDate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

try {
  const input = readStdin();
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd;
  const transcript = input.transcript_path;
  const sessionId = String(input.session_id ?? '').replace(/[^A-Za-z0-9_-]/g, '');
  const privateDir = root ? path.resolve(root, '..', 'private') : null;

  // private klasörü yoksa (ör. bulut oturumu, başka makinede klon) hiçbir şey yapma
  if (privateDir && existsSync(privateDir) && transcript && existsSync(transcript) && sessionId) {
    const dest = path.join(privateDir, 'transcripts');
    mkdirSync(dest, { recursive: true });
    const existing = readdirSync(dest).find((f) => f.endsWith(`-${sessionId}.jsonl`));
    const target = path.join(dest, existing ?? `${localDate()}-${sessionId}.jsonl`);
    copyFileSync(transcript, target);

    if (event === 'precompact') {
      process.stdout.write(
        JSON.stringify({
          systemMessage:
            'Döküm private/transcripts klasörüne arşivlendi. Oturum uzadı: compact yerine /kapat, yeni oturum ve /ac önerilir.',
        }),
      );
    }
  }
} catch {
  // sessiz: arşivleme başarısız olsa da oturum devam eder
}
process.exit(0);
