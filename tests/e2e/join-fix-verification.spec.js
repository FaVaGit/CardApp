import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

test.describe('Test Verifica Fix Join/Acceptance', () => {
  
  test('Join/Acceptance → Verifica che entrambi vadano alla schermata di gioco', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Setup utenti
    await connectUser(pageA, 'Alice_Fix');
    await connectUser(pageB, 'Bob_Fix');

    // Attendi visibilità reciproca
    await expect.poll(async () => {
      return await pageA.locator('li[class*="p-3"]').count();
    }, { message: 'Alice non vede utenti disponibili' }).toBeGreaterThanOrEqual(1);

    await expect.poll(async () => {
      return await pageB.locator('li[class*="p-3"]').count();
    }, { message: 'Bob non vede utenti disponibili' }).toBeGreaterThanOrEqual(1);

    // Alice invia richiesta a Bob
    const bobRow = pageA.locator('li:has-text("Bob_Fix")');
    await expect(bobRow).toBeVisible();
    await bobRow.getByTestId('send-request').click();
    
    // Verifica che Alice veda "In attesa"
    await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });
    console.log('✅ Alice ha inviato la richiesta');

    // Bob vede la richiesta
    await expect.poll(async () => {
      return await pageB.getByTestId('accept-request').count();
    }, { timeout: 15000, message: 'Bob non vede richieste in arrivo' }).toBeGreaterThan(0);
    
    console.log('✅ Bob vede la richiesta');

    // Bob accetta la richiesta
    await pageB.getByTestId('accept-request').first().click();
    console.log('✅ Bob ha accettato la richiesta');

    // VERIFICA CRITICA: Entrambi dovrebbero andare alla schermata di gioco
    // Cerchiamo elementi specifici della schermata di gioco
    
    // Per Alice
    await expect.poll(async () => {
      const toolbar = await pageA.locator('text="Complicità • Coppia"').count();
      const activityLog = await pageA.locator('text="Log Attività"').count();
      return toolbar + activityLog;
    }, { timeout: 20000, message: 'Alice non ha raggiunto la schermata di gioco' }).toBeGreaterThan(0);
    
    console.log('✅ Alice ha raggiunto la schermata di gioco');

    // Per Bob
    await expect.poll(async () => {
      const toolbar = await pageB.locator('text="Complicità • Coppia"').count();
      const activityLog = await pageB.locator('text="Log Attività"').count();
      return toolbar + activityLog;
    }, { timeout: 20000, message: 'Bob non ha raggiunto la schermata di gioco' }).toBeGreaterThan(0);
    
    console.log('✅ Bob ha raggiunto la schermata di gioco');

    // VERIFICA: NON dovrebbero essere tornati al login
    await expect(pageA.locator('input[placeholder*="ome"], input[type="text"]')).toHaveCount(0);
    await expect(pageB.locator('input[placeholder*="ome"], input[type="text"]')).toHaveCount(0);
    
    console.log('✅ Nessuno è tornato al login');

    // VERIFICA: NON dovrebbero vedere il SessionRestorePrompt (è per ripristini, non nuove sessioni)
    await expect(pageA.locator('text="Sessione Esistente Trovata"')).toHaveCount(0);
    await expect(pageB.locator('text="Sessione Esistente Trovata"')).toHaveCount(0);
    
    console.log('✅ Nessun prompt di ripristino mostrato (corretto per nuove sessioni)');

    await contextA.close();
    await contextB.close();

    console.log('🎉 TEST PASSATO: Il fix join/acceptance funziona correttamente!');
  });
});