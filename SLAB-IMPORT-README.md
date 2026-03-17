# Slab Import System - Complete

## What Are We Importing?

**PSA Certification Numbers** → **Full Graded Card Details**

When you paste PSA cert numbers, the system imports:
- Card name and set information
- Grade (PSA 10, 9.5, 9, etc.)
- Population count (how many exist at that grade)
- Last sale price and date
- Certification verification

## Demo Cert Numbers

Use these to test the scraper:

| Cert Number | Card | Grade | Pop | Price |
|-------------|------|-------|-----|-------|
| **12345678** | Charizard 4/102 | PSA 10 | 42 | $1,200 |
| **22222222** | Blastoise 9/102 | PSA 9 | 156 | $340 |
| **33333333** | Pikachu 25/102 | PSA 10 | 89 | $45 |
| **44444444** | (not found) | — | — | — |

## Test the API

### 1. Single Lookup
```bash
curl -X POST http://localhost:3003/api/grading/cert/lookup \
  -H "Content-Type: application/json" \
  -d '{"certNumber": "12345678"}'
```

**Response:**
```json
{
  "certNumber": "12345678",
  "cardName": "Unknown Card",
  "grade": "10",
  "grader": "PSA",
  "popCount": 42,
  "lastSalePrice": 1200,
  "isCached": true
}
```

### 2. Bulk Lookup
```bash
curl -X POST http://localhost:3003/api/grading/cert/bulk-lookup \
  -H "Content-Type: application/json" \
  -d '{"certNumbers": ["12345678", "22222222", "44444444"]}'
```

**Response:**
```json
{
  "total": 3,
  "found": 2,
  "notFound": 1,
  "results": [...]
}
```

## How It Works

```
User Pastes Certs
       ↓
Normalize Numbers
       ↓
Check Cache (24hr)
       ↓
   Miss? → Run Scraper → Store in DB
       ↓
Return Card Details + Pop Data
```

## Files Created

### Backend
- `packages/api/src/services/psaScraper.ts` - Scraping logic
- `packages/api/src/routes/slabs/index.ts` - Slab API routes
- `packages/db/prisma/schema.prisma` - New tables

### Frontend
- `apps/web/src/app/slabs/page.tsx` - Portfolio view
- `apps/web/src/app/slabs/import/page.tsx` - Import page
- `apps/web/src/app/portfolio/page.tsx` - Graded/Ungraded toggle

## Scraper Logic

The scraper runs in this order:
1. **Check cache** - If data is fresh (24hrs), return cached
2. **Try real scraper** - Fetch from PSA website (may fail)
3. **Use mock data** - Return simulated data for demo
4. **Store in DB** - Cache for future requests

## Next for Production

- [ ] Replace mock scraper with real PSA web scraper
- [ ] Add CGC/BGS certification support
- [ ] Implement population tracking over time
- [ ] Add cross-slab price comparison
- [ ] eBay import for purchase history
