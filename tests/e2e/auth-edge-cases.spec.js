import { test, expect } from '@playwright/test';

/**
 * Test Edge Cases Autenticazione
 * 
 * Copertura scenari critici:
 * - Password deboli, caratteri speciali
 * - Nomi duplicati, input vuoti 
 * - Validazione lato client/server
 * - Tentativi di registrazione/login non validi
 */
test.describe('Authentication Edge Cases', () => {
  
  test('Validazione password deboli e caratteri speciali', async ({ page }) => {
    await page.goto('/');
    
    // Vai a registrazione
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test password troppo corta
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'TestUser');
    await page.getByTestId('password-input').fill('123');
    await page.getByTestId('confirm-password-input').fill('123');
    
    // Bottone dovrebbe essere disabilitato per password < 4 caratteri
    const submitButton = page.getByTestId('submit-auth');
    await expect(submitButton).toBeDisabled();
    
    // Test password con caratteri speciali
    await page.getByTestId('password-input').fill('test@#$%');
    await page.getByTestId('confirm-password-input').fill('test@#$%');
    await expect(submitButton).toBeEnabled();
    
    // Test password con emoji
    await page.getByTestId('password-input').fill('test😀🎮');
    await page.getByTestId('confirm-password-input').fill('test😀🎮');
    await expect(submitButton).toBeEnabled();
    
    // Test password molto lunga
    const longPassword = 'a'.repeat(100);
    await page.getByTestId('password-input').fill(longPassword);
    await page.getByTestId('confirm-password-input').fill(longPassword);
    await expect(submitButton).toBeEnabled();
    
    console.log('✅ Test password speciali completato');
  });

  test('Validazione nomi con caratteri speciali e unicità', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test nome con caratteri speciali
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'User@#$%');
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('confirm-password-input').fill('test123');
    
    const submitButton = page.getByTestId('submit-auth');
    await submitButton.click();
    
    // Attendi risultato
    await expect(page.locator('text=Ciao User@#$%')).toBeVisible({ timeout: 10000 });
    
    // Logout per testare nome duplicato
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();
    
    // Prova a registrare stesso nome
    await registerTab.click();
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'User@#$%');
    await page.getByTestId('password-input').fill('different123');
    await page.getByTestId('confirm-password-input').fill('different123');
    await submitButton.click();
    
    // Dovrebbe mostrare errore utente esistente
    await expect(page.locator('text=Utente esistente')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Test nomi speciali e duplicati completato');
  });

  test('Input vuoti e validazione form', async ({ page }) => {
    await page.goto('/');
    
    // Test form registrazione vuoto
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    const submitButton = page.getByTestId('submit-auth');
    
    // Bottone disabilitato con campi vuoti
    await expect(submitButton).toBeDisabled();
    
    // Nome vuoto, password piena
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('confirm-password-input').fill('test123');
    await expect(submitButton).toBeDisabled();
    
    // Nome con spazi, dovrebbe essere disabilitato
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', '   ');
    await expect(submitButton).toBeDisabled();
    
    // Nome valido, password non coincidenti
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'ValidUser');
    await page.getByTestId('confirm-password-input').fill('different');
    await expect(submitButton).toBeDisabled();
    
    // Test login con campi vuoti
    const loginTab = page.getByRole('tab', { name: /Login/i });
    await loginTab.click();
    
    await expect(submitButton).toBeDisabled();
    
    // Nome senza password
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'SomeUser');
    await expect(submitButton).toBeDisabled();
    
    console.log('✅ Test validazione form completato');
  });

  test('Caratteri Unicode e internazionalizzazione', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test nomi in diverse lingue
    const unicodeNames = [
      'José María',
      'François',
      '山田太郎',
      'محمد',
      'Владимир',
      'Αλέξανδρος'
    ];
    
    for (const name of unicodeNames) {
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', '');
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', name);
      await page.getByTestId('password-input').fill('test123');
      await page.getByTestId('confirm-password-input').fill('test123');
      
      const submitButton = page.getByTestId('submit-auth');
      await expect(submitButton).toBeEnabled();
      
      // Prova registrazione
      await submitButton.click();
      
      // Verifica se è riuscita o se c'è errore
      try {
        await expect(page.locator(`text=Ciao ${name}`)).toBeVisible({ timeout: 5000 });
        console.log(`✅ Nome unicode "${name}" registrato con successo`);
        
        // Logout per prossimo test
        const logoutButton = page.getByRole('button', { name: /logout/i });
        await logoutButton.click();
        await registerTab.click();
      } catch (error) {
        console.log(`⚠️ Nome unicode "${name}" ha generato errore (previsto per alcuni caratteri)`);
        // Reset form per prossimo test
        await page.reload();
        await registerTab.click();
      }
    }
    
    console.log('✅ Test caratteri Unicode completato');
  });

  test('Injection e sicurezza input', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test potenziali injection attacks
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '${7*7}',
      '{{7*7}}',
      '<img src=x onerror=alert(1)>',
      '" OR 1=1 --',
      "'; DROP TABLE users; --"
    ];
    
    for (const maliciousInput of maliciousInputs) {
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', maliciousInput);
      await page.getByTestId('password-input').fill('test123');
      await page.getByTestId('confirm-password-input').fill('test123');
      
      const submitButton = page.getByTestId('submit-auth');
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        
        // Verifica che non ci siano alert popup (XSS)
        const hasAlert = await page.evaluate(() => {
          return new Promise(resolve => {
            const originalAlert = window.alert;
            window.alert = () => {
              resolve(true);
              window.alert = originalAlert;
            };
            setTimeout(() => resolve(false), 1000);
          });
        });
        
        expect(hasAlert).toBeFalsy();
        
        // Se registrazione riuscita, verifica che l'input sia stato sanitizzato
        try {
          await expect(page.locator(`text=Ciao ${maliciousInput}`)).toBeVisible({ timeout: 3000 });
          console.log(`⚠️ Input potenzialmente pericoloso "${maliciousInput}" non sanitizzato`);
        } catch {
          console.log(`✅ Input "${maliciousInput}" bloccato o sanitizzato`);
        }
        
        // Reset per prossimo test
        await page.reload();
        await registerTab.click();
      }
    }
    
    console.log('✅ Test sicurezza injection completato');
  });

  test('Gestione errori di rete durante autenticazione', async ({ page }) => {
    await page.goto('/');
    
    // Intercetta requests per simulare errori di rete
    await page.route('**/api/connect-user', route => {
      route.abort('connectionfailed');
    });
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'NetworkErrorUser');
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('confirm-password-input').fill('test123');
    
    const submitButton = page.getByTestId('submit-auth');
    await submitButton.click();
    
    // Dovrebbe mostrare errore di connessione
    await expect(page.locator('text=Errore di autenticazione')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Test errori di rete completato');
  });
});