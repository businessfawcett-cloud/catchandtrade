const bcrypt = require('bcrypt');

async function testPassword() {
  const password = 'test1234';
  
  // Hash the password
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash:', hash);
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash verification:', isValid);
}

testPassword().catch(console.error);
