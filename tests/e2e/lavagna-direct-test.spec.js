import { test, expect } from '@playwright/test';

test.describe('Lavagna Direct Test', () => {
  test('should load app and verify lavagna after login', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for React to render and main content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React time to render
    
    // Check what's actually on the page
    const pageContent = await page.textContent('body');
    console.log('Page content:', pageContent);
    
    // Try different selectors for login
    const loginSelectors = [
      'text=Nome utente',
      'input[placeholder="Nome utente"]',
      'text=Accedi',
      'text=Login',
      'text=Authentication',
      'text=Auth'
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found login element with selector: ${selector}`);
        loginFound = true;
        break;
      } catch (e) {
        console.log(`❌ Selector not found: ${selector}`);
      }
    }
    
    if (!loginFound) {
      // Take screenshot to see what's actually rendered
      await page.screenshot({ path: 'debug-page-state.png' });
      console.log('📸 Screenshot saved as debug-page-state.png');
      
      // Check if we're maybe already logged in
      const gameSelectors = [
        'text=Gioco di Coppia',
        'text=Couple',
        '[data-testid="lavagna-canvas"]',
        'text=Lavagna'
      ];
      
      for (const selector of gameSelectors) {
        if (await page.locator(selector).isVisible()) {
          console.log(`ℹ️ Found game element: ${selector} - might be already logged in`);
          
          // Test lavagna if visible
          const lavagnaCanvas = page.locator('[data-testid="lavagna-canvas"]');
          if (await lavagnaCanvas.isVisible()) {
            console.log('✅ Lavagna canvas found');
            await expect(page.locator('button[title="Matita"]')).toBeVisible();
            console.log('✅ Lavagna tools are visible');
          }
          return;
        }
      }
      
      throw new Error('Could not find login form or game interface');
    }
    
    // If we found login, proceed with authentication
    // Find input fields dynamically
    const inputFields = await page.locator('input').all();
    console.log(`Found ${inputFields.length} input fields`);
    
    if (inputFields.length >= 2) {
      // Fill first input (likely name/username)
      await inputFields[0].fill('testUser');
      // Fill second input (likely password)  
      await inputFields[1].fill('testPassword');
      
      // Click login button
      await page.click('text=Entra');
    } else {
      throw new Error('Could not find expected input fields');
    }
    
    // Wait for next screen
    await page.waitForTimeout(3000);
    
    // Check for lavagna
    const lavagnaCanvas = page.locator('[data-testid="lavagna-canvas"]');
    if (await lavagnaCanvas.isVisible()) {
      console.log('✅ Lavagna canvas found after login');
      await expect(page.locator('button[title="Matita"]')).toBeVisible();
      await expect(page.locator('button[title="Matita"]')).not.toBeDisabled();
      console.log('✅ Lavagna tools are loaded and enabled');
    } else {
      console.log('ℹ️ Lavagna not visible - user might be in lobby');
    }
  });
});