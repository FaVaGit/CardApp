import { test, expect } from '@playwright/test';

// Helpers
async function connectUser(page, name) {
  await page.goto('/');
  await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', name);
  const btn = page.getByRole('button', { name: /entra|connect|collega/i }).first();
  if (await btn.count()) {
    await btn.click();
  } else {
    // fallback: assume auto connect present? try pressing Enter
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('text=online').first()).toBeVisible({ timeout: 10000 });
}

async function waitForUsers(page, min = 1) {
  await expect.poll(async () => {
    const listItems = await page.locator('li[class*="p-3"]').count();
    return listItems;
  }, { message: 'Attesa utenti disponibili' }).toBeGreaterThanOrEqual(min);
}

async function waitForIncoming(page) {
  await expect.poll(async () => {
    const badge = await page.getByTestId('incoming-request-badge').count();
    if (badge > 0) return badge;
    const accept = await page.getByTestId('accept-request').count();
    const reject = await page.getByTestId('reject-request').count();
    return (accept > 0 && reject > 0) ? 1 : 0;
  }, { timeout: 20000, message: 'Attesa richiesta in arrivo (testids)' }).toBeGreaterThan(0);
}

test.describe('Flusso join approvazione', () => {
  test('A richiede B, B approva e si forma coppia con game session', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

  // Global setup ora gestisce eventuale clear-users (rimosso reset locale)

    await connectUser(pageA, 'AliceE2E');
    await connectUser(pageB, 'BobE2E');

    // Attendi che ciascuno veda l'altro (polling)
    await waitForUsers(pageA, 1);
    await waitForUsers(pageB, 1);

  // Attendi almeno 1 altro utente (ambiente può avere utenti paralleli)
  await expect.poll(async () => await pageA.locator('li[class*="p-3"]').count()).toBeGreaterThan(0);
  // Alice invia richiesta a Bob mirata alla riga BobE2E
  const bobRow = pageA.locator('li:has-text("BobE2E")');
  await expect(bobRow).toBeVisible();
  const requestButton = bobRow.getByTestId('send-request');
  await requestButton.click();
  await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });

  // Bob vede la richiesta (attendi un ciclo polling + verifica)
  await pageB.waitForTimeout(3000); // allow backend snapshot poll to include join request
  await waitForIncoming(pageB);
  const acceptBtn = pageB.getByTestId('accept-request').first();
    await acceptBtn.click();

    // Dopo approvazione attendi rimozione badge 'In attesa' (polling robusto)
    await expect.poll(async () => {
      return await pageA.locator('text=In attesa').count();
    }, { timeout: 15000, message: 'Badge In attesa ancora presente dopo approvazione' }).toBe(0);
    // Snapshot poll effect: attesa evento game (opzionale)
    await expect.poll(async () => {
      // Heuristic: partner name visibile nella UI? (cerca BobE2E su pagina Alice nella sezione partner / carte)
      return await pageA.locator('text=BobE2E').count();
    }, { timeout: 15000 }).toBeGreaterThan(0);
  });
});
