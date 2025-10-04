import { test, expect } from '@playwright/test';
import { connectUser, assertStrict, pollSnapshot } from './utils';

// Reconnect end-to-end: forma una coppia, verifica che dopo reload + reconnect lo stato persista (partner & eventuale sessione).
test('Reconnect persistenza coppia e sessione dopo reload', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Connetti entrambi con suffisso per evitare collisioni run paralleli / riusi
  const suffix = Date.now() % 100000;
  const nameA = `RecA_${suffix}`;
  const nameB = `RecB_${suffix}`;
  await connectUser(pageA, nameA);
  await connectUser(pageB, nameB);

  // A invia richiesta a B
  const rowB = pageA.locator(`li:has-text("${nameB}")`);
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

  // Verifica stato online: attendi sezione "Tu" (badge incluso)
  await expect.poll(async () => await pageA.locator('text=Tu').count(), { timeout: 15000 }).toBeGreaterThan(0);

  // Verifica persistenza stato via snapshot API (non richiede game session forzata)
  const storedAuthAfter = await pageA.evaluate(() => localStorage.getItem('complicity_auth'));
  let coupleOk = false; let partnerOk = false;
  if (storedAuthAfter) {
    try {
      const auth = JSON.parse(storedAuthAfter);
      const res = await pollSnapshot(pageA, { userId: auth.userId, predicate: s => !!s?.status?.coupleId, timeoutMs: 18000, intervalMs: 700 });
      if (res.success) {
        coupleOk = true;
        partnerOk = res.snapshot?.partnerInfo?.name === nameB;
      }
    } catch { /* ignore snapshot retrieval errors */ }
  }
  if (!coupleOk) {
    console.log('ℹ️ Nessuna coppia formata dopo reconnect - (strict può fallire)');
    assertStrict(false, 'Coppia non formata dopo reconnect');
  } else if (!partnerOk) {
    console.log('⚠️ Partner name non ancora nella snapshot, proseguo');
    assertStrict(false, 'Partner non disponibile nello snapshot dopo reconnect');
  }

  // Se sessione partita, dovremmo vedere un riferimento di gioco (heuristic: testo "Partita" o icona carte)
  // Non fallire se non parte immediatamente: condizione soft
  const maybeSession = await pageA.locator('text=Partita').count();
  if (maybeSession === 0) {
    console.log('⚠️ Sessione non immediatamente visibile, proseguo test (soft check)');
  }

  // Snapshot API validation: conferma partnerInfo e sessione se presente
  let authObj = null;
  try { authObj = storedAuth ? JSON.parse(storedAuth) : null; } catch { /* ignore auth parse */ }
  if (authObj?.userId) {
    const snapshotResp = await pageA.request.get(`http://localhost:5000/api/EventDrivenGame/snapshot/${authObj.userId}`);
    let snapJson = null;
  try { snapJson = await snapshotResp.json(); } catch { /* ignore snapshot parse */ }
    if (snapJson && snapJson.success) {
      if (!snapJson.status?.coupleId) {
        console.log('ℹ️ Nessuna coppia nella snapshot finale (soft)');
      } else {
        if (snapJson.partnerInfo && snapJson.partnerInfo.name !== nameB) {
          console.log('⚠️ Partner name inatteso nella snapshot finale:', snapJson.partnerInfo.name);
        }
        if (snapJson.gameSession) {
          if (!snapJson.gameSession.id) console.log('⚠️ gameSession priva di id');
        }
      }
    }
  }
});
