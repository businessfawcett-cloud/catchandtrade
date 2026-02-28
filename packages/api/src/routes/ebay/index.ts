import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

const VERIFICATION_TOKEN = 'catchandtrade_ebay_verify_2025';
const ENDPOINT_URL = 'https://api.catchandtrade.com/api/ebay/account-deletion';

router.get('/account-deletion', (req, res) => {
  const challengeCode = req.query.challenge_code as string;
  if (!challengeCode) return res.status(400).json({ error: 'Missing challenge_code' });
  
  const hash = crypto.createHash('sha256');
  hash.update(challengeCode);
  hash.update(VERIFICATION_TOKEN);
  hash.update(ENDPOINT_URL);
  const challengeResponse = hash.digest('hex');
  
  return res.json({ challengeResponse });
});

router.post('/account-deletion', (req, res) => {
  console.log('eBay account deletion notification:', req.body);
  return res.status(200).json({ success: true });
});

export default router;
