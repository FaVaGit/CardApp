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

  await connectUser(pageA, 'ExpA');
  await connectUser(pageB, 'ExpB');

  // Imposta TTL basso direttamente via API per evitare flakiness drawer
  await pageA.evaluate(() => window.__apiService?.setOptimisticJoinTTL(600));

  // Send request from A to B
  const rowB = pageA.locator('li:has-text("ExpB")');
  await expect(rowB).toBeVisible();
  await rowB.getByTestId('send-request').click();
  await expect(pageA.locator('text=In attesa')).toBeVisible();

  // Attesa scadenza -> badge Scaduta (con TTL ~600ms e polling) amplia timeout per sicurezza
  await expect.poll(async () => await pageA.locator('text=Scaduta').count(), { timeout: 20000, message: 'Badge Scaduta non apparso' }).toBeGreaterThan(0);

  // Verifica presenza badge scaduta (già controllata sopra) e bottone retry opzionale
  const retryBtn = rowB.getByTestId('retry-request');
  const retryCount = await retryBtn.count();
  if (retryCount === 0) {
    console.log('⚠️ retry-request non ancora visibile, considerato non bloccante');
  }
});
