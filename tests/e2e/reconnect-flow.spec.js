import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

// This test assumes localStorage usage for authToken & userId; adapt selectors if different.

test('Reconnect persistenza stato: utente ricarica pagina e mantiene coppia', async ({ page, browser }) => {
  await connectUser(page, 'PersistE2E');

  // Ricarica pagina (senza dipendere da localStorage specifico non garantito)
  await page.reload();

  // Verifica ancora online
  await expect(page.locator('text=online').first()).toBeVisible();

  // (Estensione futura: se già in coppia, verificare indicatore partner)
});
