// Koç maliyet ölçümü (2026-10-09): aynı günler, farklı kaynak ayarları (daily.ts SourceOptions), Batch API ile (%50).
// Yanıtlar üretimdeki denetçiden (audit.ts) geçer; sonuç ve yan yana metinler repo dışına yazılır, çünkü gerçek gün
// kişisel sağlık verisi içerir (CLAUDE.md §2). Anahtar yalnız tools/coach-eval/.env.local'dan okunur (gitignore'lu),
// hiçbir yere yazılmaz.
//
//   node tools/coach-eval/run.ts                 → toplu isteği gönderir, bitmesini bekler, raporu yazar
//   node tools/coach-eval/run.ts --dry           → API'ye gitmeden istek sayısı ve tahmini maliyet
//   node tools/coach-eval/run.ts --resume <id>   → gönderilmiş bir toplu isteğin sonuçlarını okur
//
// Fiyatlar (Batch, Claude Sonnet 5.5): girdi 1 $ / MTok, çıktı 5 $ / MTok — platform.claude.com/docs/en/about-claude/pricing, 2026-10-09.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import Anthropic from '@anthropic-ai/sdk';

import { buildCoachSnapshot } from '../../apps/mobile/src/data/coach-snapshot.ts';
import { createDemoDb } from '../../apps/mobile/src/demo/demo-data.ts';
import { demoInputs } from '../../apps/mobile/src/demo/demo-inputs.ts';
import { auditResponse, type ResponseBlock } from '../../supabase/functions/_shared/coach/audit.ts';
import { buildRequest, type SourceOptions } from '../../supabase/functions/_shared/coach/daily.ts';
import { kbRules, kbSources } from '../../supabase/functions/_shared/coach/kb-data.ts';
import { parseSnapshot, type CoachSnapshot } from '../../supabase/functions/_shared/coach/snapshot.ts';
import { fullSnapshot } from '../../supabase/functions/tests/coach/fixtures.ts';

const root = new URL('../../', import.meta.url);
const privateDir = new URL('../private/data/', root);
const batchRates = { input: 1, output: 5 }; // $ / MTok
const trials = 2;

function apiKey(): string {
  const file = new URL('tools/coach-eval/.env.local', root);
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('ANTHROPIC_API_KEY='));
  const key = line?.slice('ANTHROPIC_API_KEY='.length).trim();
  if (!key?.startsWith('sk-ant-')) throw new Error('tools/coach-eval/.env.local içinde ANTHROPIC_API_KEY yok');
  return key;
}

const configs: Record<string, SourceOptions> = {
  hepsi: { selection: 'all' },
  dikkat: { selection: 'attention' },
  dikkat_tablosuz: { selection: 'attention', appNumbers: false },
};

function inputs(): Record<string, CoachSnapshot> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const demo = (s: 'yellow' | 'red') => buildCoachSnapshot(demoInputs(createDemoDb(s, today, now), today, now));
  const out: Record<string, CoachSnapshot> = { sentetik_tam: fullSnapshot(), demo_sari: demo('yellow'), demo_kirmizi: demo('red') };
  const realFile = new URL('coach-2026-10-09-ret.json', privateDir);
  if (existsSync(realFile)) {
    const parsed = parseSnapshot(JSON.parse(readFileSync(realFile, 'utf8')).snapshot);
    if (parsed.ok) out.gercek_0910 = parsed.snapshot;
  }
  return out;
}

const kb = { sources: kbSources, rules: kbRules };

function requests() {
  const list: { custom_id: string; params: Anthropic.Messages.MessageCreateParamsNonStreaming }[] = [];
  for (const [name, snapshot] of Object.entries(inputs())) {
    for (const [config, options] of Object.entries(configs)) {
      // Batch API sunucu taraflı yedeği (fallbacks) kabul etmez; ölçümde yedek yok, istek aksi halde üretimle aynı.
      const { betas: _betas, fallbacks: _fallbacks, ...params } = buildRequest(snapshot, kb, options).params as unknown as Record<string, unknown>;
      for (let t = 1; t <= trials; t++) {
        list.push({ custom_id: `${name}--${config}--${t}`, params: params as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming });
      }
    }
  }
  return list;
}

