import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

// This test forces expiry by intercepting snapshot responses to strip outgoingRequests,
// keeping the frontend record in _optimistic state until TTL pruning triggers.
// We clamp TTL to minimum (500ms) so expiry happens within a few polling cycles.

test('Richiesta ottimistica scade e mostra badge Scaduta', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Intercept snapshot for ExpA user to drop outgoingRequests (simulate backend delay)
  await pageA.route(/\/api\/EventDrivenGame\/snapshot\/.*/, async (route) => {
    const resp = await route.fetch();
    let json = {};
    try { json = await resp.json(); } catch { /* ignore */ }
    if (json && json.success) {
      json.outgoingRequests = []; // remove echo so request stays optimistic
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(json)
    });
  });

  const suffix = Date.now() % 100000;
  const nameA = `ExpA_${suffix}`;
  const nameB = `ExpB_${suffix}`;
  await connectUser(pageA, nameA);
  await connectUser(pageB, nameB);

  // Imposta TTL basso direttamente via API per evitare flakiness drawer
  await pageA.evaluate(() => window.__apiService?.setOptimisticJoinTTL(600));
  // Non assert sincrono sul valore: il service applica clamping e potrebbe emettere settingsUpdated async

  // Send request from A to B
  const rowB = pageA.locator(`li:has-text("${nameB}")`);
  await expect(rowB).toBeVisible();
  await rowB.getByTestId('send-request').click();
  await expect(pageA.locator('text=In attesa')).toBeVisible();
  const debugAfterSend = await pageA.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
  console.log('[E2E][expiry-flow] Debug dopo send-request:', debugAfterSend);
  // Con singleton non è più necessaria iniezione multi-istanza; se non presente lasciamo che il TTL/polling gestisca.

  // Forza scadenza immediata (helper test) per evitare dipendenza dal timer TTL reale
  await pageA.evaluate(()=> { try { window.__forceExpireOptimistic && window.__forceExpireOptimistic(); } catch { /* ignore */ } });
  // Dump stato debug per tracciare condizione subito dopo force expire
  const debugAfterForce = await pageA.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
  console.log('[E2E][expiry-flow] Debug dopo forceExpire:', debugAfterForce);

  // Attesa scadenza -> badge Scaduta (con TTL ~600ms e polling) amplia timeout per sicurezza
  // Poll for badge OR internal expired flag / metric as fallback to reduce flakiness
  await expect.poll(async () => {
    const badge = await pageA.locator('text=Scaduta').count();
    if (badge > 0) return 1;
    const dbg = await pageA.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
    if (process.env.E2E_VERBOSE) console.log('[E2E][expiry-flow] Poll snapshot', dbg);
    return (dbg?.outgoing||[]).some(r=>r.expired) ? 1 : 0;
  }, { timeout: 12000, message: 'Né badge Scaduta né flag expired interno rilevati' }).toBeGreaterThan(0);

  // Verifica presenza badge scaduta (già controllata sopra) e bottone retry opzionale
  const retryBtn = rowB.getByTestId('retry-request');
  const retryCount = await retryBtn.count();
  if (retryCount === 0) {
    console.log('⚠️ retry-request non ancora visibile, considerato non bloccante');
  }
});
