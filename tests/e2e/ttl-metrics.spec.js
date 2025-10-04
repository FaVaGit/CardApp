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

  const suffix = Date.now() % 100000;
  const nameUser = `TTLMetricUser_${suffix}`;
  const nameTarget = `TTLTarget_${suffix}`;
  await connectUser(page, nameUser);

  // Imposta TTL basso direttamente via API esposta (evita interazioni UI fragili)
  await page.evaluate(() => window.__apiService?.setOptimisticJoinTTL(600));
  // Evita assert immediato: clamping + event emission asincrona

  // Crea secondo utente reale così appare nella lista (polling periodico in UserDirectory)
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await connectUser(page2, nameTarget);
  // Attendi comparsa utente target senza ricaricare (evita perdere route intercept / stato)
  const targetRow = page.locator(`li:has-text("${nameTarget}")`);
  await expect.poll(async () => await targetRow.count(), { timeout: 20000, message: 'TTLTarget non comparso nella lista' }).toBeGreaterThan(0);

  // Metrica iniziale (via API service esposto, evita dipendenza dal pannello TTL)
  const initialValue = await page.evaluate(() => window.__apiService?.prunedJoinCount || 0);

  await targetRow.getByTestId('send-request').click();
  await expect(page.locator('text=In attesa')).toBeVisible();
  const debugAfterSend = await page.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
  console.log('[E2E][ttl-metrics] Debug dopo send-request:', debugAfterSend);

  // Forza scadenza immediata tramite helper
  await page.evaluate(()=> { try { window.__forceExpireAllOptimistic ? window.__forceExpireAllOptimistic() : (window.__forceExpireOptimistic && window.__forceExpireOptimistic()); } catch {} });
  const debugAfterForce = await page.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
  console.log('[E2E][ttl-metrics] Debug dopo forceExpire:', debugAfterForce);
  await expect.poll(async () => {
    const badge = await page.locator('text=Scaduta').count();
    if (badge > 0) return 1;
    const aggregate = await page.evaluate(()=> window.__aggregateOptimisticState && window.__aggregateOptimisticState());
    if (aggregate && (aggregate.metricsTotal > initialValue || aggregate.anyExpired)) return 1;
    const dbg = await page.evaluate(()=> window.__debugOptimisticState && window.__debugOptimisticState());
    if (process.env.E2E_VERBOSE) console.log('[E2E][ttl-metrics] Poll snapshot', dbg);
    return 0;
  }, { timeout: 12000 }).toBeGreaterThan(0);

  // Verifica incremento metrica via polling su apiService
  await expect.poll(async () => {
    const agg = await page.evaluate(()=> window.__aggregateOptimisticState && window.__aggregateOptimisticState());
    return agg ? agg.metricsTotal : 0;
  }, { timeout: 15000, message: 'Metric prunedJoinCount non incrementata (aggregate)' }).toBeGreaterThan(initialValue);

  // Reload e verifica persistenza
  await page.reload();
  const persistedAgg = await page.evaluate(()=> window.__aggregateOptimisticState && window.__aggregateOptimisticState());
  expect(persistedAgg.metricsTotal).toBeGreaterThan(initialValue);
});
