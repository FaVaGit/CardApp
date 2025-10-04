import { test, expect } from '@playwright/test';
import { connectUser, pollSnapshot } from './utils.js';
import { drawCard, waitForCardDrawEvent, getClientState } from './lib/serviceHelpers.js';

// Smoke test: verifica che due utenti possano formare una coppia, avviare (auto) una sessione
// e che il draw card emetta un evento sessionUpdated sincronizzato lato client.

async function extractUserId(page) {
  return await page.evaluate(() => {
    const api = window.__apiService; return api ? api.userId : null;
  });
}

async function extractPersonalCode(page) {
  return await page.locator('text=/Codice:/i').first().innerText().then(t => (t.match(/Codice:\s*(\w+)/i)||[])[1]).catch(()=>null);
}

// Helper: l'utente B inserisce il codice di A per join-couple
async function joinWithCode(page, code) {
  // Vai alla tab "Entra in Coppia" o similare se presente
  const joinTab = page.getByRole('tab', { name: /Coppia|Entra|Join/i });
  if (await joinTab.count()) {
    await joinTab.click();
  }
  // Campo codice (accetta varie label Italiane)
  const codeInput = page.locator('input[placeholder*="codice" i], input[name="code"], input[name="userCode"]');
  await codeInput.first().fill(code);
  // Pulsante invio (es. "Unisciti" / "Conferma")
  const submit = page.getByRole('button', { name: /Unisciti|Conferma|Join/i }).first();
  await submit.click();
}

test.describe('Card Draw Smoke', () => {
  test('disegno carta sincronizza evento sessionUpdated', async ({ browser }) => {
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    // Connette utente A e B
    await connectUser(pageA, 'Alice');
    await connectUser(pageB, 'Bob');

    const codeA = await extractPersonalCode(pageA);
    expect(codeA).toBeTruthy();

    // B inserisce codice di A
    await joinWithCode(pageB, codeA);

    // Recupera userId A e B
    const userA = await extractUserId(pageA);
    const userB = await extractUserId(pageB);

    // Poll snapshot per A fino a coppia formata + eventuale sessione
    const snapA = await pollSnapshot(pageA, { userId: userA, predicate: s => !!s?.status?.coupleId && (!!s.gameSession || !!s.partnerInfo) });
    expect(snapA.success).toBeTruthy();

    // Assicura anche lato B la coppia
    const snapB = await pollSnapshot(pageB, { userId: userB, predicate: s => !!s?.status?.coupleId });
    expect(snapB.success).toBeTruthy();

    // Attende che il client A abbia sessionId (auto start possibile)
    await expect.poll(async () => (await getClientState(pageA))?.sessionId ? 1 : 0, { timeout: 15000 }).toBeGreaterThan(0);

    // Registra listener evento prima del draw
    const waitEvtPromise = waitForCardDrawEvent(pageA, { timeoutMs: 8000 });
    const card = await drawCard(pageA);
    expect(card).toBeTruthy();

    const evtResult = await waitEvtPromise;
    expect(evtResult.success).toBeTruthy();
    expect(evtResult.event?.card?.id).toBeTruthy();
  });
});
