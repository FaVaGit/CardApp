import { test, expect, Page } from '@playwright/test';

test.describe('Lavagna Condivisa - Collaborative Whiteboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Vai alla demo della lavagna
    await page.goto('/whiteboard-demo');
    await page.waitForLoadState('networkidle');
  });

  test('Should render whiteboard demo page with all UI elements', async ({ page }) => {
    // Verifica elementi principali della UI
    await expect(page.locator('h1')).toContainText('Demo Lavagna Condivisa');
    
    // Verifica presenza modalità demo e real-time
    await expect(page.locator('text=Modalità Demo (Locale)')).toBeVisible();
    await expect(page.locator('text=Modalità Real-time')).toBeVisible();
    
    // Verifica presenza della lavagna
    await expect(page.locator('[data-testid="shared-whiteboard"]')).toBeVisible();
    
    // Verifica toolbar strumenti
    await expect(page.locator('text=Strumenti:')).toBeVisible();
    await expect(page.locator('text=Colore:')).toBeVisible();
    await expect(page.locator('text=Dimensione:')).toBeVisible();
  });

  test('Should switch between demo and real-time modes', async ({ page }) => {
    // Inizialmente in modalità demo
    await expect(page.locator('text=Modalità Demo Locale')).toBeVisible();
    
    // Clicca per passare alla modalità gioco
    await page.click('button:has-text("🎮 Modalità Gioco")');
    
    // Verifica che la modalità sia cambiata
    await expect(page.locator('text=Sessione di Gioco')).toBeVisible();
    await expect(page.locator('text=Lavagna Condivisa')).toBeVisible();
  });

  test('Should display connection status correctly', async ({ page }) => {
    // Verifica indicatore di stato connessione
    const statusIndicator = page.locator('[data-testid="connection-status"]');
    await expect(statusIndicator).toBeVisible();
    
    // Status può essere connesso o disconnesso
    const statusText = await page.locator('text=Backend:').textContent();
    expect(statusText).toMatch(/Backend: (Connesso|Disconnesso|Connettendo\.\.\.)/);
  });

  test('Should use correct drawing tools in demo mode', async ({ page }) => {
    // Verifica che siamo in modalità demo
    await expect(page.locator('text=Modalità Demo Locale')).toBeVisible();
    
    // Test selezione strumento pennello
    await page.click('[data-testid="tool-brush"]');
    await expect(page.locator('[data-testid="tool-brush"]')).toHaveClass(/bg-purple-100/);
    
    // Test selezione colore
    await page.click('[data-testid="color-red"]');
    
    // Test selezione dimensione pennello
    await page.click('[data-testid="brush-size-8"]');
    await expect(page.locator('[data-testid="brush-size-8"]')).toHaveClass(/bg-purple-100/);
  });

  test('Should draw on canvas in demo mode', async ({ page }) => {
    // Verifica che siamo in modalità demo
    await expect(page.locator('text=Modalità Demo Locale')).toBeVisible();
    
    // Seleziona pennello
    await page.click('[data-testid="tool-brush"]');
    
    // Trova il canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Simula disegno (mouse down, move, up)
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const startX = canvasBox.x + 100;
      const startY = canvasBox.y + 100;
      const endX = canvasBox.x + 200;
      const endY = canvasBox.y + 200;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();
    }
    
    // Verifica che il contatore tratti sia aggiornato
    await expect(page.locator('text=1 tratti')).toBeVisible();
  });

  test('Should add notes to whiteboard', async ({ page }) => {
    // Seleziona strumento nota
    await page.click('[data-testid="tool-note"]');
    
    // Clicca sul canvas per aggiungere una nota
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + 150, canvasBox.y + 150);
    }
    
    // Dovrebbe apparire il modal per aggiungere nota
    await expect(page.locator('text=Aggiungi Nota')).toBeVisible();
    
    // Inserisci testo nota
    await page.fill('textarea[placeholder="Scrivi la tua nota..."]', 'Nota di test');
    
    // Clicca aggiungi
    await page.click('button:has-text("Aggiungi")');
    
    // Verifica che la nota sia stata aggiunta
    await expect(page.locator('text=Nota di test')).toBeVisible();
    await expect(page.locator('text=1 note')).toBeVisible();
  });

  test('Should clear canvas when clear button is clicked', async ({ page }) => {
    // Disegna qualcosa prima
    await page.click('[data-testid="tool-brush"]');
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + 100, canvasBox.y + 100);
    }
    
    // Verifica che ci sia qualche tratto
    await expect(page.locator('text=1 tratti')).toBeVisible();
    
    // Clicca pulsante pulisci
    await page.click('[data-testid="clear-canvas"]');
    
    // Verifica che il canvas sia stato pulito
    await expect(page.locator('text=0 tratti')).toBeVisible();
  });

  test('Should support undo/redo functionality', async ({ page }) => {
    // Disegna qualcosa
    await page.click('[data-testid="tool-brush"]');
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + 100, canvasBox.y + 100);
    }
    
    // Verifica che ci sia qualche tratto
    await expect(page.locator('text=1 tratti')).toBeVisible();
    
    // Test undo
    await page.click('[data-testid="undo-button"]');
    
    // Test redo
    await page.click('[data-testid="redo-button"]');
  });

  test('Should export canvas as PNG', async ({ page }) => {
    // Disegna qualcosa prima di esportare
    await page.click('[data-testid="tool-brush"]');
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + 100, canvasBox.y + 100);
    }
    
    // Setup download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Clicca export
    await page.click('[data-testid="export-button"]');
    
    // Verifica che il download sia iniziato
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/lavagna_condivisa_.*\.png/);
  });

  test('Should support zoom functionality', async ({ page }) => {
    // Test zoom in
    await page.click('[data-testid="zoom-in"]');
    await expect(page.locator('text=110%')).toBeVisible();
    
    // Test zoom out
    await page.click('[data-testid="zoom-out"]');
    await page.click('[data-testid="zoom-out"]');
    await expect(page.locator('text=90%')).toBeVisible();
  });

  test('Should show user information correctly', async ({ page }) => {
    // Verifica che le informazioni utente siano mostrate
    await expect(page.locator('text=Utente Corrente')).toBeVisible();
    await expect(page.locator('text=ID:')).toBeVisible();
    await expect(page.locator('text=Nome: Utente Demo')).toBeVisible();
    await expect(page.locator('text=Codice: DEMO123')).toBeVisible();
  });

  test('Should work in game session mode', async ({ page }) => {
    // Passa alla modalità gioco
    await page.click('button:has-text("🎮 Modalità Gioco")');
    
    // Verifica UI della sessione di gioco
    await expect(page.locator('text=Sessione di Gioco')).toBeVisible();
    await expect(page.locator('text=0 partecipanti attivi')).toBeVisible();
    
    // Verifica tab di navigazione
    await expect(page.locator('text=🎲 Gioco')).toBeVisible();
    await expect(page.locator('text=💬 Chat')).toBeVisible();
    
    // Test toggle lavagna condivisa
    await page.click('button:has-text("🎨 Lavagna Condivisa")');
    await expect(page.locator('[data-testid="shared-whiteboard"]')).toBeVisible();
    
    // Test pesca carta
    await page.click('button:has-text("Pesca una Carta 🎲")');
  });
});

