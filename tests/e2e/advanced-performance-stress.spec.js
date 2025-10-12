import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

/**
 * Test Performance e Stress Avanzati
 * 
 * Copertura:
 * - Molti utenti simultanei
 * - Latenza di rete alta
 * - Uso memoria e CPU
 * - Stress test directory utenti
 * - Performance degradation
 */
test.describe('Advanced Performance & Stress Tests', () => {
  
  test('Stress test con 10 utenti simultanei', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    const userNames = [];
    
    try {
      // Crea 10 contesti simultanei
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
        userNames.push(`StressUser${i}`);
      }
      
      console.log('📝 Creati 10 contesti, avvio registrazioni simultanee...');
      
      // Registra tutti gli utenti in parallelo
      const registrationPromises = pages.map((page, index) => 
        connectUser(page, userNames[index])
      );
      
      const startTime = Date.now();
      await Promise.all(registrationPromises);
      const registrationTime = Date.now() - startTime;
      
      console.log(`⏱️ Registrazione di 10 utenti completata in ${registrationTime}ms`);
      expect(registrationTime).toBeLessThan(30000); // Max 30 secondi
      
      // Verifica che tutti siano loggati
      for (let i = 0; i < pages.length; i++) {
        await expect(pages[i].locator(`text=Ciao ${userNames[i]}`)).toBeVisible({ timeout: 15000 });
      }
      
      // Test directory popolata per tutti
      await Promise.all(pages.map(async (page) => {
        return expect.poll(async () => {
          const userCount = await page.locator('li[class*="p-3"]').count();
          return userCount;
        }, { timeout: 30000, message: 'Attesa directory popolata' }).toBeGreaterThan(5);
      }));
      
      console.log('✅ Directory popolata per tutti gli utenti');
      
      // Test stress: tutti inviano richieste simultanee
      const requestPromises = pages.slice(0, 5).map(async (page, index) => {
        try {
          const targetUser = userNames[index + 5];
          const targetRow = page.locator(`li:has-text("${targetUser}")`);
          await expect(targetRow).toBeVisible({ timeout: 10000 });
          await targetRow.getByTestId('send-request').click();
          return true;
        } catch (error) {
          console.log(`⚠️ Richiesta fallita per utente ${index}: ${error.message}`);
          return false;
        }
      });
      
      const requestResults = await Promise.all(requestPromises);
      const successfulRequests = requestResults.filter(r => r).length;
      expect(successfulRequests).toBeGreaterThan(2); // Almeno 3 richieste riuscite
      
      console.log(`✅ Stress test completato: ${successfulRequests}/5 richieste riuscite`);
      
    } finally {
      // Cleanup
      for (const context of contexts) {
        await context.close().catch(() => {});
      }
    }
  });

  test('Performance con latenza di rete alta simulata', async ({ page }) => {
    // Simula latenza di 2 secondi su tutte le richieste
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    const startTime = Date.now();
    
    await page.goto('/');
    
    const registerTab = page.getByRole('tab', { name: /Registrati/i });
    await registerTab.click();
    
    await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'LatencyUser');
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('confirm-password-input').fill('test123');
    
    const submitButton = page.getByTestId('submit-auth');
    await submitButton.click();
    
    // L'app dovrebbe gestire la latenza senza freeze
    // Verifica che il bottone mostri loading state
    await expect(submitButton).toHaveText(/Attendere/);
    
    // Verifica completamento con latenza
    await expect(page.locator('text=Ciao LatencyUser')).toBeVisible({ timeout: 15000 });
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Test latenza completato in ${totalTime}ms`);
    expect(totalTime).toBeGreaterThan(2000); // Conferma che la latenza è stata applicata
  });

  test('Memory usage con creazione/distruzione utenti ripetuta', async ({ browser }) => {
    const memorySnapshots = [];
    
    for (let cycle = 0; cycle < 5; cycle++) {
      console.log(`🔄 Ciclo memoria ${cycle + 1}/5`);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Misura memoria iniziale
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      await connectUser(page, `MemoryUser${cycle}`);
      await expect(page.locator(`text=Ciao MemoryUser${cycle}`)).toBeVisible({ timeout: 10000 });
      
      // Simula attività utente
      await page.waitForTimeout(2000);
      
      // Misura memoria dopo attività
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      memorySnapshots.push({
        cycle: cycle + 1,
        initial: initialMemory,
        final: finalMemory,
        diff: finalMemory - initialMemory
      });
      
      await context.close();
      
      // Pausa per garbage collection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Analizza trend memoria
    const avgMemoryIncrease = memorySnapshots.reduce((sum, snap) => sum + snap.diff, 0) / memorySnapshots.length;
    
    console.log('📊 Memory snapshots:', memorySnapshots);
    console.log(`📈 Average memory increase per cycle: ${avgMemoryIncrease} bytes`);
    
    // Non dovrebbe esserci un aumento eccessivo costante (memory leak)
    expect(avgMemoryIncrease).toBeLessThan(10 * 1024 * 1024); // Max 10MB per ciclo
  });

  test('Stress test directory con 50 utenti mockati', async ({ page }) => {
    await connectUser(page, 'DirectoryStressUser');
    
    // Mock API per simulare 50 utenti nella directory
    await page.route('**/api/list-users', route => {
      const users = [];
      for (let i = 0; i < 50; i++) {
        users.push({
          id: `mock-user-${i}`,
          name: `MockUser${i}`,
          nickname: `Mock${i}`,
          personalCode: `CODE${i}`,
          isOnline: Math.random() > 0.5,
          lastSeen: new Date().toISOString()
        });
      }
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users })
      });
    });
    
    await expect(page.locator('text=Ciao DirectoryStressUser')).toBeVisible({ timeout: 10000 });
    
    // Forza refresh della directory
    await page.reload();
    await expect(page.locator('text=Ciao DirectoryStressUser')).toBeVisible({ timeout: 10000 });
    
    // Verifica che la directory carichi senza performance issues
    const startTime = Date.now();
    
    await expect.poll(async () => {
      const userCount = await page.locator('li[class*="p-3"]').count();
      return userCount;
    }, { timeout: 30000, message: 'Attesa caricamento 50 utenti' }).toBeGreaterThan(40);
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Directory con 50 utenti caricata in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Max 10 secondi
    
    // Test scroll performance con molti utenti
    await page.evaluate(() => {
      const userList = document.querySelector('[class*="overflow"]');
      if (userList) {
        userList.scrollTop = userList.scrollHeight;
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Verifica che l'interfaccia sia ancora responsive
    const firstUser = page.locator('li[class*="p-3"]').first();
    await expect(firstUser).toBeVisible();
  });

  test('CPU intensive operations durante il gioco', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Forma coppia
      await connectUser(pageA, 'CPUUserA');
      await connectUser(pageB, 'CPUUserB');

      await expect.poll(async () => {
        const userCount = await pageA.locator('li[class*="p-3"]').count();
        return userCount > 0;
      }, { timeout: 15000 }).toBeTruthy();

      const bobRow = pageA.locator('li:has-text("CPUUserB")');
      await expect(bobRow).toBeVisible();
      await bobRow.getByTestId('send-request').click();

      await expect.poll(async () => {
        const accept = await pageB.getByTestId('accept-request').count();
        return accept > 0;
      }, { timeout: 20000 }).toBeGreaterThan(0);

      await pageB.getByTestId('accept-request').first().click();

      await expect(pageA.locator('text=Gioco di Coppia')).toBeVisible({ timeout: 15000 });
      await expect(pageB.locator('text=Gioco di Coppia')).toBeVisible({ timeout: 15000 });

      // Simula operazioni CPU intensive in background
      await pageA.evaluate(() => {
        // Operazione pesante ma non bloccante
        const heavyWork = () => {
          let result = 0;
          for (let i = 0; i < 1000000; i++) {
            result += Math.sin(i) * Math.cos(i);
          }
          return result;
        };
        
        // Esegui in chunks per non bloccare UI
        let iterations = 0;
        const workInterval = setInterval(() => {
          heavyWork();
          iterations++;
          if (iterations >= 10) {
            clearInterval(workInterval);
          }
        }, 100);
      });

      // Verifica che l'interfaccia rimanga responsive durante CPU load
      const drawButton = pageA.locator('button:has-text("Pesca"), button:has-text("Nuova Carta")');
      if (await drawButton.count() > 0) {
        const clickStart = Date.now();
        await drawButton.first().click();
        const clickTime = Date.now() - clickStart;
        
        expect(clickTime).toBeLessThan(2000); // Click responsive nonostante CPU load
        console.log(`✅ Click responsive durante CPU load: ${clickTime}ms`);
      }

    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('Bandwidth limiting e performance degradation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Simula connessione lenta limitando dimensione response
      await page.route('**/api/**', route => {
        // Simula risposta lenta con delay graduali
        const delay = Math.random() * 3000 + 1000; // 1-4 secondi
        setTimeout(() => {
          route.continue();
        }, delay);
      });
      
      const startTime = Date.now();
      
      await connectUser(page, 'BandwidthUser');
      
      const connectionTime = Date.now() - startTime;
      console.log(`🌐 Connessione con bandwidth limitato: ${connectionTime}ms`);
      
      await expect(page.locator('text=Ciao BandwidthUser')).toBeVisible({ timeout: 20000 });
      
      // L'app dovrebbe funzionare anche con connessione lenta
      expect(connectionTime).toBeLessThan(20000); // Max 20 secondi
      
      // Test logout/login con bandwidth limitato
      const logoutButton = page.getByRole('button', { name: /logout/i });
      await logoutButton.click();
      
      const loginTab = page.getByRole('tab', { name: /Login/i });
      await loginTab.click();
      
      await page.fill('input[placeholder="Il tuo nome"], input[placeholder*="nome"]', 'BandwidthUser');
      await page.getByTestId('password-input').fill('e2e1');
      
      const reloginStart = Date.now();
      const submitButton = page.getByTestId('submit-auth');
      await submitButton.click();
      
      await expect(page.locator('text=Ciao BandwidthUser')).toBeVisible({ timeout: 20000 });
      const reloginTime = Date.now() - reloginStart;
      
      console.log(`🔄 Re-login con bandwidth limitato: ${reloginTime}ms`);
      
    } finally {
      await context.close();
    }
  });

  test('Performance comparison: cold start vs warm start', async ({ browser }) => {
    // Cold start - primo caricamento
    const coldContext = await browser.newContext();
    const coldPage = await coldContext.newPage();
    
    const coldStartTime = Date.now();
    await coldPage.goto('/');
    await expect(coldPage.locator('h4:has-text("Complicità")')).toBeVisible();
    const coldLoadTime = Date.now() - coldStartTime;
    
    await coldContext.close();
    
    // Warm start - secondo caricamento (cache attivo)
    const warmContext = await browser.newContext();
    const warmPage = await warmContext.newPage();
    
    const warmStartTime = Date.now();
    await warmPage.goto('/');
    await expect(warmPage.locator('h4:has-text("Complicità")')).toBeVisible();
    const warmLoadTime = Date.now() - warmStartTime;
    
    await warmContext.close();
    
    console.log(`🌡️ Performance comparison:`);
    console.log(`   Cold start: ${coldLoadTime}ms`);
    console.log(`   Warm start: ${warmLoadTime}ms`);
    console.log(`   Improvement: ${((coldLoadTime - warmLoadTime) / coldLoadTime * 100).toFixed(1)}%`);
    
    // Warm start dovrebbe essere più veloce (o almeno non significativamente più lento)
    expect(warmLoadTime).toBeLessThanOrEqual(coldLoadTime * 1.2); // Max 20% più lento
  });
});