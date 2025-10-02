import { expect } from '@playwright/test';

export async function connectUser(page, name) {
  await page.goto('/');

  // Clicca sempre tab Registrati se presente (nuovo utente baseline)
  const registerTab = page.getByRole('tab', { name: /Registrati/i });
  if (await registerTab.count()) {
    await registerTab.click();
  }

  // Compila form registrazione
  await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', name);
  // Nickname opzionale se campo presente
  const nicknameField = page.locator('input[label="Nickname"], input[placeholder*="Nickname"], input[name="nickname"]');
  if (await nicknameField.count()) {
    try { await nicknameField.first().fill(name + 'Nick'); } catch {}
  }
  if (await page.getByTestId('password-input').count()) {
    await page.getByTestId('password-input').fill('e2e1');
  }
  if (await page.getByTestId('confirm-password-input').count()) {
    await page.getByTestId('confirm-password-input').fill('e2e1');
  }
  const submitBtn = page.getByTestId('submit-auth').first();
  await expect(submitBtn).toBeEnabled({ timeout: 5000 });
  await submitBtn.click();

  // Se appare errore utente esistente / utente già registrato -> fallback login
  const existingError = page.locator('text=/Utente esistente|Utente già|Utente non registrato/i');
  if (await existingError.first().isVisible({ timeout: 1500 }).catch(()=>false)) {
    const loginTab = page.getByRole('tab', { name: /Login/i });
    if (await loginTab.count()) {
      await loginTab.click();
      // Riempi password e submit login
      if (await page.getByTestId('password-input').count()) {
  await page.getByTestId('password-input').fill('e2e1');
      }
      await expect(submitBtn).toBeEnabled({ timeout: 5000 });
      await submitBtn.click();
    }
  }

  // Attendi comparsa UI lobby o directory utenti
  await expect.poll(async () => {
    const lobbyTitle = await page.locator('text=/Lobby di Coppia/i').count();
    const codeLabel = await page.locator('text=/Codice:/i').count();
    const userListItems = await page.locator('li[class*="p-3"]').count();
    const authStored = await page.evaluate(()=> !!localStorage.getItem('complicity_auth'));
    return (lobbyTitle + codeLabel + userListItems + (authStored?1:0)) > 0 ? 1 : 0;
  }, { timeout: 25000, message: 'Lobby non caricata' }).toBeGreaterThan(0);
  // Piccolo log diagnostico
    if (process.env.E2E_VERBOSE) {
      const snippet = await page.evaluate(() => document.body.innerHTML.slice(0, 600));
      console.log('[E2E] Post-auth snippet:\n', snippet);
    }
}

export async function waitForRequestTag(page) {
  await expect(page.locator('text=Richiesta per te')).toBeVisible({ timeout: 10000 });
}
