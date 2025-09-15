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

  // Set TTL to a low value (will clamp to min 500)
  const ttlInput = pageA.getByTestId('ttl-input');
  if (await ttlInput.count()) {
    await ttlInput.fill('100');
    await pageA.getByTestId('ttl-apply').click();
  }

  // Send request from A to B
  const rowB = pageA.locator('li:has-text("ExpB")');
  await expect(rowB).toBeVisible();
  await rowB.getByTestId('send-request').click();
  await expect(pageA.locator('text=In attesa')).toBeVisible();

  // Wait for expiry badge
  await expect.poll(async () => await pageA.locator('text=Scaduta').count(), { timeout: 15000, message: 'Badge Scaduta non apparso' }).toBeGreaterThan(0);

  const retryBtn = rowB.getByRole('button', { name: /riprova/i });
  await expect(retryBtn).toBeVisible();
});
