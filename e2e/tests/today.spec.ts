// Bugün akışları: demo günü değiştirme, su kaydı (kayıttan sonra ekran yenilenir, karar 0048),
// sabah check-in.

import { expect, openTab, test } from './demo';

test('demo günü değişince günün durumu değişir', async ({ demo: page }) => {
  const days = page.getByRole('radiogroup', { name: 'Demo günü' });
  for (const level of ['Hazır', 'Toparlan', 'Kontrollü'] as const) {
    await days.getByRole('radio', { name: level, exact: true }).click();
    await expect(page.getByRole('heading', { name: level, level: 1, exact: true })).toBeVisible();
  }
});

test("su kaydı Bugün'deki halkaya yansır, sekme dönüşünde kaybolmaz", async ({ demo: page }) => {
  const ring = page.getByRole('button', { name: /^Su [\d,]+ litre/ });
  const before = await litres(ring);

  await page.getByRole('button', { name: 'Su ekle' }).click();
  await page.getByRole('button', { name: '500 mililitre ekle' }).click();
  await page.getByRole('button', { name: 'Kapat' }).click();
  await expect(ring).toHaveAccessibleName(new RegExp(`^Su ${format(before + 0.5)} litre`));

  // Sekme dönüşü veriyi yeniden çekmez ama değeri de kaybetmez.
  await openTab(page, 'Trend');
  await openTab(page, 'Bugün');
  await expect(ring).toHaveAccessibleName(new RegExp(`^Su ${format(before + 0.5)} litre`));
});

test("sabah check-in kaydedilince Bugün'de toplam görünür", async ({ demo: page }) => {
  await page.getByRole('button', { name: /^Sabah check-in, yaklaşık/ }).click();
  await expect(page.getByRole('heading', { name: 'Sabah check-in', level: 1, exact: true })).toBeVisible();
  const save = page.getByRole('button', { name: 'Kaydet' });
  await expect(save).toBeDisabled();

  for (const item of ['Uyku kalitesi', 'Yorgunluk', 'Kas ağrısı', 'Stres', 'Ruh hali']) {
    await page.getByRole('radiogroup', { name: item }).getByRole('radio', { name: /^4/ }).click();
  }
  await expect(save).toBeEnabled();
  await save.click();

  // Form kapanır; çağrı düğmesi yerine kart gelir.
  await expect(page.getByRole('button', { name: /^Sabah check-in, yaklaşık/ })).toHaveCount(0);
  await expect(page.getByText('/ 25', { exact: true })).toBeVisible();
});

async function litres(ring: import('@playwright/test').Locator): Promise<number> {
  const name = (await ring.getAttribute('aria-label')) ?? '';
  const m = /^Su ([\d,]+) litre/.exec(name);
  if (!m) throw new Error(`su halkası okunamadı: ${name}`);
  return Number(m[1].replace(',', '.'));
}

function format(l: number): string {
  return l.toFixed(1).replace('.', ',');
}
