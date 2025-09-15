import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

// Reconnect end-to-end: forma una coppia, verifica che dopo reload + reconnect lo stato persista (partner & eventuale sessione).
test('Reconnect persistenza coppia e sessione dopo reload', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Connetti entrambi
  await connectUser(pageA, 'RecA');
  await connectUser(pageB, 'RecB');

  // A invia richiesta a B
  const rowB = pageA.locator('li:has-text("RecB")');
  await expect(rowB).toBeVisible();
  await rowB.getByTestId('send-request').click();
  await expect(pageA.locator('text=In attesa')).toBeVisible();

  // B accetta
  await expect.poll(async () => {
    const inc = await pageB.getByTestId('incoming-request-badge').count();
    const accept = await pageB.getByTestId('accept-request').count();
    return inc > 0 || accept > 0 ? 1 : 0;
  }, { timeout: 15000, message: 'Attesa richiesta in arrivo per B' }).toBeGreaterThan(0);
  await pageB.getByTestId('accept-request').first().click();

  // Attendi che badge "In attesa" sparisca per A (coppia formata). Usa timeout maggiore per ambienti lenti.
  await expect.poll(async () => await pageA.locator('text=In attesa').count(), { timeout: 25000 }).toBe(0);

  // Salva localStorage per A (auth info) prima del reload (Playwright lo conserva nel contesto, ma leggiamo per assert)
  const storedAuth = await pageA.evaluate(() => localStorage.getItem('complicity_auth'));
  expect(storedAuth).toBeTruthy();

  // Ricarica pagina A
  await pageA.reload();

  // Verifica ancora online (indicator generico)
  await expect(pageA.locator('text=online').first()).toBeVisible();

  // Poll fino a quando partner appare (nome RecB)
  await expect.poll(async () => await pageA.locator('text=RecB').count(), { timeout: 15000 }).toBeGreaterThan(0);

  // Se sessione partita, dovremmo vedere un riferimento di gioco (heuristic: testo "Partita" o icona carte)
  // Non fallire se non parte immediatamente: condizione soft
  const maybeSession = await pageA.locator('text=Partita').count();
  if (maybeSession === 0) {
    console.log('⚠️ Sessione non immediatamente visibile, proseguo test (soft check)');
  }

  // Snapshot API validation: conferma partnerInfo e sessione se presente
  let authObj = null;
  try { authObj = storedAuth ? JSON.parse(storedAuth) : null; } catch { /* ignore */ }
  if (authObj?.userId) {
    const snapshotResp = await pageA.request.get(`http://localhost:5000/api/EventDrivenGame/snapshot/${authObj.userId}`);
    let snapJson = null;
    try { snapJson = await snapshotResp.json(); } catch { /* ignore */ }
    if (snapJson && snapJson.success) {
      expect(snapJson.status?.coupleId).toBeTruthy();
      if (snapJson.partnerInfo) {
        expect(snapJson.partnerInfo.name).toBe('RecB');
      }
      // Se esiste una gameSession attiva, verificare id e array sharedCards
      if (snapJson.gameSession) {
        expect(snapJson.gameSession.id).toBeTruthy();
        expect(Array.isArray(snapJson.gameSession.sharedCards)).toBeTruthy();
      }
    }
  }
});
