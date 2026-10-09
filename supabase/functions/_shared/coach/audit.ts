// Koç yanıtının denetçisi (karar 0032): model yanıtı kullanıcıya gösterilmeden önce burada geçer.
// Saf fonksiyon; ağ ve veritabanı yok. Denetimden geçmeyen yanıt gösterilmez, yerine motorun açıklama
// metinleri çıkar ve olay kayda geçer (coach_summaries.audit).
//
// Kurallar (cümle cümle):
//   1. Rakam içeren cümle "günün sayıları" belgesinden alıntı yapmalı; cümledeki her sayı alıntılanan
//      bloklarda geçmeli. Sayı uydurulamaz, yuvarlanamaz, kaynaktan alınamaz.
//   2. Öneri veya yorum cümlesi en az bir kaynak belgesine alıntı yapmalı.
//   3. Alıntısız cümleye yalnız kısa bir geçiş cümlesi olarak izin verilir (rakam yok, öneri / yorum sözü yok).
//   4. Tahmin bloğuna dayanan cümlede (ya da hemen önceki cümlede) "tahmin" sözü geçmeli.
//   5. Türkçe metinde "â" yok (CLAUDE.md §6).
//
// Öneri / yorum ayrımı dil kurallarına dayanır ve ilk sürümde katıdır: şüpheli cümle kaynak ister.
// Bilinen boşluklar: yazıyla yazılmış sayılar ("yedi saat") ve listede olmayan emir kipleri yakalanmaz;
// sayının yönü (artış / düşüş) denetlenmez, yalnız değeri. Gerçek yanıtlarla gevşetilir veya sıkılaştırılır.

import type { DocumentEntry, NumbersBlock } from './documents.ts';

/** Messages API yanıtındaki içerik bloğunun denetçinin okuduğu kısmı (SDK'nın TextBlock'uyla uyumlu). */
export interface ResponseCitation {
  type: string;
  document_index: number;
  cited_text?: string;
  start_block_index?: number;
  end_block_index?: number;
}

export interface ResponseBlock {
  type: string;
  text?: string;
  citations?: readonly ResponseCitation[] | null;
}

export type AuditProblemCode =
  | 'empty'
  | 'invalid_citation'
  | 'number_uncited'
  | 'number_mismatch'
  | 'advice_without_source'
  | 'uncited_sentence'
  | 'estimate_unlabeled'
  | 'forbidden_text';

export interface AuditProblem {
  code: AuditProblemCode;
  /** Sorunlu cümlenin sırası; yanıt düzeyindeki sorunda null. */
  sentence: number | null;
  detail?: string;
}

export interface AuditSentence {
  text: string;
  /** Alıntılanan günün sayıları blokları (blok kimliği). */
  numbers: string[];
  /** Alıntılanan kaynaklar (kaynak kimliği). */
  sources: string[];
}

export interface AuditResult {
  ok: boolean;
  sentences: AuditSentence[];
  problems: AuditProblem[];
}

export const auditOptions = {
  /** Alıntısız geçiş cümlesinin en fazla kelime sayısı. Bilimsel eşik değil, denetçi ayarı. */
  maxTransitionWords: 8,
};

// --- Sayılar ---

const numberToken = /\d+(?:[.,]\d+)*/g;

/**
 * Bir sayı yazımının olası değerleri. Türkçede "1.250" binlik ayırıcı, "1,5" ondalıktır; ama model "1.5" de
 * yazabilir. İkisi de aday sayılır; karşılaştırmada ortak aday yeterli. İşaret yok sayılır (yön denetlenmez).
 */
export function numberCandidates(token: string): number[] {
  const out = new Set<number>();
  if (/^\d+$/.test(token)) out.add(Number(token));
  if (/^\d{1,3}(?:\.\d{3})+$/.test(token)) out.add(Number(token.replaceAll('.', '')));
  if (/^\d+[.,]\d+$/.test(token)) out.add(Number(token.replace(',', '.')));
  if (/^\d{1,3}(?:\.\d{3})+,\d+$/.test(token)) out.add(Number(token.replaceAll('.', '').replace(',', '.')));
  return [...out].filter(Number.isFinite);
}

export function extractNumbers(text: string): string[] {
  return text.match(numberToken) ?? [];
}

function blockValues(blocks: readonly NumbersBlock[]): Set<number> {
  return new Set(blocks.flatMap((b) => extractNumbers(b.text).flatMap(numberCandidates)));
}

// --- Öneri ve yorum ---

const trLower = (s: string) => s.toLocaleLowerCase('tr');

