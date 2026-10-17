// Duman testi: demo açılır, her sekme hatasız kurulur, ana içerik görünür.

import { expect, openTab, test } from './demo';

test('Bugün: günün durumu, beslenme ve gece verisi', async ({ demo: page }) => {
  await expect(page.getByText('Demo sporcu · sentetik veri')).toBeVisible();
  await expect(page.getByText('Bugünün durumu')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Beslenme · bugün' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gece verisi' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saatten gelenler' })).toBeVisible();
});

test("sekmeler sırayla açılır ve Bugün'e dönülür", async ({ demo: page }) => {
  await openTab(page, 'Vücut');
  await expect(page.getByRole('heading', { name: 'Vücut', level: 1, exact: true })).toBeVisible();
  await openTab(page, 'Trend');
  await expect(page.getByRole('heading', { name: 'Trend', level: 1, exact: true })).toBeVisible();
  await openTab(page, 'Koç');
  await expect(page.getByRole('heading', { name: 'Koç', level: 1, exact: true })).toBeVisible();
  await openTab(page, 'Ben');
  await expect(page.getByRole('heading', { name: 'Ben', level: 1, exact: true })).toBeVisible();
  await openTab(page, 'Bugün');
  await expect(page.getByText('Bugünün durumu')).toBeVisible();
});
