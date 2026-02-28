# Implementation Plan: eBay Pricing Integration

**Branch**: `001-ebay-pricing` | **Date**: 2026-02-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ebay-pricing/spec.md`

## Summary

Replace all TCGPlayer pricing dependencies with the eBay Browse API. This is a pricing source swap + dead code cleanup: new eBay service with OAuth2 auth, two-tiered sync engine (bulk by set + precision by card), schema migration renaming tcgplayer-specific fields to source-agnostic names, removal of Price Alerts feature, and frontend updates to display Buy It Now price. Staleness is tracked internally (database + sync prioritization) but not exposed in the UI.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js ^25.3.2
**Primary Dependencies**: Express 4.18.2, Prisma 5.8.0, node-cron 3.0.3, Next.js 14.2.35, Recharts 2.10.0
**Storage**: PostgreSQL via Prisma ORM
**Testing**: No test framework currently configured (manual testing)
**Target Platform**: Web (Node.js API server + Next.js frontend)
**Project Type**: Monorepo web-service (Turbo + npm workspaces)
**Performance Goals**: Daily sync within 5,000 API call budget; bulk pass >= 20 cards/call average
**Constraints**: eBay basic tier 5,000 calls/day; 48h staleness window (env-configurable); USD only
**Scale/Scope**: ~170 sets, ~15,000+ cards; packages/api, packages/db, packages/shared, apps/web

## Constitution Check

*No constitution configured — template only. No gates to enforce.*

## Project Structure

### Documentation (this feature)

```text
specs/001-ebay-pricing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── api/src/
│   ├── services/pricing/
│   │   ├── ebay.ts              # NEW: eBay Browse API client
│   │   └── aggregator.ts        # UPDATE: swap fetcher, rename fields
│   ├── cron/
│   │   └── nightlySync.ts       # REWRITE: two-tiered sync engine
│   ├── routes/
│   │   ├── pricing/index.ts     # UPDATE: rename response fields
│   │   ├── cards/index.ts       # UPDATE: tcgplayerMarket → priceMarket
│   │   ├── portfolios/index.ts  # UPDATE: tcgplayerMarket → priceMarket
│   │   ├── watchlist/index.ts   # UPDATE: tcgplayerMarket → priceMarket
│   │   └── alerts/index.ts      # DELETE
│   └── index.ts                 # UPDATE: remove alerts import/route
├── db/
│   ├── prisma/
│   │   ├── schema.prisma        # UPDATE: rename fields, add columns, remove PriceAlert
│   │   ├── migrations/          # NEW: custom SQL migration
│   │   └── seed.js              # UPDATE: tcgplayerId → pokemonTcgId
│   └── scripts/
│       ├── puppeteer-prices.js      # DELETE
│       ├── scrape-prices.js         # DELETE
│       ├── sync-prices.js           # DELETE
│       ├── add-sample-prices.js     # UPDATE: rename fields
│       ├── record-price-snapshot.js # UPDATE: rename fields, source → "ebay"
│       └── import-cards.js          # UPDATE: tcgplayerId → pokemonTcgId
├── shared/src/
│   └── affiliate.ts             # UPDATE: remove tcgplayer method
apps/
└── web/src/
    ├── app/
    │   ├── marketplace/[id]/page.tsx  # UPDATE: CardPrice interface, Buy Now, stale indicator
    │   ├── marketplace/page.tsx       # UPDATE: remove TCGPlayer affiliate
    │   └── portfolio/page.tsx         # UPDATE: remove TCGPlayer affiliate
    └── components/
        ├── cards/CardDetailPage.tsx   # UPDATE: price field refs
        └── PriceHistoryChart.tsx      # NO CHANGE
