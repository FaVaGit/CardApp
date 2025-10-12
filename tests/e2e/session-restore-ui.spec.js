import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

async function createCoupleAndSession(pageA, pageB, nameA, nameB) {
  await connectUser(pageA, nameA);
  await connectUser(pageB, nameB);
  
  // Attendi visibilità reciproca
  await expect.poll(async () => {
    return await pageA.locator('li[class*="p-3"]').count();
  }).toBeGreaterThanOrEqual(1);

  // Formazione coppia rapida
  const bobRow = pageA.locator(`li:has-text("${nameB}")`);
  await bobRow.getByTestId('send-request').click();
  
  await expect.poll(async () => {
    const accept = await pageB.getByTestId('accept-request').count();
    return accept;
  }, { timeout: 15000 }).toBeGreaterThan(0);
  
  await pageB.getByTestId('accept-request').first().click();
  
  // Attendi schermata di gioco
  await expect.poll(async () => {
    const gameElements = await pageA.locator('[data-testid="card-table"], .card-game, canvas, button:has-text("Esci")').count();
    return gameElements;
  }, { timeout: 15000 }).toBeGreaterThan(0);
}

test.describe('SessionRestorePrompt UI Tests', () => {
  
  test('Verifica rendering completo SessionRestorePrompt', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Crea coppia e sessione
    await createCoupleAndSession(pageA, pageB, 'Alice_UI1', 'Bob_UI1');

    // Simula disconnessione Alice
    await pageA.reload();
    await connectUser(pageA, 'Alice_UI1');

    // VERIFICA: SessionRestorePrompt dovrebbe apparire
    await expect.poll(async () => {
      const prompt = await pageA.locator('text=/Sessione.*[Ee]sistente.*[Tt]rovata/').count();
      return prompt;
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // VERIFICA: Elementi UI specifici del componente
    await expect(pageA.locator('text=/Sessione.*[Ee]sistente.*[Tt]rovata/')).toBeVisible();
    await expect(pageA.locator('text=/È stata rilevata.*sessione/')).toBeVisible();
    await expect(pageA.locator('button:has-text("Riprendi Partita")')).toBeVisible();
    await expect(pageA.locator('button:has-text("Termina e Ricomincia")')).toBeVisible();

    // VERIFICA: Dettagli sessione mostrati
    await expect(pageA.locator('text=/Sessione:/')).toBeVisible();
    await expect(pageA.locator('text=/Partner:/')).toBeVisible();

    // VERIFICA: NON dovrebbe esserci window.confirm nativo
    let nativeDialogAppeared = false;
    pageA.on('dialog', () => {
      nativeDialogAppeared = true;
    });
    
    await pageA.waitForTimeout(2000);
    expect(nativeDialogAppeared).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  test('Test interazione bottoni SessionRestorePrompt', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Crea coppia e sessione
    await createCoupleAndSession(pageA, pageB, 'Alice_UI2', 'Bob_UI2');

    // Test bottone "Riprendi Partita"
    await pageA.reload();
    await connectUser(pageA, 'Alice_UI2');
    
    await expect.poll(async () => {
      return await pageA.locator('button:has-text("Riprendi Partita")').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // Click su Riprendi Partita
    await pageA.locator('button:has-text("Riprendi Partita")').click();

    // VERIFICA: Dovrebbe tornare alla schermata di gioco
    await expect.poll(async () => {
      const gameElements = await pageA.locator('[data-testid="card-table"], .card-game, canvas, button:has-text("Esci")').count();
      return gameElements;
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // VERIFICA: Prompt dovrebbe scomparire
    await expect(pageA.locator('text=/Sessione.*[Ee]sistente/')).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });

  test('Test bottone "Termina e Ricomincia"', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Crea coppia e sessione
    await createCoupleAndSession(pageA, pageB, 'Alice_UI3', 'Bob_UI3');

    // Test bottone "Termina e Ricomincia"
    await pageA.reload();
    await connectUser(pageA, 'Alice_UI3');
    
    await expect.poll(async () => {
      return await pageA.locator('button:has-text("Termina e Ricomincia")').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // Click su Termina e Ricomincia
    await pageA.locator('button:has-text("Termina e Ricomincia")').click();

    // VERIFICA: Dovrebbe tornare alla lobby
    await expect.poll(async () => {
      const lobbyElements = await pageA.locator('text=/Lobby.*[Cc]oppia|💑.*Lobby/').count();
      return lobbyElements;
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // VERIFICA: Prompt dovrebbe scomparire
    await expect(pageA.locator('text=/Sessione.*[Ee]sistente/')).toHaveCount(0);

    // VERIFICA: Bob dovrebbe ricevere notifica di terminazione
    await expect.poll(async () => {
      const notification = await pageB.locator('text=/terminat|ended/i').count();
      const backToLobby = await pageB.locator('text=/Lobby.*[Cc]oppia|💑.*Lobby/').count();
      return notification > 0 || backToLobby > 0;
    }, { timeout: 15000 }).toBeGreaterThan(0);

    await contextA.close();
    await contextB.close();
  });

  test('Test loading states durante azioni', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Crea coppia e sessione
    await createCoupleAndSession(pageA, pageB, 'Alice_UI4', 'Bob_UI4');

    await pageA.reload();
    await connectUser(pageA, 'Alice_UI4');
    
    await expect.poll(async () => {
      return await pageA.locator('button:has-text("Riprendi Partita")').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // Intercetta network per simulare latenza
    await pageA.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      await route.continue();
    });

    // Click su Riprendi Partita e verifica loading state
    const restoreButton = pageA.locator('button:has-text("Riprendi Partita")');
    await restoreButton.click();

    // VERIFICA: Bottone dovrebbe mostrare stato loading/disabled
    await expect(restoreButton).toBeDisabled();

    // Attendi completamento
    await expect.poll(async () => {
      const gameElements = await pageA.locator('[data-testid="card-table"], .card-game, canvas, button:has-text("Esci")').count();
      return gameElements;
    }, { timeout: 15000 }).toBeGreaterThan(0);

    await contextA.close();
    await contextB.close();
  });

  test('Test styling e accessibilità SessionRestorePrompt', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Crea coppia e sessione
    await createCoupleAndSession(pageA, pageB, 'Alice_UI5', 'Bob_UI5');

    await pageA.reload();
    await connectUser(pageA, 'Alice_UI5');
    
    await expect.poll(async () => {
      return await pageA.locator('text=/Sessione.*[Ee]sistente/').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // VERIFICA: Struttura Material-UI Card
    const card = pageA.locator('div[class*="MuiCard"], div[class*="card"]').first();
    await expect(card).toBeVisible();

    // VERIFICA: Icone presenti
    const infoIcon = pageA.locator('svg[data-testid="InfoIcon"], .MuiSvgIcon-root').first();
    await expect(infoIcon).toBeVisible();

    // VERIFICA: Chip components per dettagli sessione
    const chips = pageA.locator('div[class*="MuiChip"], .chip');
    await expect(chips).toHaveCountGreaterThan(0);

    // VERIFICA: Bottoni accessibili con icone
    const restoreButton = pageA.locator('button:has-text("Riprendi Partita")');
    const terminateButton = pageA.locator('button:has-text("Termina e Ricomincia")');
    
    await expect(restoreButton).toBeVisible();
    await expect(terminateButton).toBeVisible();
    
    // VERIFICA: Bottoni hanno icone appropriate
    const playIcon = restoreButton.locator('svg[data-testid="PlayArrowIcon"], .MuiSvgIcon-root').first();
    const deleteIcon = terminateButton.locator('svg[data-testid="DeleteIcon"], .MuiSvgIcon-root').first();
    
    await expect(playIcon).toBeVisible();
    await expect(deleteIcon).toBeVisible();

    // VERIFICA: Focus management
    await pageA.keyboard.press('Tab');
    await expect(restoreButton).toBeFocused();
    
    await pageA.keyboard.press('Tab');
    await expect(terminateButton).toBeFocused();

    await contextA.close();
    await contextB.close();
  });
});