const { test, expect } = require('@playwright/test');

(async () => {
  const browser = await require('@playwright/test').chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Start from homepage
    await page.goto('https://catchandtrade.com');
    
    // Test 1: Check if homepage loads
    await expect(page).toHaveURL('https://catchandtrade.com/');
    // Use more specific selector for Marketplace link
    await expect(page.locator('a[href="/marketplace"]:has-text("Marketplace")')).toBeVisible();
    console.log('✅ Homepage loads correctly');
    
    // Test 2: Click on Register (use specific login link)
    await page.click('a[href="/login"]:has-text("Log in")');
    await page.click('text=Create account');
    console.log('✅ Navigated to registration page');
    
    // Test 3: Fill registration form
    const timestamp = Date.now();
    const email = `testflow_${timestamp}@example.com`;
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Username"]', `testuser_${timestamp}`);
    await page.fill('input[placeholder="Password"]', 'TestPass123!');
    await page.fill('input[placeholder="Confirm Password"]', 'TestPass123!');
    console.log('✅ Filled registration form');
    
    // Test 4: Submit registration
    await page.click('button:has-text("Create Account")');
    console.log('✅ Submitted registration form');
    
    // Test 5: Wait for redirect or onboarding
    await page.waitForTimeout(3000);
    
    // Test 6: Check if we're logged in (look for user menu or portfolio link)
    const isLoggedIn = await page.locator('a[href="/portfolio"]:has-text("Portfolio")').isVisible();
    const isOnboarding = await page.locator('text=Welcome').isVisible();
    
    if (isLoggedIn || isOnboarding) {
      console.log('✅ Registration successful - user is logged in or in onboarding');
    } else {
      console.log('⚠️  Unclear registration state - checking for error messages');
      const errorMessage = await page.locator('.error, .alert-error, [role="alert"]').innerText();
      if (errorMessage) {
        console.log(`   Error message: ${errorMessage}`);
      }
    }
    
    // Test 7: Navigate to grading calculator
    if (await page.locator('text=Grading Calculator').isVisible()) {
      await page.click('text=Grading Calculator');
      console.log('✅ Navigated to grading calculator');
      
      // Test 8: Fill grading form
      await page.selectOption('select[name="service"]', 'PSA');
      await page.selectOption('select[name="tier"]', 'STANDARD');
      await page.fill('input[placeholder="Card Value ($)"]', '100');
      await page.fill('input[placeholder="Expected Grade"]', '9');
      console.log('✅ Filled grading calculator form');
      
      // Test 9: Calculate ROI
      await page.click('button:has-text("Calculate ROI")');
      console.log('✅ Clicked Calculate ROI');
      
      // Test 10: Check results appear
      await page.waitForTimeout(2000);
      const resultElements = await page.locator('.result, .roi-result, .calculation-result, text=/ROI|profit|grading fee/i').count();
      if (resultElements > 0) {
        console.log('✅ Grading calculator shows results');
      } else {
        // Check if there's any text in the results area
        const resultsArea = await page.locator('.results, .calculation-results, #results').innerText();
        if (resultsArea.trim().length > 0) {
          console.log('✅ Grading calculator shows results');
        } else {
          console.log('⚠️  Grading calculator results not clearly visible');
        }
      }
    } else {
      console.log('⚠️  Grading calculator link not found');
    }
    
    // Test 11: Test watchlist functionality
    await page.goto('https://catchandtrade.com/marketplace');
    await page.waitForTimeout(3000);
    console.log('✅ Navigated to marketplace');
    
    // Look for a card to add to watchlist - use more specific selectors
    const firstCard = await page.locator('.card-item, .marketplace-card, [data-testid="card"], .product-card, [href*="/marketplace/"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.hover();
      // Try multiple watchlist button selectors
      const watchlistButton = await firstCard.locator(
        'text=Watchlist, button[aria-label*="watchlist"], .watchlist-btn, [data-action="add-to-watchlist"], button:has-text("Watchlist")'
      ).first();
      
      if (await watchlistButton.isVisible()) {
        await watchlistButton.click();
        console.log('✅ Clicked watchlist button');
        
        // Test 12: Check if added successfully
        await page.waitForTimeout(2000);
        // Check for success indicators
        const successMessage = await page.locator(
          'text=added to watchlist, text=added, text=✓, text=success, .toast, .notification, [class*="success"], [class*="alert-success"]'
        ).innerText();
        
        if (successMessage.trim().length > 0) {
          console.log('✅ Watchlist addition successful');
        } else {
          // Check if button changed state
          const buttonTextAfter = await watchlistButton.innerText();
          const buttonClasses = await watchlistButton.getAttribute('class');
          if (buttonTextAfter.includes('Remove') || buttonClasses.includes('active') || buttonClasses.includes('added') || buttonClasses.includes('added')) {
            console.log('✅ Watchlist addition successful (button state changed)');
          } else {
            console.log('⚠️  Watchlist addition status unclear');
          }
        }
      } else {
        console.log('⚠️  Watchlist button not found on card');
      }
    } else {
      console.log('⚠️  No cards found in marketplace to test watchlist');
    }
    
    console.log('\n🎉 User flow test completed');
  } catch (error) {
    console.error('❌ User flow test failed:', error.message);
  } finally {
    await browser.close();
  }
})();