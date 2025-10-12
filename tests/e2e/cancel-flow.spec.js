import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

test('Flusso cancellazione: A annulla richiesta prima che B risponda', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await connectUser(pageA, 'MikiE2E');
  await connectUser(pageB, 'ValeE2E');

  // A manda richiesta
  await pageA.getByRole('button', { name: /richiedi/i }).first().click();
  await expect(pageA.locator('text=In attesa')).toBeVisible();

  // A annulla prima che B accetti/rifiuti
  await pageA.getByRole('button', { name: /annulla/i }).click();
  await expect(pageA.locator('text=In attesa')).not.toBeVisible({ timeout: 10000 });

  // B non dovrebbe più vedere "Richiesta per te" (può sparire dopo breve polling)
  await expect(pageB.locator('text=Richiesta per te')).not.toBeVisible({ timeout: 10000 });
});
