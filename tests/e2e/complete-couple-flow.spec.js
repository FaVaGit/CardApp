import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

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

async function waitForGameScreen(page, timeoutMs = 10000) {
  // Verifica che siamo nella schermata di gioco cercando elementi specifici del CoupleGame
  await expect.poll(async () => {
    // Cerca la toolbar del gioco di coppia
    const toolbar = await page.locator('text=/Complicità.*Coppia|Couple.*Game/').count();
    // Cerca il pulsante "Pesca Carta" o elementi simili
    const drawButton = await page.locator('button:has-text("Pesca"), button:has-text("Draw"), button:has-text("Carta")').count();
    // Cerca il log attività
    const activityLog = await page.locator('text=/Log.*Attività|Activity.*Log/').count();
    // Cerca elementi della canvas card table
    const canvasElements = await page.locator('canvas, [data-testid="card-table"]').count();
    
    return toolbar + drawButton + activityLog + canvasElements;
  }, { timeout: timeoutMs, message: 'Schermata di gioco non raggiunta' }).toBeGreaterThan(0);
}

async function waitForSessionRestorePrompt(page, timeoutMs = 5000) {
  // Verifica presenza del prompt di ripristino sessione con i testi esatti
  await expect.poll(async () => {
    // Cerca il titolo specifico del componente
    const title = await page.locator('text="Sessione Esistente Trovata"').count();
    // Cerca il testo descrittivo
    const description = await page.locator('text="È stata rilevata una sessione di gioco precedente"').count();
    // Cerca i bottoni specifici
    const restoreButton = await page.locator('button:has-text("Riprendi Partita")').count();
    const terminateButton = await page.locator('button:has-text("Termina e Ricomincia")').count();
    
    return title + description + restoreButton + terminateButton;
  }, { timeout: timeoutMs, message: 'Prompt ripristino sessione non trovato' }).toBeGreaterThan(0);
}

