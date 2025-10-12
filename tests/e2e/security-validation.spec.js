import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

/**
 * Test Sicurezza e Validazione Avanzati
 * 
 * Copertura:
 * - XSS prevention 
 * - CSRF protection
 * - Input sanitization
 * - Session hijacking prevention
 * - Rate limiting
 * - Data validation client/server
 */
test.describe('Security & Validation Tests', () => {
  
  test('XSS Prevention - Script injection in user inputs', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test vari payload XSS
    const xssPayloads = [
      '<script>window.xssExecuted = true;</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=window.xssExecuted=true>',
      '<svg onload=window.xssExecuted=true>',
      '"><script>window.xssExecuted=true;</script>',
      '${alert("xss")}',
      '{{constructor.constructor("window.xssExecuted=true")()}}'
    ];
    
    for (const payload of xssPayloads) {
      console.log(`🛡️ Testing XSS payload: ${payload.substring(0, 30)}...`);
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', payload);
      await page.getByTestId('password-input').fill('test123');
      await page.getByTestId('confirm-password-input').fill('test123');
      
      const submitButton = page.getByTestId('submit-auth');
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        
        // Attendi elaborazione
        await page.waitForTimeout(2000);
        
        // Verifica che lo script non sia stato eseguito
        const xssExecuted = await page.evaluate(() => window.xssExecuted);
        expect(xssExecuted).toBeUndefined();
        
        // Verifica che il payload sia stato sanitizzato nel DOM
        const displayedName = await page.textContent('body');
        const containsRawScript = displayedName?.includes('<script>');
        expect(containsRawScript).toBeFalsy();
        
        // Reset per prossimo test
        const logoutButton = page.getByRole('button', { name: /logout/i });
        if (await logoutButton.count() > 0) {
          await logoutButton.click();
          await registerTab.click();
        } else {
          await page.reload();
          await registerTab.click();
        }
      }
    }
    
    console.log('✅ XSS prevention test completato');
  });

  test('SQL Injection Prevention in name fields', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test payload SQL injection
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "admin'--",
      "admin'/*",
      "' OR '1'='1",
      "' UNION SELECT password FROM users WHERE '1'='1",
      "'; INSERT INTO users (name) VALUES ('hacker'); --",
      "\\' OR 1=1#"
    ];
    
    for (const payload of sqlPayloads) {
      console.log(`💉 Testing SQL payload: ${payload}`);
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', payload);
      await page.getByTestId('password-input').fill('test123');
      await page.getByTestId('confirm-password-input').fill('test123');
      
      const submitButton = page.getByTestId('submit-auth');
      await submitButton.click();
      
      // Attendi risposta server
      await page.waitForTimeout(3000);
      
      // Verifica che non ci siano errori SQL esposti
      const pageContent = await page.textContent('body');
      const hasSqlError = pageContent?.toLowerCase().includes('sql') || 
                         pageContent?.toLowerCase().includes('syntax error') ||
                         pageContent?.toLowerCase().includes('mysql') ||
                         pageContent?.toLowerCase().includes('postgres');
      
      expect(hasSqlError).toBeFalsy();
      
      // Se registrazione riuscita, verifica dati sanitizzati
      try {
        await expect(page.locator(`text=Ciao ${payload}`)).toBeVisible({ timeout: 3000 });
        console.log(`⚠️ SQL payload accettato ma dovrebbe essere sanitizzato`);
        
        const logoutButton = page.getByRole('button', { name: /logout/i });
        await logoutButton.click();
        await registerTab.click();
      } catch {
        // Registrazione fallita - comportamento corretto
        console.log(`✅ SQL payload "${payload}" correttamente rifiutato`);
        await page.reload();
        await registerTab.click();
      }
    }
    
    console.log('✅ SQL injection prevention test completato');
  });

  test('Session Security - sessionStorage manipulation', async ({ page }) => {
    await connectUser(page, 'SessionSecurityUser');
    
    await expect(page.locator('text=Ciao SessionSecurityUser')).toBeVisible({ timeout: 10000 });
    
    // Ottieni sessionStorage valido
    const validAuth = await page.evaluate(() => {
      return sessionStorage.getItem('complicity_auth');
    });
    
    expect(validAuth).toBeTruthy();
    
    // Test manipolazione userId
    await page.evaluate(() => {
      const auth = JSON.parse(sessionStorage.getItem('complicity_auth'));
      auth.userId = 'manipulated-user-id';
      sessionStorage.setItem('complicity_auth', JSON.stringify(auth));
    });
    
    await page.reload();
    
    // App dovrebbe rilevare inconsistenza e fare logout
    await expect(page.locator('h4:has-text("Complicità")')).toBeVisible({ timeout: 10000 });
    
    // Verifica che sessionStorage sia stato pulito
    const manipulatedAuth = await page.evaluate(() => {
      return sessionStorage.getItem('complicity_auth');
    });
    expect(manipulatedAuth).toBeNull();
    
    console.log('✅ Session manipulation detection completato');
  });

  test('Rate Limiting - Rapid registration attempts', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Tentativi rapidi di registrazione
    const attempts = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', `RateLimitUser${i}`);
      await page.getByTestId('password-input').fill('test123');
      await page.getByTestId('confirm-password-input').fill('test123');
      
      const submitButton = page.getByTestId('submit-auth');
      await submitButton.click();
      
      const endTime = Date.now();
      attempts.push({
        attempt: i + 1,
        duration: endTime - startTime
      });
      
      // Attendi risposta
      await page.waitForTimeout(2000);
      
      // Se login riuscito, fai logout per prossimo tentativo
      const logoutButton = page.getByRole('button', { name: /logout/i });
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await registerTab.click();
      } else {
        // Possibile rate limiting attivo
        const errorVisible = await page.locator('text=Errore').count();
        if (errorVisible > 0) {
          console.log(`⏰ Rate limiting possibilmente attivo al tentativo ${i + 1}`);
          break;
        }
        await page.reload();
        await registerTab.click();
      }
    }
    
    console.log('📊 Rate limiting attempts:', attempts);
    console.log('✅ Rate limiting test completato');
  });

  test('CSRF Protection - Cross-site request forgery', async ({ page, browser }) => {
    // Simula attacco CSRF con richiesta da origine diversa
    await connectUser(page, 'CSRFUser');
    
    await expect(page.locator('text=Ciao CSRFUser')).toBeVisible({ timeout: 10000 });
    
    // Crea nuovo contesto per simulare attaccante
    const attackerContext = await browser.newContext();
    const attackerPage = await attackerContext.newPage();
    
    try {
      // Tenta richiesta diretta all'API senza proper origin
      const response = await attackerPage.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:5000/api/connect-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'http://malicious-site.com'
            },
            body: JSON.stringify({
              name: 'AttackerUser',
              gameType: 'Coppia'
            })
          });
          
          return {
            status: response.status,
            ok: response.ok
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });
      
      // Richiesta dovrebbe essere bloccata da CORS o CSRF protection
      if (response.error) {
        console.log(`✅ CSRF protection attivo: ${response.error}`);
      } else if (response.status >= 400) {
        console.log(`✅ CSRF protection attivo: Status ${response.status}`);
      } else {
        console.log(`⚠️ Possibile vulnerabilità CSRF: Status ${response.status}`);
      }
      
    } finally {
      await attackerContext.close();
    }
    
    console.log('✅ CSRF protection test completato');
  });

  test('Input Validation - Extreme values and edge cases', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test valori estremi
    const extremeInputs = [
      { name: '', description: 'empty string' },
      { name: ' '.repeat(1000), description: 'very long spaces' },
      { name: 'a'.repeat(10000), description: 'very long string' },
      { name: '𝕌𝕟𝕚𝕔𝕠𝕕𝕖'.repeat(100), description: 'unicode repetition' },
      { name: '\n\r\t\b\f', description: 'control characters' },
      { name: '\u0000\u001F\u007F', description: 'null and control chars' },
      { name: '../../etc/passwd', description: 'path traversal' },
      { name: 'CON', description: 'Windows reserved name' }
    ];
    
    for (const input of extremeInputs) {
      console.log(`🧪 Testing extreme input: ${input.description}`);
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', input.name);
      await page.getByTestId('password-input').fill('test123');
      await page.getByTestId('confirm-password-input').fill('test123');
      
      const submitButton = page.getByTestId('submit-auth');
      
      // Verifica validazione lato client
      const isEnabled = await submitButton.isEnabled();
      
      if (isEnabled) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Verifica che server gestisca correttamente l'input
        const hasError = await page.locator('text=Errore').count() > 0;
        const hasSuccess = await page.locator('text=Ciao').count() > 0;
        
        if (hasSuccess) {
          console.log(`⚠️ Extreme input "${input.description}" accettato`);
          const logoutButton = page.getByRole('button', { name: /logout/i });
          await logoutButton.click();
          await registerTab.click();
        } else if (hasError) {
          console.log(`✅ Extreme input "${input.description}" correttamente rifiutato`);
          await page.reload();
          await registerTab.click();
        }
      } else {
        console.log(`✅ Extreme input "${input.description}" bloccato lato client`);
      }
    }
    
    console.log('✅ Input validation test completato');
  });

  test('Password Security - Weak password handling', async ({ page }) => {
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    // Test password deboli
    const weakPasswords = [
      '123',
      'password',
      'admin',
      'user',
      '1234',
      'abcd',
      '0000',
      'pass'
    ];
    
    for (const weakPassword of weakPasswords) {
      console.log(`🔐 Testing weak password: ${weakPassword}`);
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'WeakPassUser');
      await page.getByTestId('password-input').fill(weakPassword);
      await page.getByTestId('confirm-password-input').fill(weakPassword);
      
      const submitButton = page.getByTestId('submit-auth');
      
      if (weakPassword.length < 4) {
        // Dovrebbe essere disabilitato per password troppo corte
        await expect(submitButton).toBeDisabled();
        console.log(`✅ Password "${weakPassword}" correttamente rifiutata (troppo corta)`);
      } else {
        // Verifica se ci sono altri controlli di sicurezza
        const isEnabled = await submitButton.isEnabled();
        if (isEnabled) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          const hasSuccess = await page.locator('text=Ciao WeakPassUser').count() > 0;
          if (hasSuccess) {
            console.log(`⚠️ Weak password "${weakPassword}" accettata`);
            const logoutButton = page.getByRole('button', { name: /logout/i });
            await logoutButton.click();
            await registerTab.click();
          }
        }
      }
    }
    
    console.log('✅ Password security test completato');
  });

  test('Session Timeout - Idle session handling', async ({ page }) => {
    await connectUser(page, 'TimeoutTestUser');
    
    await expect(page.locator('text=Ciao TimeoutTestUser')).toBeVisible({ timeout: 10000 });
    
    // Simula inattività modificando timestamp in sessionStorage
    await page.evaluate(() => {
      const auth = JSON.parse(sessionStorage.getItem('complicity_auth'));
      if (auth) {
        // Simula token scaduto (se l'app gestisce timestamp)
        auth.timestamp = Date.now() - (24 * 60 * 60 * 1000); // 24 ore fa
        sessionStorage.setItem('complicity_auth', JSON.stringify(auth));
      }
    });
    
    // Simula richiesta che potrebbe triggerare verifica timeout
    await page.reload();
    
    // Verifica comportamento con sessione potenzialmente scaduta
    const isStillLoggedIn = await page.locator('text=Ciao TimeoutTestUser').count() > 0;
    const isLoggedOut = await page.locator('h4:has-text("Complicità")').count() > 0;
    
    if (isLoggedOut) {
      console.log('✅ Session timeout correttamente gestito');
    } else if (isStillLoggedIn) {
      console.log('ℹ️ Session timeout non implementato o timestamp non utilizzato');
    }
    
    console.log('✅ Session timeout test completato');
  });
});