```

**Structure Decision**: Existing monorepo structure preserved. New eBay service replaces TCGPlayer service in `services/pricing/`. No new packages or structural changes.

## Complexity Tracking

No constitution violations to justify.

---

## Phase-by-Phase Implementation

### Phase 1: Schema Migration

**Goal**: Rename columns, add new fields, remove PriceAlert model.

**File**: `packages/db/prisma/schema.prisma`

| Model | Change | Details |
|-------|--------|---------|
| Card | Rename field | `tcgplayerId` → `pokemonTcgId` (stores Pokemon TCG data API IDs like `base1-4`) |
| Card | Remove relation | `priceAlerts PriceAlert[]` |
| CardPrice | Rename 4 fields | `tcgplayerLow/Mid/High/Market` → `priceLow/Mid/High/Market` |
| CardPrice | Rename field | `ebayRecentAvg` → `ebaySoldAvg` |
| CardPrice | Add 4 fields | `ebayBuyNowLow Float?`, `lastUpdated DateTime?`, `isStale Boolean @default(false)`, `listingCount Int @default(0)` |
| PriceHistory | Change default | `source` default from `"tcgplayer"` to `"ebay"` |
| PriceAlert | Delete model | Entire model removed |
| AlertType | Delete enum | Entire enum removed |
| User | Remove relation | `priceAlerts PriceAlert[]` |
| SyncLog | Remove field | `triggeredAlerts` |

**Migration**: Custom SQL via `prisma migrate dev` using `ALTER TABLE ... RENAME COLUMN` to preserve data. Existing `source: "tcgplayer"` records in PriceHistory are untouched.

### Phase 2: eBay Service

**Goal**: New `packages/api/src/services/pricing/ebay.ts`

**Class: `EbayPriceFetcher`** (mirrors existing TCGPlayerFetcher pattern — class-based, constructor reads env vars, mock fallback):

1. **`getAccessToken()`** — OAuth2 Client Credentials grant
   - POST `https://api.ebay.com/identity/v1/oauth2/token`
   - Auth header: Base64 of `{EBAY_APP_ID}:{EBAY_CERT_ID}`
   - Cache token in-memory, auto-refresh before expiry (~2h lifetime)
   - Env: `EBAY_APP_ID`, `EBAY_CERT_ID`

2. **`searchBySet(setName)`** — Bulk search for set listings
   - GET `https://api.ebay.com/buy/browse/v1/item_summary/search`
   - Headers: `X-EBAY-C-MARKETPLACE-ID: EBAY_US`
   - Params: `q="{setName} Pokemon Card"`, `category_ids=183454`, `filter=buyingOptions:{FIXED_PRICE},conditions:{NEW|LIKE_NEW|VERY_GOOD}`, `fieldgroups=EXTENDED`, `limit=200`

3. **`searchByCard(setName, cardNumber)`** — Precision search for single card
   - Same endpoint, query: `"{setName}" "{cardNumber}"`

4. **`matchListingsToCards(listings, setCode)`** — Card number extraction
   - Check `localizedAspects` for "Card Number" aspect
   - Fallback: regex `/(\d{1,3})\s*\/\s*\d{1,3}/` on listing title
   - Match to DB cards by `setCode` + `cardNumber`

5. **`calculatePrices(listings)`** — Price calculation per FR-004 clarification
   - `< 3 listings`: raw average
   - `3-4 listings`: untrimmed average
   - `>= 5 listings`: trimmed mean (drop top/bottom 10%)
   - Outputs: `priceMarket`, `priceMid`, `priceLow`, `priceHigh`, `ebayBuyNowLow` (absolute min)

6. **`BudgetTracker`** — Daily call counter
   - Midnight reset, `canMakeCall()`, `recordCall()`, `getRemainingBudget()`
   - Reserve 500 for on-demand snapshots
   - Env: `EBAY_DAILY_BUDGET` (default 5000)

7. **Mock fallback** — If `EBAY_APP_ID` not set, return mock prices (dev mode)

### Phase 3: Sync Engine

**Goal**: Rewrite `packages/api/src/cron/nightlySync.ts` `syncPrices()`.

**Tier 1 — Bulk Discovery Pass** (`runBulkPass()`):
1. Fetch all PokemonSet records
2. For each set: `ebay.searchBySet(set.name)`
3. Match listings to cards via card number extraction
4. Update matched cards' CardPrice with calculated prices + `lastUpdated`, `isStale=false`, `listingCount`
5. Stop when budget runs low (reserve 500 for Tier 2 + on-demand)

