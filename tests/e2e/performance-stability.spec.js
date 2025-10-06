import { test, expect } from '@playwright/test';
import { connectUser } from './utils';

test.describe('Performance e Stabilità Tests', () => {
  
  test('Test performance caricamento SessionRestorePrompt', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Setup baseline
    await connectUser(pageA, 'Alice_Perf');
    await connectUser(pageB, 'Bob_Perf');
    
    // Forma coppia rapidamente
    await expect.poll(async () => {
      return await pageA.locator('li[class*="p-3"]').count();
    }).toBeGreaterThanOrEqual(1);

    const bobRow = pageA.locator('li:has-text("Bob_Perf")');
    await bobRow.getByTestId('send-request').click();
    
    await expect.poll(async () => {
      return await pageB.getByTestId('accept-request').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);
    
    await pageB.getByTestId('accept-request').first().click();

    // Misura tempo di caricamento prompt dopo reload
    const startTime = Date.now();
    await pageA.reload();
    await connectUser(pageA, 'Alice_Perf');

    // Attendi SessionRestorePrompt
    await expect.poll(async () => {
      return await pageA.locator('text=/Sessione.*[Ee]sistente/').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);

    const loadTime = Date.now() - startTime;
    console.log(`📊 SessionRestorePrompt load time: ${loadTime}ms`);
    
    // VERIFICA: Caricamento dovrebbe essere sotto i 5 secondi
    expect(loadTime).toBeLessThan(5000);

    await context.close();
  });

  test('Test stabilità con riconnessioni multiple', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Setup iniziale
    await connectUser(pageA, 'Alice_Stab');
    await connectUser(pageB, 'Bob_Stab');
    
    await expect.poll(async () => {
      return await pageA.locator('li[class*="p-3"]').count();
    }).toBeGreaterThanOrEqual(1);

    // Forma coppia
    const bobRow = pageA.locator('li:has-text("Bob_Stab")');
    await bobRow.getByTestId('send-request').click();
    
    await expect.poll(async () => {
      return await pageB.getByTestId('accept-request').count();
    }, { timeout: 10000 }).toBeGreaterThan(0);
    
    await pageB.getByTestId('accept-request').first().click();

    // Test riconnessioni multiple
    for (let i = 0; i < 5; i++) {
      console.log(`🔄 Riconnessione ciclo ${i + 1}/5`);
      
      await pageA.reload();
      await connectUser(pageA, 'Alice_Stab');
      
      // VERIFICA: SessionRestorePrompt dovrebbe apparire ogni volta
      await expect.poll(async () => {
        return await pageA.locator('text=/Sessione.*[Ee]sistente/').count();
      }, { timeout: 8000, message: `Prompt non apparso al ciclo ${i + 1}` }).toBeGreaterThan(0);

      // Alterna tra ripristino e terminazione
      if (i % 2 === 0) {
        await pageA.locator('button:has-text("Riprendi Partita")').click();
        await expect.poll(async () => {
          return await pageA.locator('[data-testid="card-table"], .card-game, canvas').count();
        }, { timeout: 8000 }).toBeGreaterThan(0);
      } else {
        await pageA.locator('button:has-text("Termina e Ricomincia")').click();
        await expect.poll(async () => {
          return await pageA.locator('text=/Lobby.*[Cc]oppia/').count();
        }, { timeout: 8000 }).toBeGreaterThan(0);
        
        // Riforma la coppia per il prossimo ciclo
        if (i < 4) {
          await expect.poll(async () => {
            return await pageA.locator('li:has-text("Bob_Stab")').count();
          }).toBeGreaterThan(0);
          
          const bobRowRetry = pageA.locator('li:has-text("Bob_Stab")');
          await bobRowRetry.getByTestId('send-request').click();
          
          await expect.poll(async () => {
            return await pageB.getByTestId('accept-request').count();
          }, { timeout: 10000 }).toBeGreaterThan(0);
          
          await pageB.getByTestId('accept-request').first().click();
        }
      }
    }

    await context.close();
  });

  test('Test memory leaks e cleanup eventi', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor uncaught exceptions
    const uncaughtExceptions = [];
    page.on('pageerror', err => {
      uncaughtExceptions.push(err.message);
    });

    // Esegui operazioni multiple per testare cleanup
    for (let i = 0; i < 3; i++) {
      await connectUser(page, `TestUser_${i}`);
      
      // Simula navigazione e cleanup
      await page.reload();
      await page.waitForTimeout(1000);
    }

    // VERIFICA: Non dovrebbero esserci errori critici
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('memory') || 
      err.includes('leak') || 
      err.includes('Cannot read properties of null') ||
      err.includes('addEventListener')
    );

    expect(criticalErrors.length).toBe(0);
    expect(uncaughtExceptions.length).toBe(0);

    await context.close();
  });

  test('Test comportamento con latenza di rete alta', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Simula latenza alta
    await pageA.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      await route.continue();
    });

    await pageB.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      await route.continue();
    });

    // Test flusso completo con latenza
    await connectUser(pageA, 'Alice_Slow', 15000);
    await connectUser(pageB, 'Bob_Slow', 15000);
    
    await expect.poll(async () => {
      return await pageA.locator('li[class*="p-3"]').count();
    }, { timeout: 20000 }).toBeGreaterThanOrEqual(1);

    // Forma coppia con timeout esteso
    const bobRow = pageA.locator('li:has-text("Bob_Slow")');
    await bobRow.getByTestId('send-request').click();
    
    await expect.poll(async () => {
      return await pageB.getByTestId('accept-request').count();
    }, { timeout: 25000 }).toBeGreaterThan(0);
    
    await pageB.getByTestId('accept-request').first().click();

    // VERIFICA: Anche con latenza alta, il flusso dovrebbe funzionare
    await expect.poll(async () => {
      const gameElements = await pageA.locator('[data-testid="card-table"], .card-game, canvas').count();
      return gameElements;
    }, { timeout: 30000 }).toBeGreaterThan(0);

    await expect.poll(async () => {
      const gameElements = await pageB.locator('[data-testid="card-table"], .card-game, canvas').count();
      return gameElements;
    }, { timeout: 30000 }).toBeGreaterThan(0);

    await context.close();
  });

  test('Test concorrenza multiple coppie', async ({ browser }) => {
    // Test con 6 utenti che formano 3 coppie simultaneamente
    const contexts = [];
    const pages = [];

    for (let i = 0; i < 6; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
      await connectUser(page, `User_${i}`);
    }

    // Attendi che tutti vedano gli altri
    for (const page of pages) {
      await expect.poll(async () => {
        return await page.locator('li[class*="p-3"]').count();
      }, { timeout: 15000 }).toBeGreaterThanOrEqual(5);
    }

    // Forma 3 coppie simultaneamente
    const couplingPromises = [];
    
    for (let i = 0; i < 3; i++) {
      const pageA = pages[i * 2];
      const pageB = pages[i * 2 + 1];
      const userB = `User_${i * 2 + 1}`;
      
      couplingPromises.push((async () => {
        const userRow = pageA.locator(`li:has-text("${userB}")`);
        await userRow.getByTestId('send-request').click();
        
        await expect.poll(async () => {
          return await pageB.getByTestId('accept-request').count();
        }, { timeout: 15000 }).toBeGreaterThan(0);
        
        await pageB.getByTestId('accept-request').first().click();
        
        // Verifica entrambi arrivano al gioco
        await expect.poll(async () => {
          return await pageA.locator('[data-testid="card-table"], .card-game, canvas').count();
        }, { timeout: 20000 }).toBeGreaterThan(0);
        
        await expect.poll(async () => {
          return await pageB.locator('[data-testid="card-table"], .card-game, canvas').count();
        }, { timeout: 20000 }).toBeGreaterThan(0);
      })());
    }

    // VERIFICA: Tutte le coppie dovrebbero formarsi con successo
    await Promise.all(couplingPromises);

    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });
});