async function waitFor(client: Anthropic, id: string) {
  for (;;) {
    const batch = await client.messages.batches.retrieve(id);
    const c = batch.request_counts;
    console.log(`${new Date().toISOString().slice(11, 19)} ${batch.processing_status} · işleniyor ${c.processing}, tamam ${c.succeeded}, hata ${c.errored}`);
    if (batch.processing_status === 'ended') return;
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

async function report(client: Anthropic, id: string, outDir: URL) {
  const snaps = inputs();
  const rows: Record<string, unknown>[] = [];
  for await (const item of await client.messages.batches.results(id)) {
    const [name, config, trial] = item.custom_id.split('--') as [string, string, string];
    if (item.result.type !== 'succeeded') {
      rows.push({ name, config, trial, status: item.result.type });
      continue;
    }
    const message = item.result.message;
    const { layout } = buildRequest(snaps[name]!, kb, configs[config]!);
    const content = message.content.flatMap((b): ResponseBlock[] =>
      b.type === 'text' ? [{ type: 'text', text: b.text, citations: (b.citations ?? null) as ResponseBlock['citations'] }] : [],
    );
    const audit = auditResponse(content, layout);
    const u = message.usage;
    const cost = (u.input_tokens * batchRates.input + u.output_tokens * batchRates.output) / 1e6;
    rows.push({
      name,
      config,
      trial,
      status: message.stop_reason,
      sources: layout.length - 1,
      input: u.input_tokens,
      output: u.output_tokens,
      thinking: (u as { output_tokens_details?: { thinking_tokens?: number } }).output_tokens_details?.thinking_tokens ?? null,
      cost,
      ok: audit.ok,
      problems: audit.problems.map((p) => p.code),
      sentences: audit.sentences,
    });
  }
  rows.sort((a, b) => String(a.name).localeCompare(String(b.name)) || Object.keys(configs).indexOf(String(a.config)) - Object.keys(configs).indexOf(String(b.config)) || String(a.trial).localeCompare(String(b.trial)));
  writeFileSync(new URL('results.json', outDir), JSON.stringify(rows, null, 2));

  const lines: string[] = [`# Koç maliyet ölçümü — toplu istek ${id}`, '', '## Özet (yapılandırma başına, bütün günler)', '', '| Yapılandırma | Denetimden geçen | Ort. girdi | Ort. çıktı | Ort. maliyet (batch) | Aynı istek normal fiyatla |', '|---|---|---|---|---|---|'];
  for (const config of Object.keys(configs)) {
    const r = rows.filter((x) => x.config === config && typeof x.input === 'number') as { input: number; output: number; cost: number; ok: boolean }[];
    if (!r.length) continue;
    const avg = (f: (x: (typeof r)[number]) => number) => r.reduce((a, x) => a + f(x), 0) / r.length;
    lines.push(`| ${config} | ${r.filter((x) => x.ok).length}/${r.length} | ${Math.round(avg((x) => x.input))} | ${Math.round(avg((x) => x.output))} | ${avg((x) => x.cost).toFixed(3)} $ | ${(avg((x) => x.cost) * 2).toFixed(3)} $ |`);
  }
  lines.push('', '## Gün gün', '');
  for (const name of Object.keys(snaps)) {
    lines.push(`### ${name}`, '');
    for (const r of rows.filter((x) => x.name === name)) {
      lines.push(`#### ${r.config} · deneme ${r.trial} · ${r.ok ? 'geçti' : `REDDEDİLDİ (${(r.problems as string[]).join(', ')})`} · ${r.sources} kaynak · girdi ${r.input} · çıktı ${r.output}`, '');
      for (const s of (r.sentences as { text: string; numbers: string[]; sources: string[] }[]) ?? []) {
        lines.push(`- ${s.text}  \`${[...s.numbers, ...s.sources].join(', ') || 'alıntısız'}\``);
      }
      lines.push('');
    }
  }
  writeFileSync(new URL('rapor.md', outDir), lines.join('\n'));
  console.log(lines.slice(0, 9).join('\n'));
  console.log(`\nRapor: ${join(outDir.pathname.slice(1), 'rapor.md')}`);
}

async function main() {
  if (process.argv.includes('--dry')) {
    // Kuru çalıştırma: API'ye gitmez. Tahmin gerçek isteğin karakter / token oranıyla (100.544 / 60.414), kaba.
    const list = requests();
    const tokens = list.reduce((a, r) => a + JSON.stringify(r.params).length / (100544 / 60414), 0);
    const ids = [...new Set(list.map((r) => r.custom_id.split('--')[0]))];
    console.log(`${list.length} istek · günler: ${ids.join(', ')} · tahmini girdi ${Math.round(tokens)} token`);
    console.log(`tahmini maliyet (batch, çıktı istek başına ~2.600 token): ${((tokens * batchRates.input + list.length * 2600 * batchRates.output) / 1e6).toFixed(2)} $`);
    return;
  }
  const client = new Anthropic({ apiKey: apiKey(), maxRetries: 2 });
  const resume = process.argv.indexOf('--resume');
  let id: string;
  if (resume > 0) {
    id = process.argv[resume + 1]!;
  } else {
    const list = requests();
    const batch = await client.messages.batches.create({ requests: list });
    id = batch.id;
    console.log(`Toplu istek gönderildi: ${id} (${list.length} istek)`);
  }
  const outDir = new URL(`coach-eval/${id}/`, privateDir);
  mkdirSync(outDir, { recursive: true });
  await waitFor(client, id);
  await report(client, id, outDir);
}

await main();
