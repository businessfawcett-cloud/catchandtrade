# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\user-flow.test.js >> CardVault Critical User Flows >> portfolio management flow
- Location: tests\user-flow.test.js:83:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e4]:
      - link "Catch & Trade" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "Catch & Trade" [ref=e6]
      - generic [ref=e7]:
        - link "Marketplace" [ref=e8] [cursor=pointer]:
          - /url: /marketplace
        - link "Portfolio" [active] [ref=e9] [cursor=pointer]:
          - /url: /portfolio
        - button "Collection" [ref=e11] [cursor=pointer]:
          - img [ref=e12]
          - text: Collection
          - img [ref=e15]
      - generic [ref=e17]:
        - link "Log in" [ref=e18] [cursor=pointer]:
          - /url: /login
        - link "Get Started" [ref=e19] [cursor=pointer]:
          - /url: /register
  - main [ref=e20]:
    - generic [ref=e22]:
      - heading "Portfolio" [level=1] [ref=e23]
      - paragraph [ref=e24]:
        - text: Please
        - link "login" [ref=e25] [cursor=pointer]:
          - /url: /login
        - text: to view your portfolio.
  - alert [ref=e26]
```

# Test source

```ts
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Start from homepage for each test
  6   |     await page.goto('https://catchandtrade.com');
  7   |   });
  8   | 
  9   |   test('user registration flow', async ({ page }) => {
  10  |     // Navigate to registration
  11  |     await page.click('text=Log in');
  12  |     await page.click('text=Create account');
  13  |     
  14  |     // Fill registration form with unique data
  15  |     const timestamp = Date.now();
  16  |     const email = `testreg_${timestamp}@example.com`;
  17  |     await page.fill('input[placeholder="Email"]', email);
  18  |     await page.fill('input[placeholder="Username"]', `testuser_${timestamp}`);
  19  |     await page.fill('input[placeholder="Password"]', 'TestPass123!');
  20  |     await page.fill('input[placeholder="Confirm Password"]', 'TestPass123!');
  21  |     
  22  |     // Submit registration
  23  |     await page.click('button:has-text("Create Account")');
  24  |     
  25  |     // Wait for redirect (should go to homepage or onboarding)
  26  |     await page.waitForTimeout(3000);
  27  |     
  28  |     // Verify registration succeeded - should be logged in or on onboarding
  29  |     const isLoggedIn = await page.locator('text=Portfolio').isVisible();
  30  |     const isOnboarding = await page.locator('text=Welcome').isVisible();
  31  |     
  32  |     expect(isLoggedIn || isOnboarding).toBeTruthy();
  33  |   });
  34  | 
  35  |   test('grading calculator flow', async ({ page }) => {
  36  |     // Navigate to grading calculator
  37  |     await page.click('text=Grading Calculator');
  38  |     
  39  |     // Fill the form
  40  |     await page.selectOption('select[name="service"]', 'PSA');
  41  |     await page.selectOption('select[name="tier"]', 'STANDARD');
  42  |     await page.fill('input[placeholder="Card Value ($)"]', '100');
  43  |     await page.fill('input[placeholder="Expected Grade"]', '9');
  44  |     
  45  |     // Calculate ROI
  46  |     await page.click('button:has-text("Calculate ROI")');
  47  |     
  48  |     // Wait for results
  49  |     await page.waitForTimeout(2000);
  50  |     
  51  |     // Verify results appear
  52  |     const resultElements = await page.locator(
  53  |       '.result, .roi-result, .calculation-result, text=/ROI|profit|grading fee/i'
  54  |     ).count();
  55  |     
  56  |     expect(resultElements > 0).toBeTruthy();
  57  |   });
  58  | 
  59  |   test('pokedex flow', async ({ page }) => {
  60  |     // Navigate to Pokédex
  61  |     await page.click('text=Collection');
  62  |     await page.click('text=Pokédex');
  63  |     
  64  |     // Wait for Pokemon to load
  65  |     await page.waitForTimeout(3000);
  66  |     
  67  |     // Verify Pokemon are displayed
  68  |     const pokemonCount = await page.locator('.pokemon-card, .pokemon-item, [data-pokemon]').count();
  69  |     expect(pokemonCount > 0).toBeTruthy();
  70  |     
  71  |     // Try to click on first Pokemon if available
  72  |     const firstPokemon = await page.locator('.pokemon-card, .pokemon-item, [data-pokemon]').first();
  73  |     if (await firstPokemon.isVisible()) {
  74  |       await firstPokemon.click();
  75  |       await page.waitForTimeout(2000);
  76  |       
  77  |       // Should navigate to Pokemon detail page
  78  |       const url = page.url();
  79  |       expect(url.includes('/collection/pokedex/')).toBeTruthy();
  80  |     }
  81  |   });
  82  | 
  83  |   test('portfolio management flow', async ({ page }) => {
  84  |     // First login (we'll need to handle this properly)
  85  |     // For now, test that the endpoint exists and returns proper structure
  86  |     // In a real test, we'd need to handle auth cookies/localStorage
  87  |     
  88  |     // Navigate to portfolio
  89  |     await page.click('text=Portfolio');
  90  |     
  91  |     // Should either show portfolio or prompt to create one
  92  |     await page.waitForTimeout(2000);
  93  |     
  94  |     // Check if we can see portfolio interface
  95  |     const portfolioVisible = await page.locator(
  96  |       'text=My Collection, text=Portfolio, .portfolio-container'
  97  |     ).isVisible();
  98  |     
  99  |     // Either we see portfolio or we're prompted to create one
  100 |     const createPrompt = await page.locator(
  101 |       'text=Create Portfolio, text=Get Started, text=No portfolio'
  102 |     ).isVisible();
  103 |     
> 104 |     expect(portfolioVisible || createPrompt).toBeTruthy();
      |                                              ^ Error: expect(received).toBeTruthy()
  105 |   });
  106 | 
  107 |   test('marketplace watchlist flow', async ({ page }) => {
  108 |     // Navigate to marketplace
  109 |     await page.click('text=Marketplace');
  110 |     
  111 |     // Wait for cards to load
  112 |     await page.waitForTimeout(3000);
  113 |     
  114 |     // Look for a card to test watchlist functionality
  115 |     const firstCard = await page.locator(
  116 |       '.card-item, .marketplace-card, .product-card, [data-testid="card"]'
  117 |     ).first();
  118 |     
  119 |     if (await firstCard.isVisible()) {
  120 |       // Hover to reveal buttons
  121 |       await firstCard.hover();
  122 |       
  123 |       // Look for watchlist button
  124 |       const watchlistButton = await firstCard.locator(
  125 |         'text=Watchlist, button[aria-label*="watchlist"], .watchlist-btn, button:has-text("Watchlist")'
  126 |       ).first();
  127 |       
  128 |       if (await watchlistButton.isVisible()) {
  129 |         // Click watchlist button
  130 |         await watchlistButton.click();
  131 |         
  132 |         // Wait for feedback
  133 |         await page.waitForTimeout(2000);
  134 |         
  135 |         // Check for success indication (toast, notification, button change)
  136 |         const successIndicators = await page.locator(
  137 |           '.toast, .notification, [class*="success"], [class*="alert-success"], text=added, text=✓'
  138 |         ).count();
  139 |         
  140 |         // Either we see a success message or the button state changed
  141 |         const buttonTextAfter = await watchlistButton.innerText();
  142 |         const buttonChanged = buttonTextAfter.includes('Remove') || 
  143 |                             buttonTextAfter.includes('Added') ||
  144 |                             buttonTextAfter.includes('✓');
  145 |                             
  146 |         expect(successIndicators > 0 || buttonChanged).toBeTruthy();
  147 |       }
  148 |     }
  149 |   });
  150 | });
```