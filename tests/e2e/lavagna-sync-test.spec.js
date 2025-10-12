import { test, expect } from '@playwright/test';

// Simple E2E whiteboard sync using BroadcastChannel (multi-page simulating two users)
// Assumes app served at http://localhost:5173 (Vite default). Adjust if different.

async function connectUser(page, name) {
  await page.goto('/');
  // Minimal flow: we expect a connect button or auto connect; fallback: expose window.__apiService
  await page.waitForLoadState('domcontentloaded');
  // If automatic connect occurs, wait a bit for __apiService
  await page.waitForFunction(() => !!window.__apiService, undefined, { timeout: 5000 });
  const userId = await page.evaluate(() => window.__apiService.userId);
  expect(userId).toBeTruthy();
}

function whiteboardCanvas(page) {
  return page.locator('canvas');
}

test.describe('Lavagna Sync', () => {
  test('disegno si propaga al secondo utente', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await connectUser(page1, 'Utente1');
    await connectUser(page2, 'Utente2');

    // Attendere che la lavagna sia pronta (Fabric inizializzato)
    await page1.waitForSelector('canvas');
    await page2.waitForSelector('canvas');

    // Disegna una linea sul primo utente (simulando drawing events via evaluate)
    await page1.evaluate(() => {
      const svc = window.__apiService;
      const canvasEl = document.querySelector('canvas');
      // Fabric instance attach check
      const fabricCanvas = canvasEl && canvasEl.__fabric; // if we stored reference; else try global
    });

    // Fallback: trigger whiteboard change by injecting a simple rectangle via Fabric API
    await page1.evaluate(() => {
      const fabricLib = window.fabric;
      const canvasEl = document.querySelector('canvas');
      const c = fabricLib && fabricLib.Canvas.instances ? fabricLib.Canvas.instances[0] : null;
      if (fabricLib && !c && canvasEl) {
        // Try to find from global (Whiteboard stores in closure, so we attempt a heuristic)
        // Not reliable; for test we simulate broadcast directly
        window.__apiService.syncLavagna({ sessionId: window.__apiService.sessionId || 'testSession', json: { version: Date.now(), objects: [{ type: 'rect', left: 10, top: 10, width: 40, height: 40 }] }, bgColor: '#ffffff', version: Date.now() });
      } else if (c) {
        const rect = new fabricLib.Rect({ left: 30, top: 30, width: 80, height: 50, fill: '#ff0000' });
        c.add(rect); c.renderAll();
      }
    });

    // Attendere propagazione
    await page2.waitForFunction(() => {
      const state = window.__latestLavagnaState;
      return state && state.json && state.json.objects && state.json.objects.length > 0;
    }, { timeout: 4000 });

    // Verifica presenza oggetti
    const objectsCount = await page2.evaluate(() => window.__latestLavagnaState.json.objects.length);
    expect(objectsCount).toBeGreaterThan(0);

    await context1.close();
    await context2.close();
  });
});
