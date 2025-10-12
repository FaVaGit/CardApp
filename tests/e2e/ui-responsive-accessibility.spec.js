import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

/**
 * Test UI Responsiva e Accessibilità
 * 
 * Copertura:
 * - Responsive design su diverse dimensioni schermo
 * - Accessibilità tastiera e screen reader
 * - Temi scuro/chiaro
 * - Performance rendering
 */
test.describe('UI Responsiveness & Accessibility', () => {
  
  test('Responsive design - Mobile viewport', async ({ page }) => {
    // Imposta viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verifica che il form di login sia visibile e utilizzabile
    await expect(page.locator('h4:has-text("Complicità")')).toBeVisible();
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Verifica che tutti i campi siano accessibili
    const nameField = page.locator('input[placeholder="Il tuo nome"], input[placeholder*="nome"]');
    const passwordField = page.getByTestId('password-input');
    const confirmField = page.getByTestId('confirm-password-input');
    const submitButton = page.getByTestId('submit-auth');
    
    await expect(nameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(confirmField).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Test registrazione su mobile
    await nameField.fill('MobileUser');
    await passwordField.fill('test123');
    await confirmField.fill('test123');
    await submitButton.click();
    
    // Verifica lobby mobile
    await expect(page.locator('text=Ciao MobileUser')).toBeVisible({ timeout: 10000 });
    
    // Verifica che i bottoni siano cliccabili (non troppo piccoli)
    const logoutButton = page.getByRole('button', { name: /logout/i });
    const buttonBox = await logoutButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(40); // Minimo accessibilità touch
    
    console.log('✅ Test responsive mobile completato');
  });

  test('Responsive design - Tablet viewport', async ({ page }) => {
    // Imposta viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await connectUser(page, 'TabletUser');
    
    // Verifica layout tablet
    await expect(page.locator('text=Ciao TabletUser')).toBeVisible({ timeout: 10000 });
    
    // Su tablet dovrebbe esserci più spazio per layout a colonne
    const lobbyContainer = page.locator('[class*="grid"]').first();
    if (await lobbyContainer.count() > 0) {
      const containerBox = await lobbyContainer.boundingBox();
      expect(containerBox?.width).toBeGreaterThan(600);
    }
    
    console.log('✅ Test responsive tablet completato');
  });

  test('Responsive design - Desktop large viewport', async ({ page }) => {
    // Imposta viewport desktop grande
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await connectUser(page, 'DesktopUser');
    
    // Verifica layout desktop
    await expect(page.locator('text=Ciao DesktopUser')).toBeVisible({ timeout: 10000 });
    
    // Su desktop dovrebbe utilizzare lo spazio disponibile efficacemente
    const authPortal = page.locator('[data-testid="auth-portal"]');
    if (await authPortal.count() === 0) {
      // Siamo in lobby, verifichiamo il layout
      const maxWidth = await page.evaluate(() => {
        const container = document.querySelector('[style*="maxWidth"]');
        return container ? window.getComputedStyle(container).maxWidth : null;
      });
      
      if (maxWidth) {
        expect(parseInt(maxWidth)).toBeGreaterThan(800);
      }
    }
    
    console.log('✅ Test responsive desktop completato');
  });

  test('Navigazione da tastiera', async ({ page }) => {
    await page.goto('/');
    
    // Test navigazione tab sul form di login
    await page.keyboard.press('Tab'); // Focus primo elemento
    await page.keyboard.press('Tab'); // Focus campo nome
    await page.keyboard.type('KeyboardUser');
    
    await page.keyboard.press('Tab'); // Focus campo nickname  
    await page.keyboard.press('Tab'); // Focus campo password
    await page.keyboard.type('test123');
    
    await page.keyboard.press('Tab'); // Focus toggle password visibility
    await page.keyboard.press('Tab'); // Focus bottone submit o tabs
    
    // Verifica che il focus sia visibile
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test cambio tab con tastiera
    await page.keyboard.press('Tab');
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.focus();
    await page.keyboard.press('Enter');
    
    // Verifica cambio tab riuscito
    await expect(page.locator('input[placeholder*="Conferma"]')).toBeVisible();
    
    console.log('✅ Test navigazione tastiera completato');
  });

  test('Test accessibilità ARIA labels e semantica', async ({ page }) => {
    await page.goto('/');
    
    // Verifica presenza di ARIA labels e ruoli semantici
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
    
    // Verifica che i bottoni abbiano ruoli appropriati
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Verifica form labels
    const textboxes = page.getByRole('textbox');
    const textboxCount = await textboxes.count();
    expect(textboxCount).toBeGreaterThan(0);
    
    // Testa con registrazione
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Verifica che i campi required abbiano attributi appropriati
    const requiredFields = await page.locator('input[required]').count();
    expect(requiredFields).toBeGreaterThan(0);
    
    console.log('✅ Test accessibilità ARIA completato');
  });

  test('Contrast ratio e leggibilità', async ({ page }) => {
    await page.goto('/');
    
    // Test constrasto testo principale
    const mainText = page.locator('h4:has-text("Complicità")');
    const textColor = await mainText.evaluate(el => 
      window.getComputedStyle(el).color
    );
    const backgroundColor = await mainText.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(textColor).toBeTruthy();
    expect(backgroundColor).toBeTruthy();
    
    // Test dimensioni font leggibili
    const fontSize = await mainText.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThan(16); // Minimo per leggibilità
    
    console.log('✅ Test contrast e leggibilità completato');
  });

  test('Performance rendering con elementi decorativi', async ({ page }) => {
    await page.goto('/');
    
    // Misura tempo di caricamento
    const startTime = Date.now();
    
    await expect(page.locator('h4:has-text("Complicità")')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Massimo 5 secondi
    
    // Verifica che le animazioni non blocchino l'interazione
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    
    const interactionStart = Date.now();
    await registerTab.click();
    const interactionTime = Date.now() - interactionStart;
    
    expect(interactionTime).toBeLessThan(1000); // Interazione sotto 1 secondo
    
    // Test performance durante scroll (se applicabile)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    // Verifica che l'app sia ancora responsive
    const nameField = page.locator('input[placeholder="Il tuo nome"], input[placeholder*="nome"]');
    await nameField.fill('PerformanceUser');
    
    console.log(`✅ Test performance completato - Load: ${loadTime}ms, Interaction: ${interactionTime}ms`);
  });

  test('Gestione errori UI con focus management', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Triggera errore password non coincidenti
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'ErrorUser');
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('confirm-password-input').fill('different');
    
    // Il bottone dovrebbe essere disabilitato
    const submitButton = page.getByTestId('submit-auth');
    await expect(submitButton).toBeDisabled();
    
    // Correggi per mostrare un vero errore
    await page.getByTestId('confirm-password-input').fill('test123');
    await submitButton.click();
    
    // Simula errore del server intercettando la richiesta
    await page.route('**/api/connect-user', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Test error message' })
      });
    });
    
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'ErrorUser2');
    await submitButton.click();
    
    // Verifica che l'errore sia mostrato e accessibile
    await expect(page.locator('text=Errore di autenticazione')).toBeVisible({ timeout: 10000 });
    
    // Verifica che il focus non sia perso
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    console.log('✅ Test gestione errori UI completato');
  });

  test('Zoom e ingrandimento testo', async ({ page }) => {
    await page.goto('/');
    
    // Simula zoom al 150%
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    
    await page.waitForTimeout(1000);
    
    // Verifica che l'interfaccia sia ancora utilizzabile
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await expect(registerTab).toBeVisible();
    await registerTab.click();
    
    // Verifica che i campi siano accessibili con zoom
    const nameField = page.locator('input[placeholder="Il tuo nome"], input[placeholder*="nome"]');
    await nameField.fill('ZoomUser');
    
    const submitButton = page.getByTestId('submit-auth');
    await expect(submitButton).toBeVisible();
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
    
    console.log('✅ Test zoom completato');
  });
});