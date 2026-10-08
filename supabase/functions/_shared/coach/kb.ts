// Koçun kanıt tabanı ve kaynak seçimi (karar 0032). Vektör araması yok:
// - Günlük özet: motorun o gün kullandığı kuralların kaynakları (selectForRules).
// - Soru-cevap: tabanın tamamı (fullKb), istekte önbelleğe alınır.
// Veri kb-data.ts'te; tools/research/coach-kb.mjs research/'ten üretir.

export type SourceType =
  | 'consensus'
  | 'position-stand'
  | 'systematic-review'
  | 'meta-analysis'
  | 'rct'
  | 'cohort'
  | 'cross-sectional'
  | 'narrative-review'
  | 'expert-opinion';

export interface KbSource {
  id: string;
  title: string;
  authors: readonly string[];
  year: number;
  type: SourceType;
  doi?: string;
  pmid?: string;
  journal?: string;
  /** Çalışmanın kimler üzerinde yapıldığı. */
  population: string;
  /** Kendi özetimiz (markdown): ne söylüyor, kullanılan sayılar, sınırlılıklar. */
  summary: string;
}

export interface KbRule {
  id: string;
  module: string;
  description: string;
  appliesTo?: string;
  notes?: string;
  sources: readonly string[];
}

export interface Kb {
  sources: readonly KbSource[];
  rules: readonly KbRule[];
}

export interface KbSelection {
  rules: readonly KbRule[];
  sources: readonly KbSource[];
}

export class UnknownRuleError extends Error {
  readonly ruleIds: readonly string[];
  constructor(ruleIds: readonly string[]) {
    super(`Kanıt tabanında olmayan kural: ${ruleIds.join(', ')}`);
    this.name = 'UnknownRuleError';
    this.ruleIds = ruleIds;
  }
}

/**
 * Verilen kuralları ve onların kaynaklarını seçer. Kurallar verildiği sırayla, kaynaklar ilk geçtikleri
 * sırayla gelir; tekrarlar atılır. Tabanda olmayan kural kimliği hatadır: anlık değerler doğrulanırken
 * yakalanmış olmalıydı, sessizce düşürülmez.
 */
export function selectForRules(kb: Kb, ruleIds: readonly string[]): KbSelection {
  const ruleById = new Map(kb.rules.map((r) => [r.id, r]));
  const sourceById = new Map(kb.sources.map((s) => [s.id, s]));

  const unknown = [...new Set(ruleIds.filter((id) => !ruleById.has(id)))];
  if (unknown.length) throw new UnknownRuleError(unknown);

  const rules = [...new Set(ruleIds)].map((id) => ruleById.get(id)!);
  const sourceIds = [...new Set(rules.flatMap((r) => r.sources))];
  const sources = sourceIds.map((id) => {
    const source = sourceById.get(id);
    if (!source) throw new Error(`Kural kaynağı tabanda yok: ${id}`);
    return source;
  });
  return { rules, sources };
}

/** Soru-cevap için tabanın tamamı; sıra kimliğe göre sabit (önbellek öneki değişmesin). */
export function fullKb(kb: Kb): KbSelection {
  return { rules: kb.rules, sources: kb.sources };
}
