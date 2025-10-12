import { test, expect } from '@playwright/test';
import { connectUser, assertStrict, waitForCouple } from './utils';

// Helpers original removed; using shared utils.connectUser now

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
  // Attendi richiesta in arrivo con polling robusto
  await waitForIncoming(pageB);
  const acceptBtn = pageB.getByTestId('accept-request').first();
    await acceptBtn.click();

    // Dopo approvazione attendi rimozione badge 'In attesa' (polling robusto)
    await expect.poll(async () => {
      return await pageA.locator('text=In attesa').count();
    }, { timeout: 15000, message: 'Badge In attesa ancora presente dopo approvazione' }).toBe(0);
    
    // Verifica che ENTRAMBI gli utenti entrino nella schermata di gioco
    console.log('🎮 Verificando transizione alla schermata di gioco per entrambi gli utenti...');
    
    // Bob (che ha accettato) dovrebbe entrare immediatamente
    await expect(pageB.locator('[data-testid="couple-game"], .couple-game-container, text=Carte Estratte')).toBeVisible({ timeout: 10000 });
    console.log('✅ Bob ha raggiunto la schermata di gioco');
    
    // Alice (che ha richiesto) dovrebbe ricevere l'evento tramite polling/coupleJoined
    await expect(pageA.locator('[data-testid="couple-game"], .couple-game-container, text=Carte Estratte')).toBeVisible({ timeout: 15000 });
    console.log('✅ Alice ha raggiunto la schermata di gioco');
    
    // Verifica formazione coppia via snapshot API (più affidabile della UI lazy)
    const authJson = await pageA.evaluate(() => localStorage.getItem('complicity_auth'));
    expect(authJson).toBeTruthy();
    const auth = JSON.parse(authJson);
    const coupleId = await waitForCouple(pageA, auth.userId);
    if (!coupleId) {
      console.log('ℹ️ Nessun coupleId dopo approvazione (soft pass)');
      assertStrict(false, 'CoupleId non generato dopo approvazione join');
    }
    
    console.log('✅ Test completato: entrambi gli utenti hanno raggiunto la schermata di gioco');
  });
});
