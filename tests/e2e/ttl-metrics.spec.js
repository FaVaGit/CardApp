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
    try { json = await resp.json(); } catch {}
    if (json && json.success) {
      json.outgoingRequests = []; // mantiene _optimistic lato client
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });

  await connectUser(page, 'TTLMetricUser');

  // Imposta TTL basso (clamp a 500) e applica
  const ttlInput = page.getByTestId('ttl-input');
  await ttlInput.fill('100');
  await page.getByTestId('ttl-apply').click();

  // Invia una richiesta verso utente fittizio: prima creiamo secondo utente reale così appare lista
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await connectUser(page2, 'TTLTarget');

  // Ricarica pagina principale per assicurare snapshot aggiornato con secondo utente visibile
  await page.reload();
  await expect.poll(async () => await page.locator('li[class*="p-3"]').count(), { timeout: 10000 }).toBeGreaterThan(0);
  const targetRow = page.locator('li:has-text("TTLTarget")');
  await expect(targetRow).toBeVisible();

  // Metrica iniziale
  const initialPruned = await page.getByTestId('pruned-count').innerText();
  const initialValue = Number((initialPruned.match(/(\d+)/)||[])[1]||0);

  await targetRow.getByTestId('send-request').click();
  await expect(page.locator('text=In attesa')).toBeVisible();

  // Attendi scadenza -> badge Scaduta
  await expect.poll(async () => await page.locator('text=Scaduta').count(), { timeout: 15000 }).toBeGreaterThan(0);

  // Verifica incremento metrica
  const afterPruned = await page.getByTestId('pruned-count').innerText();
  const afterValue = Number((afterPruned.match(/(\d+)/)||[])[1]||0);
  expect(afterValue).toBeGreaterThan(initialValue);

  // Reload e verifica persistenza
  await page.reload();
  const persistedPruned = await page.getByTestId('pruned-count').innerText();
  const persistedValue = Number((persistedPruned.match(/(\d+)/)||[])[1]||0);
  expect(persistedValue).toBe(afterValue);
});