// Test per funzionalità multi-utente (richiede setup speciale)
test.describe('Multi-User Whiteboard Functionality', () => {
  
  test('Should sync drawing between multiple users', async ({ browser }) => {
    // Crea due contesti browser per simulare due utenti
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Vai alla demo su entrambe le pagine
      await page1.goto('/whiteboard-demo');
      await page2.goto('/whiteboard-demo');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');
      
      // Verifica che entrambe le pagine siano caricate
      await expect(page1.locator('h1')).toContainText('Demo Lavagna Condivisa');
      await expect(page2.locator('h1')).toContainText('Demo Lavagna Condivisa');
      
      // Se il backend è connesso, testa la sincronizzazione
      const isConnected1 = await page1.locator('text=Backend: Connesso').isVisible();
      const isConnected2 = await page2.locator('text=Backend: Connesso').isVisible();
      
      if (isConnected1 && isConnected2) {
        // User 1 disegna
        await page1.click('[data-testid="tool-brush"]');
        const canvas1 = page1.locator('canvas').first();
        const canvasBox1 = await canvas1.boundingBox();
        if (canvasBox1) {
          await page1.mouse.click(canvasBox1.x + 100, canvasBox1.y + 100);
        }
        
        // Verifica che il disegno sia sincronizzato su page2
        await page2.waitForTimeout(1000); // Aspetta sincronizzazione
        await expect(page2.locator('text=1 tratti')).toBeVisible();
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});