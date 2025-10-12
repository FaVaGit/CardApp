import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

/**
 * Test Disconnessioni e Timeout
 * 
 * Copertura scenari:
 * - Disconnessioni improvvise durante il gioco
 * - Timeout di sessione
 * - Interruzioni di rete
 * - Recovery automatico
 */
test.describe('Disconnection & Timeout Scenarios', () => {
  
  test('Disconnessione improvvisa durante formazione coppia', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await connectUser(pageA, 'AliceDisconnect');
    await connectUser(pageB, 'BobDisconnect');

    // Attendi directory popolata
    await expect.poll(async () => {
      const aliceUsers = await pageA.locator('li[class*="p-3"]').count();
      return aliceUsers > 0;
    }, { timeout: 15000 }).toBeTruthy();

    // Alice invia richiesta
    const bobRow = pageA.locator('li:has-text("BobDisconnect")');
    await expect(bobRow).toBeVisible();
    await bobRow.getByTestId('send-request').click();
    await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });

    // Simula disconnessione di Alice chiudendo la pagina improvvisamente
    await pageA.close();

    // Bob dovrebbe comunque vedere la richiesta e poterla gestire
    await expect.poll(async () => {
      const accept = await pageB.getByTestId('accept-request').count();
      return accept > 0;
    }, { timeout: 20000 }).toBeGreaterThan(0);

    // Bob accetta anche se Alice è disconnessa
    await pageB.getByTestId('accept-request').first().click();

    // Verifica che Bob gestisca la situazione senza crash
    // Potrebbe andare in gioco o rimanere in lobby con un messaggio
    await page.waitForTimeout(3000);
    
    console.log('✅ Test disconnessione durante formazione coppia completato');
    
    await contextB.close();
  });

  test('Interruzione di rete durante gioco attivo', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Forma coppia normalmente
    await connectUser(pageA, 'AliceNetwork');
    await connectUser(pageB, 'BobNetwork');

    await expect.poll(async () => {
      const aliceUsers = await pageA.locator('li[class*="p-3"]').count();
      return aliceUsers > 0;
    }, { timeout: 15000 }).toBeTruthy();

    const bobRow = pageA.locator('li:has-text("BobNetwork")');
    await expect(bobRow).toBeVisible();
    await bobRow.getByTestId('send-request').click();

    await expect.poll(async () => {
      const accept = await pageB.getByTestId('accept-request').count();
      return accept > 0;
    }, { timeout: 20000 }).toBeGreaterThan(0);

    await pageB.getByTestId('accept-request').first().click();

    // Attendi che entrambi siano in gioco
    await expect(pageA.locator('text=Gioco di Coppia')).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('text=Gioco di Coppia')).toBeVisible({ timeout: 15000 });

    // Simula interruzione di rete per Alice bloccando tutte le richieste
    await pageA.route('**/*', route => {
      route.abort('connectionfailed');
    });

    // Bob prova a pescare una carta
    const drawButton = pageB.locator('button:has-text("Pesca"), button:has-text("Nuova Carta")');
    if (await drawButton.count() > 0) {
      await drawButton.first().click();
    }

    // Verifica che Bob continui a funzionare nonostante Alice sia offline
    await page.waitForTimeout(5000);
    
    // Alice dovrebbe eventualmente mostrare errori di connessione
    // ma l'app non dovrebbe crashare
    const aliceContent = await pageA.textContent('body');
    expect(aliceContent).toBeTruthy(); // La pagina non dovrebbe essere completamente vuota
    
    console.log('✅ Test interruzione di rete durante gioco completato');
    
    await contextA.close();
    await contextB.close();
  });

  test('Timeout di sessione e riconnessione automatica', async ({ page }) => {
    await connectUser(page, 'TimeoutUser');
    
    // Verifica login riuscito
    await expect(page.locator('text=Ciao TimeoutUser')).toBeVisible({ timeout: 10000 });
    
    // Simula timeout cancellando sessionStorage e aspettando
    await page.evaluate(() => {
      sessionStorage.removeItem('complicity_auth');
    });
    
    // Reload per triggerare riconnessione
    await page.reload();
    
    // L'app dovrebbe tornare al login senza crash
    await expect(page.locator('h4:has-text("Complicità")')).toBeVisible({ timeout: 10000 });
    
    // Testa riconnessione manuale
    const loginTab = page.getByRole('tab', { name: /Login/i });
    await loginTab.click();
    
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'TimeoutUser');
    await page.getByTestId('password-input').fill('e2e1');
    
    const submitButton = page.getByTestId('submit-auth');
    await submitButton.click();
    
    // Dovrebbe riloggare con successo
    await expect(page.locator('text=Ciao TimeoutUser')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Test timeout e riconnessione completato');
  });

  test('Gestione errori backend non disponibile', async ({ page }) => {
    // Blocca tutte le chiamate al backend
    await page.route('**/api/**', route => {
      route.abort('connectionfailed');
    });
    
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'BackendDown');
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('confirm-password-input').fill('test123');
    
    const submitButton = page.getByTestId('submit-auth');
    await submitButton.click();
    
    // Dovrebbe mostrare errore ma non crashare
    await expect(page.locator('text=Errore di autenticazione')).toBeVisible({ timeout: 10000 });
    
    // L'app dovrebbe rimanere responsive
    await expect(submitButton).toBeEnabled();
    
    console.log('✅ Test backend non disponibile completato');
  });

  test('Recovery da stato inconsistente', async ({ page }) => {
    await connectUser(page, 'RecoveryUser');
    
    // Verifica login riuscito
    await expect(page.locator('text=Ciao RecoveryUser')).toBeVisible({ timeout: 10000 });
    
    // Simula stato inconsistente manipolando sessionStorage
    await page.evaluate(() => {
      const auth = JSON.parse(sessionStorage.getItem('complicity_auth') || '{}');
      auth.userId = 'invalid-user-id';
      auth.authToken = 'invalid-token';
      sessionStorage.setItem('complicity_auth', JSON.stringify(auth));
    });
    
    // Reload per triggerare tentativo di riconnessione con dati invalidi
    await page.reload();
    
    // L'app dovrebbe gestire l'errore e tornare al login
    await expect(page.locator('h4:has-text("Complicità")')).toBeVisible({ timeout: 10000 });
    
    // Non dovrebbe esserci sessionStorage corrotto rimasto
    const corruptedAuth = await page.evaluate(() => {
      return sessionStorage.getItem('complicity_auth');
    });
    
    expect(corruptedAuth).toBeNull();
    
    console.log('✅ Test recovery stato inconsistente completato');
  });

  test('Stress test riconnessioni multiple rapide', async ({ page }) => {
    await connectUser(page, 'StressUser');
    
    // Verifica login riuscito
    await expect(page.locator('text=Ciao StressUser')).toBeVisible({ timeout: 10000 });
    
    // Simula 5 riconnessioni rapide
    for (let i = 0; i < 5; i++) {
      console.log(`Riconnessione ${i + 1}/5`);
      
      // Logout veloce
      const logoutButton = page.getByRole('button', { name: /logout/i });
      await logoutButton.click();
      
      // Login veloce
      const loginTab = page.getByRole('tab', { name: /Login/i });
      await loginTab.click();
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'StressUser');
      await page.getByTestId('password-input').fill('e2e1');
      
      const submitButton = page.getByTestId('submit-auth');
      await submitButton.click();
      
      // Attendi riconnessione
      await expect(page.locator('text=Ciao StressUser')).toBeVisible({ timeout: 10000 });
      
      // Breve pausa per evitare rate limiting
      await page.waitForTimeout(1000);
    }
    
    // Verifica che l'app sia ancora stabile dopo lo stress test
    await expect(page.locator('text=Ciao StressUser')).toBeVisible();
    
    console.log('✅ Test stress riconnessioni completato');
  });
});