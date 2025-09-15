import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

async function waitForIncoming(page) {
  await expect.poll(async () => {
    const badge = await page.getByTestId('incoming-request-badge').count();
    if (badge > 0) return badge;
    const accept = await page.getByTestId('accept-request').count();
    const reject = await page.getByTestId('reject-request').count();
    return (accept > 0 && reject > 0) ? 1 : 0;
  }, { timeout: 20000 }).toBeGreaterThan(0);
}

test('Flusso rifiuto: richiesta rimossa e nessuna coppia', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Global setup già esegue eventuale clear-users

  await connectUser(pageA, 'RaffaE2E');
  await connectUser(pageB, 'LiaE2E');

  // A manda richiesta mirata per LiaE2E (almeno 1 altro utente)
  await expect.poll(async () => await pageA.locator('li[class*="p-3"]').count()).toBeGreaterThan(0);
  const liaRow = pageA.locator('li:has-text("LiaE2E")');
  await expect(liaRow).toBeVisible();
  await liaRow.getByTestId('send-request').click();
  await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });

  // B vede richiesta e rifiuta (attendi ciclo polling)
  await pageB.waitForTimeout(3000);
  await waitForIncoming(pageB);
  await pageB.getByTestId('reject-request').click();

  // A non deve più vedere "In attesa" entro timeout
  await expect(pageA.locator('text=In attesa')).not.toBeVisible({ timeout: 10000 });
});
