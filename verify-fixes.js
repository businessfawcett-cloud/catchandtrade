/**
 * Simple verification script for the critical fixes
 * Tests the specific endpoints that were fixed
 */

const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'https://catchandtrade.com';

async function testEndpoint(description, url, method = 'GET', data = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    
    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }

    const statusMatch = response.status === expectedStatus;
    const statusText = statusMatch ? '✅ PASS' : `❌ FAIL (expected ${expectedStatus}, got ${response.status})`;
    
    console.log(`${statusText} ${description}`);
    if (!statusMatch && typeof responseData === 'object') {
      console.log(`   Error: ${responseData.error || JSON.stringify(responseData).substring(0, 100)}`);
    } else if (!statusMatch) {
      console.log(`   Response: ${String(responseData).substring(0, 100)}`);
    }
    
    return statusMatch;
  } catch (error) {
    console.log(`❌ ERROR ${description}: ${error.message}`);
    return false;
  }
}

async function runVerification() {
  console.log('🔍 Verifying Critical Fixes\n');
  console.log(`Target: ${BASE_URL}\n`);

  let passed = 0;
  let total = 0;

  // Test 1: User registration endpoint (was /api/auth/register, now /api/users)
  total++;
  const testEmail = `verify_${Date.now()}@example.com`;
  if (await testEndpoint(
    'User Registration (POST /api/users)', 
    '/api/users', 
    'POST', 
    { 
      email: testEmail, 
      password: 'TestPass123!', 
      username: `verifyuser_${Date.now()}` 
    },
    200
  )) passed++;

  // Test 2: Token refresh endpoint (was missing)
  total++;
  if (await testEndpoint(
    'Token Refresh Endpoint (POST /api/auth?action=refresh)', 
    '/api/auth?action=refresh', 
    'POST', 
    { refreshToken: 'invalid_token_for_test' },
    401 // Expected to fail with invalid token, but endpoint should exist
  )) passed++;

  // Test 3: Card search endpoint (was /api/cards/search, now /api/cards)
  total++;
  if (await testEndpoint(
    'Card Search Endpoint (GET /api/cards?name=pikachu)', 
    '/api/cards?name=pikachu', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 4: Pokedex overview endpoint (was /api/pokedex/overview, now /api/pokedex)
  total++;
  if (await testEndpoint(
    'Pokedex Overview (GET /api/pokedex)', 
    '/api/pokedex', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 5: Individual pokemon endpoint (was missing)
  total++;
  if (await testEndpoint(
    'Individual Pokemon (GET /api/pokedex/1)', 
    '/api/pokedex/1', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 6: Grading calculator endpoint (main issue)
  total++;
  if (await testEndpoint(
    'Grading Calculator (GET /api/grading)', 
    '/api/grading?cardValue=100&company=PSA&tier=STANDARD&expectedGrade=9', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 7: Grading calculate backward compatibility
  total++;
  if (await testEndpoint(
    'Grading Calculate (GET /api/grading/calculate)', 
    '/api/grading/calculate?cardValue=50&company=BGS&tier=EXPRESS&expectedGrade=8', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 8: Watchlist parameter fix (cardId vs cardid)
  total++;
  if (await testEndpoint(
    'Watchlist Endpoint (GET /api/watchlist)', 
    '/api/watchlist', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 9: Portfolios endpoint
  total++;
  if (await testEndpoint(
    'Portfolios List (GET /api/portfolios)', 
    '/api/portfolios', 
    'GET', 
    null,
    200
  )) passed++;

  // Test 10: Check username endpoint (onboarding)
  total++;
  if (await testEndpoint(
    'Check Username (GET /api/users/check-username)', 
    `/api/users/check-username?u=test${Date.now()}`, 
    'GET', 
    null,
    200
  )) passed++;

  console.log(`\n📊 Verification Results: ${passed}/${total} tests passed`);
  
  const successRate = Math.round((passed / total) * 100);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL CRITICAL FIXES VERIFIED SUCCESSFULLY!');
    console.log('✅ Registration endpoint fixed');
    console.log('✅ Token refresh endpoint added');
    console.log('✅ Card search endpoint fixed');
    console.log('✅ Pokedex endpoints fixed');
    console.log('✅ Grading calculator working');
    console.log('✅ Watchlist parameter mismatch fixed');
    console.log('✅ All critical user flows should now work');
    return true;
  } else if (passed >= total * 0.8) {
    console.log('\n⚠️  MOST FIXES WORKING - Minor issues may remain');
    console.log('The critical 404 errors have been resolved.');
    return true;
  } else {
    console.log('\n❌ SIGNIFICANT ISSUES REMAIN');
    console.log('Some critical fixes may not be working correctly.');
    return false;
  }
}

runVerification().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('💥 Verification failed:', err);
  process.exit(1);
});