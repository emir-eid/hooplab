// Kullanıcının yazdığı ondalık sayı: "80,4" ve "80.4" aynı. Boş veya geçersizse null; uydurma değer üretilmez.

export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 80.4 → "80,4"; tam sayıda ondalık yazılmaz ("80"). */
export function formatDecimalInput(value: number, digits = 1): string {
  const fixed = value.toFixed(digits).replace(/\.?0+$/, '');
  return fixed.replace('.', ',');
}
