import { expect } from '@playwright/test';

export async function connectUser(page, name) {
  await page.goto('/');
  await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', name);
  // Trova un bottone plausibile per entrare
  const btn = page.getByRole('button', { name: /entra|connect|collega|inizia|start/i }).first();
  if (await btn.count()) {
    await btn.click();
  } else {
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('text=online').first()).toBeVisible({ timeout: 10000 });
}

export async function waitForRequestTag(page) {
  await expect(page.locator('text=Richiesta per te')).toBeVisible({ timeout: 10000 });
}