**Tier 2 — Precision Cleanup Pass** (`runPrecisionPass()`):
1. Query stale cards prioritized by: portfolio/watchlist membership → highest value → oldest `lastUpdated`
2. For each: `ebay.searchByCard(card.setName, card.cardNumber)`
3. Update price record
4. Continue until budget exhausted

**After both passes**: Mark all cards with `lastUpdated` older than `STALE_THRESHOLD_HOURS` (default 48) as `isStale = true`.

**Schedule**: Keep 2 AM UTC nightly cron. Remove alert evaluation. Weekly sync (sets/cards) unchanged except `tcgplayerId` → `pokemonTcgId`.

### Phase 4: Aggregator Update

**File**: `packages/api/src/services/pricing/aggregator.ts`

- Replace `TCGPlayerFetcher` → `EbayPriceFetcher`
- Rename `AggregatedPrice` interface fields: `tcgplayer*` → `price*`, add `ebayBuyNowLow`
- Update `calculateExpectedValue()`: query `priceMarket` instead of `tcgplayerMarket`
- Update `snapshotPrices()`: use `card.pokemonTcgId`, call ebay fetcher, write new field names

### Phase 5: API Routes

| File | Line(s) | Change |
|------|---------|--------|
| `routes/pricing/index.ts` | 21-29, 35-43 | Rename all tcgplayer* → price*; add ebayBuyNowLow, lastUpdated, isStale to select/response |
| `routes/cards/index.ts` | 56, 155, 157, 170, 199 | `tcgplayerMarket` → `priceMarket` |
| `routes/portfolios/index.ts` | 301, 356 | `tcgplayerMarket` → `priceMarket` |
| `routes/watchlist/index.ts` | 51 | `tcgplayerMarket` → `priceMarket` |
| `routes/alerts/index.ts` | all | **Delete file** |
| `index.ts` | 14, 67 | Remove alertsRouter import and route registration |

### Phase 6: Frontend

| File | Changes |
|------|---------|
| `marketplace/[id]/page.tsx` | Update `CardPrice` interface (tcgplayer* → price*), add `ebayBuyNowLow`/`lastUpdated`, display "Buy Now From: $X.XX", display "No market data available" for unpriced cards, remove tcgplayer from `getAffiliateLinks()` |
| `marketplace/page.tsx` | Remove tcgplayer affiliate link |
| `portfolio/page.tsx` | Remove tcgplayer affiliate link |
| `components/cards/CardDetailPage.tsx` | `tcgplayerMarket` → `priceMarket` |
| `components/PriceHistoryChart.tsx` | No changes (uses generic `price` from PriceHistory) |

### Phase 7: Cleanup

**Delete files**:
- `packages/api/src/services/pricing/tcgplayer.ts`
- `packages/api/src/routes/alerts/index.ts` (Phase 5)
- `packages/db/scripts/puppeteer-prices.js`
- `packages/db/scripts/scrape-prices.js`
- `packages/db/scripts/sync-prices.js`

**Update scripts**: Rename tcgplayer* → price*/pokemonTcgId in:
- `packages/db/scripts/add-sample-prices.js`
- `packages/db/scripts/record-price-snapshot.js` (also source → "ebay")
- `packages/db/scripts/import-cards.js`
- `packages/db/prisma/seed.js`

**Root package.json**: Remove `sync-prices`, `fetch-prices`, `scrape-prices` scripts.

**Environment (.env.example)**:
- Remove: `TCGPLAYER_PUBLIC_KEY`, `TCGPLAYER_PRIVATE_KEY`, `TCGPLAYER_AFFILIATE_ID`
- Add: `STALE_THRESHOLD_HOURS=48`, `EBAY_DAILY_BUDGET=5000`
- `EBAY_APP_ID` and `EBAY_CERT_ID` already present
- Remove hardcoded API key from nightlySync.ts line 7

**Shared**: Remove tcgplayer method from `packages/shared/src/affiliate.ts`