test.describe('Test End-to-End Completi - Flusso Coppia', () => {
  
  test('Scenario 1: Join/Acceptance → Schermata di Gioco Diretta', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Setup utenti
    await connectUser(pageA, 'Alice_S1');
    await connectUser(pageB, 'Bob_S1');

    // Attendi visibilità reciproca
    await waitForUsers(pageA, 1);
    await waitForUsers(pageB, 1);

    // Alice invia richiesta a Bob
    const bobRow = pageA.locator('li:has-text("Bob_S1")');
    await expect(bobRow).toBeVisible();
    await bobRow.getByTestId('send-request').click();
    await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });

    // Bob accetta la richiesta
    await waitForIncoming(pageB);
    await pageB.getByTestId('accept-request').first().click();

    // VERIFICA CRITICA: Entrambi vanno direttamente alla schermata di gioco
    await waitForGameScreen(pageA, 15000);
    await waitForGameScreen(pageB, 15000);

    // Verifica che NON siamo tornati al login
    await expect(pageA.locator('input[placeholder*="ome"], input[type="text"]')).toHaveCount(0);
    await expect(pageB.locator('input[placeholder*="ome"], input[type="text"]')).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });

  test('Scenario 2: Ripristino Sessione con SessionRestorePrompt', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Setup e formazione coppia
    await connectUser(pageA, 'Alice_S2');
    await connectUser(pageB, 'Bob_S2');
    await waitForUsers(pageA, 1);
    await waitForUsers(pageB, 1);

    // Formazione coppia rapida
    const bobRow = pageA.locator('li:has-text("Bob_S2")');
    await bobRow.getByTestId('send-request').click();
    await waitForIncoming(pageB);
    await pageB.getByTestId('accept-request').first().click();
    await waitForGameScreen(pageA, 15000);

    // Simula disconnessione di Alice (refresh browser)
    await pageA.reload();
    await connectUser(pageA, 'Alice_S2'); // Riconnessione

    // VERIFICA: Alice dovrebbe vedere il SessionRestorePrompt invece di un dialog nativo
    await waitForSessionRestorePrompt(pageA, 10000);

    // Test "Riprendi Partita"
    await pageA.locator('button:has-text("Riprendi"), button:has-text("Restore")').click();
    await waitForGameScreen(pageA, 10000);

    await contextA.close();
    await contextB.close();
  });

  test('Scenario 3: Terminazione Sessione con Notifica Partner', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Setup e formazione coppia
    await connectUser(pageA, 'Alice_S3');
    await connectUser(pageB, 'Bob_S3');
    await waitForUsers(pageA, 1);
    await waitForUsers(pageB, 1);

    // Formazione coppia
    const bobRow = pageA.locator('li:has-text("Bob_S3")');
    await bobRow.getByTestId('send-request').click();
    await waitForIncoming(pageB);
    await pageB.getByTestId('accept-request').first().click();
    await waitForGameScreen(pageA, 15000);
    await waitForGameScreen(pageB, 15000);

    // Alice termina la sessione
    await pageA.reload();
    await connectUser(pageA, 'Alice_S3');
    await waitForSessionRestorePrompt(pageA, 10000);
    
    // Termina la sessione
    await pageA.locator('button:has-text("Termina"), button:has-text("Ricomincia")').click();

    // VERIFICA: Bob dovrebbe ricevere notifica di terminazione
    await expect.poll(async () => {
      const toast = await pageB.locator('text=/partner.*terminat|session.*ended|terminata/i').count();
      const backToLobby = await pageB.locator('text=/lobby|coppia/i').count();
      return toast > 0 || backToLobby > 0;
    }, { timeout: 15000, message: 'Bob non ha ricevuto notifica terminazione' }).toBeGreaterThan(0);

    await contextA.close();
    await contextB.close();
  });

  test('Scenario 4: Rifiuto Richiesta Join', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Setup utenti
    await connectUser(pageA, 'Alice_S4');
    await connectUser(pageB, 'Bob_S4');
    await waitForUsers(pageA, 1);
    await waitForUsers(pageB, 1);

    // Alice invia richiesta a Bob
    const bobRow = pageA.locator('li:has-text("Bob_S4")');
    await bobRow.getByTestId('send-request').click();
    await expect(pageA.locator('text=In attesa')).toBeVisible();

    // Bob rifiuta la richiesta
    await waitForIncoming(pageB);
    await pageB.getByTestId('reject-request').first().click();

    // VERIFICA: Alice dovrebbe vedere la rimozione del badge "In attesa"
    await expect.poll(async () => {
      return await pageA.locator('text=In attesa').count();
    }, { timeout: 10000, message: 'Badge In attesa non rimosso dopo rifiuto' }).toBe(0);

    // VERIFICA: Entrambi dovrebbero rimanere in lobby
    await expect(pageA.locator('text=/Lobby|lobby/')).toBeVisible();
    await expect(pageB.locator('text=/Lobby|lobby/')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test('Scenario 5: Gestione Errori e Disconnessioni', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Test disconnessione durante join
    await connectUser(pageA, 'Alice_S5');
    await connectUser(pageB, 'Bob_S5');
    await waitForUsers(pageA, 1);

    // Alice invia richiesta
    const bobRow = pageA.locator('li:has-text("Bob_S5")');
    await bobRow.getByTestId('send-request').click();

    // Simula disconnessione di Bob prima dell'accettazione
    await pageB.close();
    const pageB2 = await contextB.newPage();
    await connectUser(pageB2, 'Bob_S5');

    // VERIFICA: Bob dovrebbe vedere le richieste persistenti
    await waitForIncoming(pageB2);
    await pageB2.getByTestId('accept-request').first().click();

    // VERIFICA: Formazione coppia dovrebbe funzionare anche dopo riconnessione
    await waitForGameScreen(pageA, 15000);
    await waitForGameScreen(pageB2, 15000);

    await contextA.close();
    await contextB.close();
  });

  test('Scenario 6: Multiple Join Requests Management', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const contextC = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const pageC = await contextC.newPage();

    // Setup tre utenti
    await connectUser(pageA, 'Alice_S6');
    await connectUser(pageB, 'Bob_S6');
    await connectUser(pageC, 'Charlie_S6');
    
    await waitForUsers(pageA, 2);
    await waitForUsers(pageB, 2);
    await waitForUsers(pageC, 2);

    // Alice e Charlie inviano richieste a Bob
    const bobRowA = pageA.locator('li:has-text("Bob_S6")');
    const bobRowC = pageC.locator('li:has-text("Bob_S6")');
    
    await bobRowA.getByTestId('send-request').click();
    await bobRowC.getByTestId('send-request').click();

    // VERIFICA: Bob dovrebbe vedere multiple richieste
    await expect.poll(async () => {
      const requests = await pageB.getByTestId('accept-request').count();
      return requests;
    }, { timeout: 10000, message: 'Bob non vede multiple richieste' }).toBeGreaterThanOrEqual(2);

    // Bob accetta la prima richiesta
    await pageB.getByTestId('accept-request').first().click();
    await waitForGameScreen(pageB, 15000);

    // VERIFICA: Le altre richieste dovrebbero essere automaticamente rimosse
    await expect.poll(async () => {
      return await pageC.locator('text=In attesa').count();
    }, { timeout: 10000, message: 'Richiesta di Charlie non rimossa dopo coppia formata' }).toBe(0);

    await contextA.close();
    await contextB.close();
    await contextC.close();
  });

  test('Scenario 7: Stress Test - Rapid Join/Leave Cycles', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Setup utenti
    await connectUser(pageA, 'Alice_S7');
    await connectUser(pageB, 'Bob_S7');
    await waitForUsers(pageA, 1);
    await waitForUsers(pageB, 1);

    // Ciclo rapido di join/acceptance/termination
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Stress test ciclo ${i + 1}/3`);
      
      // Join e acceptance
      const bobRow = pageA.locator('li:has-text("Bob_S7")');
      await bobRow.getByTestId('send-request').click();
      await waitForIncoming(pageB);
      await pageB.getByTestId('accept-request').first().click();
      await waitForGameScreen(pageA, 10000);
      await waitForGameScreen(pageB, 10000);

      // Simula uscita dalla sessione per Alice
      await pageA.reload();
      await connectUser(pageA, 'Alice_S7');
      
      if (i < 2) { // Non nell'ultimo ciclo
        await waitForSessionRestorePrompt(pageA, 8000);
        await pageA.locator('button:has-text("Termina"), button:has-text("Ricomincia")').click();
        
        // Attendi ritorno alla lobby
        await expect(pageA.locator('text=/Lobby|lobby/')).toBeVisible({ timeout: 8000 });
        await expect(pageB.locator('text=/Lobby|lobby/')).toBeVisible({ timeout: 8000 });
      }
    }

    // VERIFICA FINALE: Ultima sessione dovrebbe essere stabile
    await waitForSessionRestorePrompt(pageA, 8000);
    await pageA.locator('button:has-text("Riprendi"), button:has-text("Restore")').click();
    await waitForGameScreen(pageA, 10000);

    await contextA.close();
    await contextB.close();
  });
});