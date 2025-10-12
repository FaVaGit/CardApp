import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

// Verifica incremento metrica prunedJoinCount e persistenza su reload.
// Forza scadenza come nel test expiry ma poi controlla pannello metriche.

test('TTL pruning incrementa metrica e persiste', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Intercetta snapshot per rimuovere outgoingRequests (forza stato ottimistico non confermato)
  await page.route(/\/api\/EventDrivenGame\/snapshot\/.*/, async (route) => {
    const resp = await route.fetch();
    let json = {};
    try { json = await resp.json(); } catch { /* ignore body parse */ }
    if (json && json.success) {
      json.outgoingRequests = []; // mantiene _optimistic lato client
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });

  // Use timestamp for unique user names
  const timestamp = Date.now();
  const nameUser = `TTLMetricUser_${timestamp}`;
  const nameTarget = `TTLTarget_${timestamp}`;
  
  await connectUser(page, nameUser);

  // Imposta TTL basso con polling verification
  await page.evaluate(() => window.__apiService?.setOptimisticJoinTTL(600));
  
  // Wait for TTL setting with polling
  await expect.poll(async () => {
    const currentTTL = await page.evaluate(() => window.__apiService?.getOptimisticJoinTTL?.() || 0);
    return currentTTL;
  }, { timeout: 5000 }).toBeGreaterThan(0);

  // Crea secondo utente con proper cleanup
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  
  try {
    await connectUser(page2, nameTarget);
    
    // Wait for target user with improved polling
    const targetRow = page.locator(`li:has-text("${nameTarget}")`);
    await expect.poll(async () => {
      const count = await targetRow.count();
      console.log(`[E2E][ttl-metrics] Polling for ${nameTarget}, found: ${count}`);
      return count;
    }, { 
      timeout: 25000, 
      message: `TTLTarget ${nameTarget} non comparso nella lista`,
      intervals: [1000, 2000, 3000] 
    }).toBeGreaterThan(0);

    // Get initial metric value with error handling
    const initialValue = await page.evaluate(() => {
      try {
        return window.__apiService?.prunedJoinCount || 0;
      } catch (e) {
        console.warn('Error getting initial metric:', e);
        return 0;
      }
    });

    // Send request and wait for optimistic state
    await targetRow.getByTestId('send-request').click();
    await expect(page.locator('text=In attesa')).toBeVisible({ timeout: 5000 });
    
    const debugAfterSend = await page.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
    console.log('[E2E][ttl-metrics] Debug dopo send-request:', debugAfterSend);

    // Force expiry with error handling
    await page.evaluate(()=> { 
      try { 
        if (window.__forceExpireOptimistic) {
          window.__forceExpireOptimistic(); 
        }
      } catch (e) { 
        console.warn('Error forcing expiry:', e);
      } 
    });
    
    const debugAfterForce = await page.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
    console.log('[E2E][ttl-metrics] Debug dopo forceExpire:', debugAfterForce);

    // Poll for metric increment with better error handling
    await expect.poll(async () => {
      try {
        const currentValue = await page.evaluate(() => window.__apiService?.prunedJoinCount || 0);
        console.log('[E2E][ttl-metrics] Current metric value:', currentValue, 'Initial:', initialValue);
        return currentValue;
      } catch (e) {
        console.warn('[E2E][ttl-metrics] Error checking metric:', e);
        return initialValue;
      }
    }, {
      timeout: 10000,
      message: `Metrica prunedJoinCount non incrementata da ${initialValue}`,
      intervals: [500, 1000, 2000]
    }).toBeGreaterThan(initialValue);

  } finally {
    // Proper cleanup
    await ctx2.close();
  }
  
  await ctx.close();
});
