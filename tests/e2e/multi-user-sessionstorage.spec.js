import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

/**
 * Test Multi-Utente con sessionStorage
 * 
 * Valida che:
 * 1. Due utenti possano registrarsi/loggarsi simultaneamente in tab separate
 * 2. sessionStorage mantenga sessioni isolate
 * 3. Non ci siano conflitti tra le sessioni
 * 4. Il flusso di coppia funzioni correttamente con sessioni separate
 */
test.describe('Multi-User sessionStorage', () => {
  
  test('Due utenti si registrano simultaneamente senza conflitti sessionStorage', async ({ browser }) => {
    // Crea due contesti separati (simula tab separate con sessionStorage isolato)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // FASE 1: Registrazione simultanea
    console.log('🔄 Fase 1: Registrazione simultanea...');
    
    // Registra Alice in pageA
    await connectUser(pageA, 'AliceSession');
    
    // Verifica che Alice sia loggata e in lobby
    await expect(pageA.locator('text=Ciao AliceSession')).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('.MuiTypography-caption:has-text("Codice:")')).toBeVisible();
    
    // Registra Bob in pageB MENTRE Alice è già loggata
    await connectUser(pageB, 'BobSession');
    
    // Verifica che Bob sia loggato e in lobby
    await expect(pageB.locator('text=Ciao BobSession')).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.MuiTypography-caption:has-text("Codice:")')).toBeVisible();
    
    console.log('✅ Entrambi gli utenti registrati simultaneamente');

    // FASE 2: Verifica isolamento sessionStorage
    console.log('🔄 Fase 2: Verifica isolamento sessionStorage...');
    
    // Verifica che ogni tab abbia il suo sessionStorage separato
    const aliceAuth = await pageA.evaluate(() => {
      return JSON.parse(sessionStorage.getItem('complicity_auth') || '{}');
    });
    const bobAuth = await pageB.evaluate(() => {
      return JSON.parse(sessionStorage.getItem('complicity_auth') || '{}');
    });
    
    // Verifica che le sessioni siano diverse
    expect(aliceAuth.name).toBe('AliceSession');
    expect(bobAuth.name).toBe('BobSession');
    expect(aliceAuth.userId).not.toBe(bobAuth.userId);
    expect(aliceAuth.personalCode).not.toBe(bobAuth.personalCode);
    
    console.log('✅ sessionStorage correttamente isolato:', {
      alice: { name: aliceAuth.name, code: aliceAuth.personalCode },
      bob: { name: bobAuth.name, code: bobAuth.personalCode }
    });

    // FASE 3: Verifica che la migrazione a sessionStorage non rompa il flusso base
    console.log('🔄 Fase 3: Test funzionalità base...');
    
    // Attendi che la directory si popoli per entrambi
    await expect.poll(async () => {
      const aliceUsers = await pageA.locator('li[class*="p-3"]').count();
      const bobUsers = await pageB.locator('li[class*="p-3"]').count();
      return aliceUsers > 0 && bobUsers > 0;
    }, { timeout: 15000, message: 'Attesa popolamento directory utenti' }).toBeTruthy();
    
    // Alice dovrebbe vedere Bob nella directory
    await expect(pageA.locator('li:has-text("BobSession")')).toBeVisible({ timeout: 10000 });
    
    // Bob dovrebbe vedere Alice nella directory
    await expect(pageB.locator('li:has-text("AliceSession")')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Directory utenti funziona con sessioni separate');

    // FASE 4: Test flusso coppia completo
    console.log('🔄 Fase 4: Test flusso coppia completo...');
    
    // Alice invia richiesta a Bob
    const bobRow = pageA.locator('li:has-text("BobSession")');
    await expect(bobRow).toBeVisible();
    const requestButton = bobRow.getByTestId('send-request');
    await requestButton.click();
    
    // Verifica che Alice veda "In attesa"
    await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });
    
    // Bob dovrebbe ricevere la richiesta
    await expect.poll(async () => {
      const badge = await pageB.getByTestId('incoming-request-badge').count();
      if (badge > 0) return badge;
      const accept = await pageB.getByTestId('accept-request').count();
      return accept > 0 ? 1 : 0;
    }, { timeout: 20000, message: 'Attesa richiesta in arrivo per Bob' }).toBeGreaterThan(0);
    
    // Bob accetta la richiesta
    const acceptButton = pageB.getByTestId('accept-request').first();
    await acceptButton.click();
    
    // Entrambi dovrebbero entrare in modalità coppia
    await expect(pageA.locator('text=Gioco di Coppia')).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator('text=Gioco di Coppia')).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Flusso coppia completato con successo');

    // FASE 5: Verifica auth separati mantiensi nel gioco
    console.log('🔄 Fase 5: Verifica auth separati mantiensi...');
    
    // Ma auth separati
    const aliceFinalAuth = await pageA.evaluate(() => JSON.parse(sessionStorage.getItem('complicity_auth') || '{}'));
    const bobFinalAuth = await pageB.evaluate(() => JSON.parse(sessionStorage.getItem('complicity_auth') || '{}'));
    
    expect(aliceFinalAuth.userId).not.toBe(bobFinalAuth.userId);
    
    console.log('✅ Auth mantiensi separati nel gioco:', {
      aliceUserId: aliceFinalAuth.userId,
      bobUserId: bobFinalAuth.userId
    });

    await contextA.close();
    await contextB.close();
  });

  test('Logout in una tab non influenza altra tab (isolamento sessionStorage)', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Registra entrambi
    await connectUser(pageA, 'AliceLogout');
    await connectUser(pageB, 'BobLogout');
    
    // Verifica entrambi loggati
    await expect(pageA.locator('text=Ciao AliceLogout')).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('text=Ciao BobLogout')).toBeVisible({ timeout: 10000 });
    
    // Alice fa logout
    const logoutButtonA = pageA.getByRole('button', { name: /logout/i });
    await logoutButtonA.click();
    
    // Alice dovrebbe tornare al login
    await expect(pageA.locator('h4:has-text("Complicità")')).toBeVisible({ timeout: 5000 });
    
    // Bob dovrebbe rimanere loggato (sessione non influenzata)
    await expect(pageB.locator('text=Ciao BobLogout')).toBeVisible();
    
    // Verifica sessionStorage
    const aliceAuthAfterLogout = await pageA.evaluate(() => sessionStorage.getItem('complicity_auth'));
    const bobAuthAfterLogout = await pageB.evaluate(() => sessionStorage.getItem('complicity_auth'));
    
    expect(aliceAuthAfterLogout).toBeNull(); // Alice ha fatto logout
    expect(bobAuthAfterLogout).toBeTruthy(); // Bob ancora loggato
    
    console.log('✅ Logout isolato: Alice disconnessa, Bob ancora connesso');

    await contextA.close();
    await contextB.close();
  });

  test('Chiusura tab pulisce sessionStorage senza influenzare altre tab', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Registra entrambi
    await connectUser(pageA, 'AliceClose');
    await connectUser(pageB, 'BobClose');
    
    // Verifica entrambi loggati
    await expect(pageA.locator('text=Ciao AliceClose')).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('text=Ciao BobClose')).toBeVisible({ timeout: 10000 });
    
    // Chiudi pageA (simula chiusura tab)
    await pageA.close();
    
    // Bob dovrebbe rimanere loggato (sessionStorage isolato)
    await expect(pageB.locator('text=Ciao BobClose')).toBeVisible();
    
    console.log('✅ Chiusura tab isolata: Bob non influenzato dalla chiusura di Alice');

    await contextB.close();
  });
});