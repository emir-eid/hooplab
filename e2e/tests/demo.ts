// Ortak düzen: demo modunu açar ve sayfadaki her JS hatasını toplar; test sonunda hata varsa test kırılır.
// Demo bellekte yaşar: sayfa yenilenirse (page.goto) kapanır, bu yüzden gezinti yalnız tıklamayla yapılır.

import { expect, test as base, type Page } from '@playwright/test';

export const test = base.extend<{ demo: Page }>({
  demo: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    await page.goto('/');
    await page.getByText('Demoyu aç').click();
    await expect(page.getByRole('heading', { name: 'Bugün', level: 1, exact: true })).toBeVisible();
    await use(page);
    expect(errors, 'sayfada JS hatası olmamalı').toEqual([]);
  },
});

export { expect };

export async function openTab(page: Page, name: 'Bugün' | 'Vücut' | 'Trend' | 'Koç' | 'Ben') {
  await page.getByRole('tab', { name, exact: true }).click();
}
