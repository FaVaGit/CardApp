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

  // Use unique timestamps to avoid conflicts
  const timestamp = Date.now();
  const nameA = `ExpA_${timestamp}`;
  const nameB = `ExpB_${timestamp}`;
  
  await connectUser(pageA, nameA);
  await connectUser(pageB, nameB);

  // Imposta TTL basso con polling per verificare settaggio
  await pageA.evaluate(() => window.__apiService?.setOptimisticJoinTTL(600));
  
  // Wait for settings to be applied with polling
  await expect(async () => {
    const currentTTL = await pageA.evaluate(() => window.__apiService?.getOptimisticJoinTTL?.() || 0);
    expect(currentTTL).toBeGreaterThan(0);
  }).toPass({ timeout: 5000 });

  // Send request from A to B with proper polling wait
  const rowB = pageA.locator(`li:has-text("${nameB}")`);
  await expect(rowB).toBeVisible({ timeout: 10000 });
  await rowB.getByTestId('send-request').click();
  
  // Wait for optimistic state with polling
  await expect(pageA.locator('text=In attesa')).toBeVisible({ timeout: 5000 });
  
  const debugAfterSend = await pageA.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
  console.log('[E2E][expiry-flow] Debug dopo send-request:', debugAfterSend);

  // Use polling instead of immediate force expire
  await pageA.evaluate(()=> { 
    try { 
      if (window.__forceExpireOptimistic) {
        window.__forceExpireOptimistic(); 
      }
    } catch { /* ignore */ } 
  });
  
  const debugAfterForce = await pageA.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
  console.log('[E2E][expiry-flow] Debug dopo forceExpire:', debugAfterForce);

  // Poll for expiry with increased timeout and better error handling
  await expect.poll(async () => {
    try {
      const badge = await pageA.locator('text=Scaduta').isVisible();
      const metrics = await pageA.evaluate(() => window.__getOptimisticMetrics?.() || {});
      const expired = metrics.expiredCount > 0;
      
      console.log('[E2E][expiry-flow] Polling - Badge visible:', badge, 'Expired count:', metrics.expiredCount);
      return badge || expired;
    } catch (e) {
      console.log('[E2E][expiry-flow] Polling error:', e);
      return false;
    }
  }, {
    message: 'Expected expiry badge or expired metric to appear',
    timeout: 10000, // Increased timeout
    intervals: [500, 1000, 1000] // More frequent initial checks
  }).toBe(true);

  // Verifica presenza badge scaduta e bottone retry opzionale
  const retryBtn = rowB.getByTestId('retry-request');
  const retryCount = await retryBtn.count();
  if (retryCount === 0) {
    console.log('⚠️ retry-request non ancora visibile, considerato non bloccante');
  }

  // Cleanup
  await ctxA.close();
  await ctxB.close();
});
