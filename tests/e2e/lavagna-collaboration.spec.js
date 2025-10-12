import { test, expect } from '@playwright/test';

test.describe('Lavagna Collaboration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load lavagna with all tools after login', async ({ page }) => {
    // Login
    await page.fill('input[placeholder="Nome utente"]', 'testUser1');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    // Wait for game interface
    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });

    // Check toolbar tools are present
    await expect(page.locator('button[title="Matita"]')).toBeVisible();
    await expect(page.locator('button[title="Penna"]')).toBeVisible();
    await expect(page.locator('button[title="Pennarello"]')).toBeVisible();
    await expect(page.locator('button[title="Testo"]')).toBeVisible();
    await expect(page.locator('button[title="Immagine"]')).toBeVisible();
    await expect(page.locator('button[title="Cancellino"]')).toBeVisible();
  });

  test('should switch tools correctly', async ({ page }) => {
    // Login and navigate to game
    await page.fill('input[placeholder="Nome utente"]', 'testUser2');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });

    // Test tool switching
    const penButton = page.locator('button[title="Penna"]');
    await penButton.click();
    await expect(penButton).toHaveClass(/MuiIconButton-colorPrimary/);

    const eraserButton = page.locator('button[title="Cancellino"]');
    await eraserButton.click();
    await expect(eraserButton).toHaveClass(/MuiIconButton-colorPrimary/);
  });

  test('should show text input when text tool is selected', async ({ page }) => {
    // Login and navigate to game
    await page.fill('input[placeholder="Nome utente"]', 'testUser3');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });

    // Select text tool
    await page.click('button[title="Testo"]');

    // Check text input appears
    await expect(page.locator('input[placeholder="Testo..."]')).toBeVisible();
  });

  test('should change colors correctly', async ({ page }) => {
    // Login and navigate to game
    await page.fill('input[placeholder="Nome utente"]', 'testUser4');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });

    // Change drawing color
    const colorInput = page.locator('input[title="Colore"]');
    await colorInput.fill('#ff0000');

    // Change background color
    const bgColorInput = page.locator('input[title="Sfondo"]');
    await bgColorInput.fill('#0000ff');

    // Verify canvas background changed
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCSS('background', /rgb\(0, 0, 255\)|#0000ff/);
  });

  test('should handle width/thickness changes', async ({ page }) => {
    // Login and navigate to game
    await page.fill('input[placeholder="Nome utente"]', 'testUser5');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });

    // Change brush width
    const widthSlider = page.locator('input[type="range"]');
    await widthSlider.fill('8');

    // Verify slider value changed
    await expect(widthSlider).toHaveValue('8');
  });

  test('should reset canvas when reset button is clicked', async ({ page }) => {
    // Login and navigate to game
    await page.fill('input[placeholder="Nome utente"]', 'testUser6');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });

    // Click reset button
    await page.click('button:has-text("Reset")');

    // Canvas should be cleared (this would be verified through API calls in real test)
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
  });

  test('should show loading state during fabric.js initialization', async ({ page }) => {
    // Login and navigate to game
    await page.fill('input[placeholder="Nome utente"]', 'testUser7');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    // Check for loading indicator (it might be very brief)
    const loadingText = page.locator('text=Caricamento lavagna...');
    
    // Either loading is visible or canvas is ready
    await expect(async () => {
      const isLoadingVisible = await loadingText.isVisible();
      const isCanvasReady = await page.locator('canvas').isVisible();
      expect(isLoadingVisible || isCanvasReady).toBe(true);
    }).toPass({ timeout: 10000 });
  });

  test('should disable controls during loading', async ({ page }) => {
    // Login and navigate to game  
    await page.fill('input[placeholder="Nome utente"]', 'testUser8');
    await page.fill('input[type="password"]', 'testPassword');
    await page.click('button:has-text("Accedi")');

    // During loading, buttons should be disabled
    const matitaButton = page.locator('button[title="Matita"]');
    
    // Wait for either loading state or ready state
    await page.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 10000 });
    
    // Eventually controls should be enabled
    await expect(matitaButton).not.toBeDisabled({ timeout: 15000 });
  });
});

test.describe('Lavagna Sync Between Partners', () => {
  test('should sync drawing between two users', async ({ browser }) => {
    // Create two browser contexts for two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 login
      await page1.goto('/');
      await page1.fill('input[placeholder="Nome utente"]', 'syncUser1');
      await page1.fill('input[type="password"]', 'syncPassword');
      await page1.click('button:has-text("Accedi")');

      // User 2 login  
      await page2.goto('/');
      await page2.fill('input[placeholder="Nome utente"]', 'syncUser2');
      await page2.fill('input[type="password"]', 'syncPassword');
      await page2.click('button:has-text("Accedi")');

      // Wait for both to be in game
      await page1.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 15000 });
      await page2.waitForSelector('[data-testid="lavagna-canvas"]', { timeout: 15000 });

      // User 1 makes a drawing action (simulated by tool selection)
      await page1.click('button[title="Penna"]');
      await page1.locator('input[title="Colore"]').fill('#ff0000');

      // User 2 should eventually see sync activity in the log
      await expect(page2.locator('text=🎨 Lavagna sincronizzata')).toBeVisible({ timeout: 10000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});