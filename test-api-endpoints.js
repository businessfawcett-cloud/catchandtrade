/**
 * Test script to verify all critical API endpoints are working
 * Run with: node test-api-endpoints.js <base_url>
 */

// Use native fetch in Node.js v18+
const fetch = globalThis.fetch || require('node-fetch');

// Base URL - change as needed
const BASE_URL = process.argv[2] || 'https://catchandtrade.com';

async function testEndpoint(url, method = 'GET', data = null, expectedStatus = 200) {
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
    
    console.log(`${statusText} ${method} ${url}`);
    if (!statusMatch) {
      console.log(`   Response: ${JSON.stringify(responseData).substring(0, 200)}`);
    }
    
    return statusMatch;
  } catch (error) {
    console.log(`❌ ERROR ${method} ${url}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing CardVault API Endpoints\n');
  console.log(`Target: ${BASE_URL}\n`);

  let passed = 0;
  let total = 0;

  // Test 1: Health/basic endpoints
  total++;
  if (await testEndpoint('/api/users', 'GET', null, 200)) passed++;

  // Test 2: User registration (critical fix)
  total++;
  const testEmail = `test_${Date.now()}@example.com`;
  if (await testEndpoint('/api/users', 'POST', { 
    email: testEmail, 
    password: 'TestPass123!',
    username: `testuser_${Date.now()}`
  }, 200)) passed++;

  // Test 3: User login
  total++;
  if (await testEndpoint('/api/auth/login', 'POST', {
    email: testEmail,
    password: 'TestPass123!'
  }, 200)) passed++;

  // Test 4: Grading calculator (main issue)
  total++;
  if (await testEndpoint('/api/grading?cardValue=100&company=PSA&tier=STANDARD&expectedGrade=9', 'GET', null, 200)) passed++;
  
  // Test 5: Grading calculate (backward compatibility)
  total++;
  if (await testEndpoint('/api/grading/calculate?cardValue=50&company=BGS&tier=EXPRESS&expectedGrade=8', 'GET', null, 200)) passed++;

  // Test 6: Pokedex endpoints
  total++;
  if (await testEndpoint('/api/pokedex', 'GET', null, 200)) passed++;
  
  total++;
  if (await testEndpoint('/api/pokedex/1', 'GET', null, 200)) passed++;

  // Test 7: Card endpoints
  total++;
  if (await testEndpoint('/api/cards?limit=1', 'GET', null, 200)) passed++;
  
  total++;
  if (await testEndpoint('/api/cards/1', 'GET', null, 200)) passed++;

  // Test 8: Sets endpoints
  total++;
  if (await testEndpoint('/api/sets', 'GET', null, 200)) passed++;

  // Test 9: Auth providers
  total++;
  if (await testEndpoint('/api/auth?action=providers', 'GET', null, 200)) passed++;

  // Test 10: Watchlist endpoint
  total++;
  if (await testEndpoint('/api/watchlist', 'GET', null, 200)) passed++;

  // Test 11: Portfolios endpoint
  total++;
  if (await testEndpoint('/api/portfolios', 'GET', null, 200)) passed++;

  // Test 12: Check username endpoint (onboarding)
  total++;
  if (await testEndpoint(`/api/users/check-username?u=test${Date.now()}`, 'GET', null, 200)) passed++;

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! API endpoints are working correctly.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('💥 Test runner failed:', err);
  process.exit(1);
});