/** Öneri ya da yorum bildiren kökler (kelime başında aranır). */
const adviceStems = [
  'öner',
  'tavsiye',
  'dikkat',
  'kaçın',
  'sınırla',
  'hafiflet',
  'ertele',
  'planla',
  'tercih',
  'faydalı',
  'yararlı',
  'iyi olur',
  'gerek',
  'lazım',
  'önemli',
  'uygun',
  'hedefle',
  'tüket',
  'göster',
  // "işaret ediyor" yorumdur; "işaretlenmedi" değil (2026-10-09 ilk gerçek yanıt).
  'işaret ed',
  'anlam',
  'demek',
  'çünkü',
  'nedeniyle',
  'yüzünden',
  'muhtemel',
  'olası',
];

/** Cümle sonundaki emir kipi (Türkçede yüklem sondadır). Yalın, kibar (-in) ve olumsuz (-ma) biçimler. */
const imperativeVerbs = [
  'al',
  'artır',
  'atla',
  'azalt',
  'bekle',
  'bırak',
  'başla',
  'danış',
  'dene',
  'dinlen',
  'dur',
  'düşür',
  'ekle',
  'esne',
  'git',
  'iç',
  'izle',
  'kaçın',
  'koru',
  'koş',
  'sor',
  'tamamla',
  'tut',
  'unut',
  'uyu',
  'ver',
  'yap',
  'yat',
  'ye',
  'yürü',
  'çalış',
  'ısın',
];
const politeSuffixes = ['in', 'ın', 'un', 'ün', 'yin', 'yın', 'yun', 'yün', 'iniz', 'ınız', 'unuz', 'ünüz', 'yiniz', 'yınız', 'yunuz', 'yünüz'];
const imperativeForms = new Set(
  imperativeVerbs.flatMap((v) => {
    const negatives = [`${v}ma`, `${v}me`];
    return [v, ...negatives, ...[v, ...negatives].flatMap((base) => politeSuffixes.map((s) => base + s))];
  }),
);

/** -meli / -malı (gereklilik) ve -ebilir / -abilir (olasılık) ekleri. */
const modalSuffix = /\p{L}m[ae]l[ıi](?:s[ıi]n(?:[ıi]z)?|y[ıi]z|d[ıi]r)?(?!\p{L})/u;
const abilitySuffix = /\p{L}[ae]bil(?:ir|irsin|irsiniz|iriz)(?!\p{L})/u;

export function isAdviceOrInterpretation(sentence: string): boolean {
  const s = trLower(sentence);
  if (adviceStems.some((stem) => new RegExp(`(?<!\\p{L})${stem}`, 'u').test(s))) return true;
  if (modalSuffix.test(s) || abilitySuffix.test(s)) return true;
  const words = s.match(/\p{L}+/gu) ?? [];
  const last = words.at(-1);
  return last !== undefined && imperativeForms.has(last);
}

// --- Alıntılar ---

/** Günün sayıları belgesine geçerli alıntının kapsadığı bloklar; geçersizse null (blok aralığı, uç hariç). */
function citedBlocks(c: ResponseCitation, entry: Extract<DocumentEntry, { kind: 'numbers' }>): readonly NumbersBlock[] | null {
  const { start_block_index: start, end_block_index: end } = c;
  if (c.type !== 'content_block_location' || !Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start! < 0 || start! >= end! || end! > entry.blocks.length) return null;
  return entry.blocks.slice(start, end);
}

// --- Cümleler ---

interface Segment {
  start: number;
  end: number;
  citations: readonly ResponseCitation[];
}

interface Sentence {
  start: number;
  end: number;
  text: string;
}

/** Cümle sonu: nokta / soru / ünlem / üç nokta ardından boşluk ya da metin sonu; ya da satır sonu. */
function splitSentences(full: string): Sentence[] {
  const out: Sentence[] = [];
  const boundary = /[.!?…]+(?=\s|$)|\n+/g;
  let start = 0;
  const push = (end: number) => {
    const raw = full.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim().replace(/^[-*•]\s+/, '');
    if (/\p{L}|\d/u.test(text)) out.push({ start: start + lead, end, text });
  };
  for (const m of full.matchAll(boundary)) {
    const end = m.index + (m[0].startsWith('\n') ? 0 : m[0].length);
    push(end);
    start = m.index + m[0].length;
  }
  push(full.length);
  return out;
}

