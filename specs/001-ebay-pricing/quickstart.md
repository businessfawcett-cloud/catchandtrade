# Quickstart: eBay Pricing Integration

**Feature**: 001-ebay-pricing | **Date**: 2026-02-28

## Prerequisites

- Node.js ^25.3.2
- PostgreSQL running with existing cardvault database
- eBay Developer Account with Production App credentials (App ID + Cert ID)

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# eBay API (required for live pricing)
EBAY_APP_ID=your-ebay-app-id
EBAY_CERT_ID=your-ebay-cert-id

# Optional tuning
STALE_THRESHOLD_HOURS=48
EBAY_DAILY_BUDGET=5000
```

Remove (no longer used):
```env
# TCGPLAYER_PUBLIC_KEY=
# TCGPLAYER_PRIVATE_KEY=
# TCGPLAYER_AFFILIATE_ID=
```

### 2. Run Schema Migration

```bash
cd packages/db
npx prisma migrate dev --name ebay-pricing-rename
```

This renames columns (preserving data), adds new columns, and removes the PriceAlert model. **Verify**: Existing price data should be intact after migration.

### 3. Verify Migration

```bash
npx prisma studio
```

Open Prisma Studio and confirm:
- `Card` model has `pokemonTcgId` field (was `tcgplayerId`)
- `CardPrice` model has `priceMarket`, `priceLow`, `priceMid`, `priceHigh` fields
- `CardPrice` model has new `ebayBuyNowLow`, `lastUpdated`, `isStale`, `listingCount` fields
- `PriceAlert` model no longer exists
- Existing price records still have their values

### 4. Test eBay API Connection

Start the API server and trigger a manual snapshot:

```bash
# Start API
cd packages/api && npm run dev

# Test token retrieval (check server logs for "eBay token obtained")
# Then trigger a manual sync via the pricing endpoint:
curl -X POST http://localhost:3003/api/pricing/cards/{cardId}/snapshot
```

### 5. Run Manual Sync

To trigger the full two-tiered sync manually (outside the 2 AM cron):

```bash
# Via the API server's internal functions (add a temporary admin endpoint or use node REPL)
node -e "
  require('dotenv/config');
  const { runNightlySync } = require('./packages/api/dist/cron/nightlySync');
  runNightlySync().then(() => console.log('Done'));
"
```

## Development Mode (No eBay Credentials)

If `EBAY_APP_ID` is not set, the eBay service returns mock prices. This allows local development and testing without live API access. Mock prices follow the same structure as real prices but use randomized values.

## Key Files

| File | Purpose |
|------|---------|
| `packages/api/src/services/pricing/ebay.ts` | eBay Browse API client |
| `packages/api/src/cron/nightlySync.ts` | Two-tiered sync engine |
| `packages/api/src/services/pricing/aggregator.ts` | Price aggregation + expected value |
| `packages/db/prisma/schema.prisma` | Database schema |
| `apps/web/src/app/marketplace/[id]/page.tsx` | Card detail page (shows prices) |

## Verification Checklist

- [ ] Migration completes without errors
- [ ] Existing price data preserved (spot-check a few cards in Prisma Studio)
- [ ] eBay OAuth2 token retrieval succeeds (check server logs)
- [ ] Bulk sync prices at least one set successfully
- [ ] Card detail page shows Market Price + Buy It Now price
- [ ] Stale cards flagged correctly in database (`isStale` field in CardPrice)
- [ ] Portfolio value calculation works with new field names
- [ ] No `tcgplayer` references remain in active code (`grep -r "tcgplayer" packages/ apps/ --include="*.ts" --include="*.tsx" --include="*.js"`)
