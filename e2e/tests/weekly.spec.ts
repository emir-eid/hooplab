// Haftalık rapor ve PDF paylaşımı (karar 0040, 0051): rapor açılır, kapatılan bölüm PDF'e girmez.
// Web'de PDF tarayıcının yazdırma penceresiyle verilir; test yazdırmayı yakalayıp HTML'e bakar.

import { expect, openTab, test } from './demo';

test("haftalık rapor PDF'i yalnız seçilen bölümlerle hazırlanır", async ({ demo: page }) => {
  // Yazdırma penceresi açılmasın: çerçevenin print'i yakalanır, HTML saklanır.
  await page.evaluate(() => {
    const d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow')!;
    const printed: string[] = [];
    (window as unknown as { __printed: string[] }).__printed = printed;
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      configurable: true,
      get(this: HTMLIFrameElement) {
        const w = d.get!.call(this) as (Window & { __patched?: boolean }) | null;
        if (w && !w.__patched) {
          w.__patched = true;
          w.print = () => printed.push(this.srcdoc);
        }
        return w;
      },
    });
  });

  await openTab(page, 'Trend');
  await page.getByRole('button', { name: /^Haftalık rapor,/ }).click();
  await expect(page.getByRole('heading', { name: 'Haftalık rapor', level: 1, exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'PDF olarak paylaş' }).click();
  await page.getByRole('switch', { name: 'Sabah kilosu' }).click();
  await page.getByRole('button', { name: 'PDF hazırla ve paylaş' }).click();

  await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: string[] }).__printed.length)).toBe(1);
  const html = await page.evaluate(() => (window as unknown as { __printed: string[] }).__printed[0]!);
  expect(html).toContain('<h2>Antrenman yükü</h2>');
  expect(html).not.toContain('<h2>Sabah kilosu</h2>');
});

test('haftalık koç yorumu demoda istek üzerine yazılır, dayanaklar açılır', async ({ demo: page }) => {
  await openTab(page, 'Trend');
  await page.getByRole('button', { name: /^Haftalık rapor,/ }).click();
  await page.getByText('Koç yorumu yaz', { exact: true }).click();
  await expect(page.getByText(/^Bu hafta \d+ gün/)).toBeVisible();
  await page.getByRole('button', { name: 'Dayanak 1' }).click();
  await expect(page.getByRole('heading', { name: 'Dayanaklar' })).toBeVisible();
  await expect(page.getByText('Haftanın sayıları').first()).toBeVisible();
});