/** Yanıtı denetler. `layout`: istekteki belgelerin sırası (documents.ts dailyDocuments). */
export function auditResponse(content: readonly ResponseBlock[], layout: readonly DocumentEntry[]): AuditResult {
  const problems: AuditProblem[] = [];

  let full = '';
  const segments: Segment[] = [];
  for (const block of content) {
    if (block.type !== 'text' || typeof block.text !== 'string') continue;
    const citations = block.citations ?? [];
    for (const c of citations) {
      const entry = layout[c.document_index];
      if (!entry) {
        problems.push({ code: 'invalid_citation', sentence: null, detail: `belge ${c.document_index} yok` });
      } else if (entry.kind === 'numbers' && !citedBlocks(c, entry)) {
        problems.push({ code: 'invalid_citation', sentence: null, detail: `günün sayıları: ${c.type} ${c.start_block_index}-${c.end_block_index}` });
      }
    }
    segments.push({ start: full.length, end: full.length + block.text.length, citations });
    full += block.text;
  }

  const sentences = splitSentences(full);
  if (sentences.length === 0) problems.push({ code: 'empty', sentence: null });

  // Metni boş (ya da harf ve rakam içermeyen) alıntılı parça önündeki cümleye aittir: Sonnet 5.5 cümleyi alıntısız
  // yazıp alıntıları hemen ardından boş metinli ayrı bir blokta verebiliyor (LESSONS, 2026-10-09 ilk gerçek çağrı).
  const anchored = new Map<number, ResponseCitation[]>();
  for (const seg of segments) {
    if (seg.citations.length === 0 || /[\p{L}\d]/u.test(full.slice(seg.start, seg.end))) continue;
    let owner = 0;
    sentences.forEach((s, i) => {
      if (s.start < seg.start) owner = i;
    });
    anchored.set(owner, [...(anchored.get(owner) ?? []), ...seg.citations]);
  }

  const audited: AuditSentence[] = [];
  const estimateCited: boolean[] = [];
  sentences.forEach((sentence, i) => {
    // Parça cümleyle yalnız harf ya da rakam paylaşıyorsa sayılır: sonraki alıntılı parçanın başındaki nokta
    // önceki cümleye o parçanın alıntısını taşımasın.
    const citations = [
      ...segments
        .filter((seg) => seg.start < sentence.end && seg.end > sentence.start && /[\p{L}\d]/u.test(full.slice(Math.max(seg.start, sentence.start), Math.min(seg.end, sentence.end))))
        .flatMap((seg) => seg.citations),
      ...(anchored.get(i) ?? []),
    ];

    const numberBlocks: NumbersBlock[] = [];
    const sourceIds: string[] = [];
    for (const c of citations) {
      const entry = layout[c.document_index];
      if (entry?.kind === 'numbers') {
        numberBlocks.push(...(citedBlocks(c, entry) ?? []));
      } else if (entry?.kind === 'source') {
        sourceIds.push(entry.sourceId);
      }
    }
    const numbers = [...new Set(numberBlocks)];
    audited.push({ text: sentence.text, numbers: numbers.map((b) => b.id), sources: [...new Set(sourceIds)] });
    estimateCited.push(numbers.some((b) => b.estimate));

    if (/[âÂ]/u.test(sentence.text)) problems.push({ code: 'forbidden_text', sentence: i, detail: 'â' });

    const tokens = extractNumbers(sentence.text);
    if (tokens.length) {
      if (numbers.length === 0) {
        problems.push({ code: 'number_uncited', sentence: i, detail: tokens.join(', ') });
      } else {
        const allowed = blockValues(numbers);
        const missing = tokens.filter((t) => !numberCandidates(t).some((v) => allowed.has(v)));
        if (missing.length) problems.push({ code: 'number_mismatch', sentence: i, detail: missing.join(', ') });
      }
    }

    const advice = isAdviceOrInterpretation(sentence.text);
    if (advice && sourceIds.length === 0) problems.push({ code: 'advice_without_source', sentence: i });

    const words = sentence.text.split(/\s+/).filter(Boolean).length;
    if (citations.length === 0 && !tokens.length && !advice && words > auditOptions.maxTransitionWords) {
      problems.push({ code: 'uncited_sentence', sentence: i });
    }
  });

  sentences.forEach((sentence, i) => {
    if (!estimateCited[i]) return;
    const near = [sentence.text, sentences[i - 1]?.text ?? ''].some((t) => /tahmin/iu.test(t));
    if (!near) problems.push({ code: 'estimate_unlabeled', sentence: i });
  });

  problems.sort((a, b) => (a.sentence ?? -1) - (b.sentence ?? -1));
  return { ok: problems.length === 0, sentences: audited, problems };
}
