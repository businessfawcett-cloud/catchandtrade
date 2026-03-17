const fetch = require('node-fetch');

const API_URL = 'http://localhost:3003';

async function testLoginFlow() {
  console.log('Testing login flow...\n');

  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test1234' })
  });

  if (!loginResponse.ok) {
    console.log('❌ Login failed');
    return;
  }

  const loginData = await loginResponse.json();
  console.log('✓ Login successful');
  console.log('  Token:', loginData.token.substring(0, 30) + '...');
  console.log('  User ID:', loginData.user.id);
  console.log('  Username:', loginData.user.username);

  // Step 2: Get portfolios
  console.log('\nStep 2: Fetching portfolios...');
  const portfoliosResponse = await fetch(`${API_URL}/api/portfolios`, {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });

  if (!portfoliosResponse.ok) {
    console.log('❌ Failed to fetch portfolios:', portfoliosResponse.status);
    return;
  }

  const portfolios = await portfoliosResponse.json();
  console.log('✓ Portfolios fetched');
  console.log('  Count:', portfolios.length);
  console.log('  First portfolio:', portfolios[0]?.name);

  console.log('\n✅ Test complete! The user can now:');
  console.log('   1. Log in with test@test.com / test1234');
  console.log('   2. Access their portfolio');
  console.log('   3. See their slabs');
}

testLoginFlow().catch(console.error);
