# PSA Scraper Implementation

## What Is Being Imported?

When you paste **PSA certification numbers**, the system imports:

### 1. Certification Data
- **Card Name** - e.g., "Charizard 4/102 Base Set"
- **Grade** - e.g., "10", "9.5", "9"
- **Population Count** - How many exist at that grade
- **Last Sale Price** - Most recent sold price
- **Sale Date** - When it last sold

### 2. Portfolio Entry
Each cert becomes a tracked item in your portfolio with:
- Grade company (PSA, CGC, BGS)
- Grade value
- Certification number (unique identifier)
- Link to card in database

## How It Works

### Step 1: User Input
```
Paste:
12345678
56382910
92837461
```

### Step 2: System Process
1. Normalize cert numbers (remove dashes/spaces)
2. Check cache (24-hour expiry)
3. If not cached, run scraper
4. Store result in database
5. Return data to user

### Step 3: Result
```json
{
  "certNumber": "12345678",
  "cardName": "Charizard 4/102 Base Set",
  "grade": "10",
  "popCount": 42,
  "lastSalePrice": 1200.00
}
```

## Scraper Architecture

### Real Scraper (Production)
- Fetches from PSA website: `https://www.psacard.com/cert/{cert}`
- Parses HTML to extract card info
- Requires handling:
  - Rate limiting
  - CAPTCHAs
  - HTML structure changes

### Mock Scraper (Development/Demo)
- Returns simulated data based on cert number pattern
- Enables testing without PSA blocking
- Ready for pitch/demo

## Files Changed

### New Files
- `packages/api/src/services/psaScraper.ts` - Scraper service
- `packages/api/src/routes/slabs/index.ts` - Slab endpoints
- `apps/web/src/app/slabs/page.tsx` - Slab portfolio
- `apps/web/src/app/slabs/import/page.tsx` - Import page

### Modified Files
- `packages/db/prisma/schema.prisma` - Added tables
- `packages/api/src/routes/grading/index.ts` - Added cert lookup
- `apps/web/src/app/portfolio/page.tsx` - Added toggle
- `apps/web/src/app/navbar.tsx` - Added Graded nav

## API Endpoints

### POST /api/grading/cert/lookup
Lookup single PSA cert
```json
{"certNumber": "12345678"}
```

### POST /api/grading/cert/bulk-lookup
Lookup multiple certs (up to 100)
```json
{"certNumbers": ["12345678", "56382910"]}
```

### GET /api/slabs/portfolio
Get user's graded slab portfolio
```
Authorization: Bearer <token>
```

## Demo Cert Numbers

The mock scraper returns different data for these patterns:

| Cert Prefix | Card | Grade | Pop | Price |
|-------------|------|-------|-----|-------|
| 1xxxxxxx | Charizard 4/102 | 10 | 42 | $1,200 |
| 2xxxxxxx | Blastoise 9/102 | 9 | 156 | $340 |
| 3xxxxxxx | Pikachu 25/102 | 10 | 89 | $45 |
| Other | Mewtwo 12/102 | Varies | Varies | Varies |

## Next Steps for Production

1. **Replace mock scraper** with real PSA scraper
2. **Add CGC/BGS support** (different API endpoints)
3. **Implement population tracking** over time
4. **Add cross-slab comparison** (PSA vs BGS prices)
