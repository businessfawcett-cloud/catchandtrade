# Graded Slab Portfolio Tracker Implementation

## Overview
This implementation adds a **graded-only slab tracking system** to cardvault, focusing on PSA-certified cards with support for bulk import and cross-grade comparison.

## What Was Built

### 1. Database Schema Changes (`packages/db/prisma/schema.prisma`)

**New Tables:**
- `PsaCertCache` - Caches PSA cert lookup data with population counts
- `GradedPriceComparison` - Stores cross-grade pricing for arbitrage analysis

**Modified Tables:**
- `PortfolioItem` - Added `certNumber` (unique), sub-grade fields

### 2. API Endpoints

**New Files:**
- `packages/api/src/routes/slabs/index.ts`

**Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/slabs/portfolio` | Get graded slabs in user's portfolio |
| POST | `/api/slabs/bulk-lookup` | Lookup multiple PSA certs |
| POST | `/api/slabs/portfolio` | Add slab to portfolio |
| GET | `/api/grading/population/:cardId` | Get pop reports for card |

**Modified:**
- `packages/api/src/routes/grading/index.ts` - Added cert lookup endpoints

### 3. Frontend Components

**New Pages:**
- `apps/web/src/app/slabs/page.tsx` - Slab portfolio with toggle view
- `apps/web/src/app/slabs/import/page.tsx` - Bulk cert import

**Modified:**
- `apps/web/src/app/portfolio/page.tsx` - Added Graded/Ungraded toggle
- `apps/web/src/app/navbar.tsx` - Added Graded nav link

## Usage

### Import Slabs
1. Navigate to `/slabs/import`
2. Paste PSA certification numbers (one per line)
3. Click "Import Slabs"

### View Graded Cards
1. Navigate to `/portfolio`
2. Click "Graded" or "Ungraded" toggle
3. Or navigate to `/slabs` for dedicated graded view

### Cross-Slab Comparison
Coming soon - ability to compare PSA vs BGS vs CGC prices for same card

## API Examples

### Bulk Cert Lookup
```bash
POST /api/slabs/bulk-lookup
{
  "certNumbers": ["12345678", "56382910"]
}
```

### Get Portfolio
```bash
GET /api/slabs/portfolio
Authorization: Bearer <token>
```

### Add Slab to Portfolio
```bash
POST /api/slabs/portfolio
{
  "certNumber": "12345678",
  "gradeCompany": "PSA",
  "gradeValue": 10
}
```

## Implementation Status

✅ Database schema complete
✅ API endpoints implemented
✅ Frontend slab import page
✅ Portfolio Graded/Ungraded toggle
✅ Navbar navigation link

## Next Steps (Future)

1. **PSA Scraper** - Implement real PSA cert lookup via web scraping
2. **Cross-Slab Comparison** - Show prices across PSA/BGS/CGC
3. **Scarcity Alerts** - Pop count changes, price spikes
4. **Cert Timeline** - Sale history for each cert
5. **eBay Import** - Bulk import from eBay purchase history

## Notes

- The PSA scraper is currently a placeholder. In production, you'll need to:
  - Scrape PSA website (PSA doesn't have a public API)
  - Or use a third-party service like PokemonPriceTracker
- Data is cached for 24 hours to reduce API calls
- All endpoints require authentication except public lookup
