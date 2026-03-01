# PRD: eBay Browse API Pricing Integration

**Author:** Catch & Trade Team
**Date:** February 28, 2026
**Status:** Draft

---

## 1. Overview

### Problem Statement

catchandtrade.com currently relies on TCGPlayer for Pokemon card pricing through multiple fragile methods: Puppeteer web scraping, Pokemon TCG API embedded prices, and an experimental GraphQL endpoint. TCGPlayer access is unreliable and scraping is brittle. We need a stable, API-based pricing source.

### Solution

Replace all TCGPlayer pricing with the eBay Browse API. eBay provides a well-documented, OAuth-authenticated API for searching active card listings, giving us real-time market pricing from the world's largest card marketplace.

### Goals

- Eliminate all TCGPlayer dependencies from the codebase
- Provide reliable, API-based pricing using eBay active listings
- Show users two key data points: lowest Buy It Now price and market price (trimmed mean of listings)
- Build a foundation that can later incorporate sold/completed item data when Marketplace Insights access is obtained
- Rename all TCGPlayer-specific schema fields to be source-agnostic

### Non-Goals (V1)

- Sold/completed listing data (requires eBay Marketplace Insights approval)
- Graded card pricing from eBay
- Multi-currency support (USD only for V1)
- PriceCharting integration (existing placeholder fields preserved but not implemented)
- No new features — this is a pricing source swap + dead code cleanup only

### Cleanup: Remove Price Alerts

The Price Alerts feature (`PriceAlert` model, `AlertType` enum, related routes and UI) is not a shipped feature. All Price Alert code should be removed as part of this work:
- `PriceAlert` model and `AlertType` enum from Prisma schema
- Alert evaluation logic from `nightlySync.ts`
- `/api/alerts` route
- Any frontend alert UI components
- `priceAlerts` relations on `User` and `Card` models

---

## 2. User Stories

### Card Viewer

> As a user browsing cards, I want to see the current market price and the lowest available Buy It Now price so I can understand what a card is worth and where to buy it.

**Acceptance Criteria:**
- Card detail page displays a market price derived from eBay active listings
- Card detail page displays the lowest current Buy It Now price from eBay
- If no eBay data is available, the last known price is shown with a "may be outdated" indicator
- Price history chart continues to work with the new data source

### Portfolio Owner

> As a portfolio owner, I want my collection's total value calculated from current eBay market prices so I have an accurate picture of what my cards are worth.

**Acceptance Criteria:**
- Portfolio value uses eBay-sourced market prices
- Portfolio items display current market price per card
- Sort by price works correctly with the new data

---

## 3. Technical Architecture

### 3.1 eBay API Integration

**Authentication:**
- OAuth 2.0 Client Credentials Grant (application access token)
- Endpoint: `https://api.ebay.com/identity/v1/oauth2/token`
- Credentials:
  - `EBAY_APP_ID` — App ID / Client ID
  - `EBAY_DEV_ID` — Developer ID
  - `EBAY_CERT_ID` — Cert ID / Client Secret
- Auth header: Base64 of `{EBAY_APP_ID}:{EBAY_CERT_ID}`
- Token lifetime: ~2 hours, cached in-memory with auto-refresh

**Search Endpoint:**
- `GET https://api.ebay.com/buy/browse/v1/item_summary/search`
- Marketplace: `EBAY_US`
- Category: `183454` (Pokemon Trading Card Game)
- Fieldgroup: `EXTENDED` (includes `localizedAspects` for card number matching)
- Filter: `buyingOptions:{FIXED_PRICE}`, conditions: `NEW|LIKE_NEW|VERY_GOOD`
- Limit: max results per call (200)

**Rate Limits:**
- eBay basic tier: ~5,000 API calls/day
- A global daily call counter enforces this budget across all sync tiers

### 3.2 Two-Tiered Hybrid Sync Engine

The 5,000 daily API calls are treated as a **budget** to be spent strategically between broad set-level updates and surgical single-card refreshes.

#### Tier 1: Bulk Discovery Pass

Query eBay using **entire set names** as keywords (e.g., `"Scarlet & Violet 151"`) with the `EXTENDED` fieldgroup enabled and max results (200 per call). The system iterates through the returned `itemSummaries` and uses a **matching algorithm** to identify the card number within the `localizedAspects` or listing `title`. Every card that can be matched updates its price and `lastUpdated` timestamp.

A single API call can "accidentally" price **dozens of cards** from that set, making this dramatically more efficient than one-call-per-card.

**Example flow:**
1. Query: `"Scarlet & Violet 151 Pokemon Card"` → returns 200 listings
2. Parse each listing title/aspects for card numbers (e.g., "001/165", "025/165")
3. Match to DB cards by `setCode` + `cardNumber`
4. Update matched cards' prices using trimmed mean of their matched listings

#### Tier 2: Precision Cleanup Pass

After the bulk pass, pull a prioritized **hit list** of cards that are still stale — sorted by:
1. Cards in user portfolios/watchlists (highest priority)
2. Highest-value cards
3. Oldest `lastUpdated` timestamp

Perform targeted one-to-one searches using specific set-and-number strings (e.g., `"151" "001/165"`).

#### Budget Enforcement

A global daily call counter tracks usage across both tiers. The system reserves a portion of the budget (e.g., 500 calls) for on-demand snapshots and never exceeds the 5,000-call quota.

### 3.3 Price Calculation

From the matched listings for a given card, a **trimmed mean filter** discards outliers (e.g., drop top/bottom 10% of prices) before calculation:

| Field | Calculation |
|-------|-------------|
| `priceMarket` | Trimmed mean (average after removing outliers) |
| `priceMid` | Median price of matched listings |
| `priceLow` | Lowest price after outlier removal |
| `priceHigh` | Highest price after outlier removal |
| `ebayBuyNowLow` | Lowest Buy It Now price (raw, no trimming) |

When sold data is available in V2:
- `priceMarket` will shift to trimmed mean of sold prices
- `ebayBuyNowLow` will remain as the lowest active BIN
- `ebaySoldAvg` will store the average sold price

### 3.4 Schema Changes

**`Card` model:**
| Current | New | Reason |
|---------|-----|--------|
| `tcgplayerId` | `pokemonTcgId` | This field stores the Pokemon TCG data API ID (e.g., `base1-4`), not a TCGPlayer product ID. Renaming for clarity. |

**`CardPrice` model:**
| Current | New | Reason |
|---------|-----|--------|
| `tcgplayerLow` | `priceLow` | Source-agnostic |
| `tcgplayerMid` | `priceMid` | Source-agnostic |
| `tcgplayerHigh` | `priceHigh` | Source-agnostic |
| `tcgplayerMarket` | `priceMarket` | Source-agnostic |
| `ebayRecentAvg` | `ebaySoldAvg` | Clearer naming (for future V2) |
| — | `ebayBuyNowLow` (new) | Lowest active Buy It Now price |
| — | `lastUpdated` (new) | When eBay data was last fetched |
| — | `isStale` (new) | Whether the price data may be outdated |

**`PriceHistory` model:**
- `source` default changes from `"tcgplayer"` to `"ebay"`
- Existing historical records with `source: "tcgplayer"` are preserved

**Migration approach:** Custom SQL migration using `ALTER TABLE ... RENAME COLUMN` to preserve all existing price data.

### 3.5 Error Handling

| Scenario | Behavior |
|----------|----------|
| No eBay results for a card | Keep last known price, set `isStale: true` |
| eBay returns 429 (rate limit) | Back off 60 seconds, retry batch |
| eBay returns 401 (token expired) | Refresh token, retry once |
| eBay returns 500/503 | Skip card, mark stale, continue |
| No credentials configured | Return mock prices (development mode) |
| Card has never had a price | Display "No market data available" |

### 3.6 Staleness Indicator

Cards that haven't been successfully priced in a configurable window are marked `isStale: true`. The frontend displays a subtle "Price data may be outdated" message. This replaces the previous behavior of silently showing stale TCGPlayer data.

---

## 4. Affected Components

### Backend (packages/api)

| Component | Change |
|-----------|--------|
| `services/pricing/tcgplayer.ts` | **Delete.** Replace with `ebay.ts` |
| `services/pricing/ebay.ts` | **New.** eBay Browse API client with token management, search, and price calculation |
| `services/pricing/aggregator.ts` | Update field names, swap to EbayFetcher |
| `cron/nightlySync.ts` | Rewrite `syncPrices()` as Two-Tiered Hybrid Sync Engine; rename `tcgplayerId` → `pokemonTcgId` in `syncCards()`; remove alert evaluation logic |
| `routes/pricing/index.ts` | Rename fields in select/response |
| `routes/cards/index.ts` | Rename ~5 `tcgplayerMarket` references to `priceMarket` |
| `routes/portfolios/index.ts` | Rename field in value calculation |
| `routes/watchlist/index.ts` | Rename field in price display |
| `routes/alerts/` | **Delete.** Price Alerts feature removed |

### Database (packages/db)

| Component | Change |
|-----------|--------|
| `prisma/schema.prisma` | Rename fields, add new columns, remove `PriceAlert` model + `AlertType` enum |
| `prisma/seed.ts` / `seed.js` | Rename `tcgplayerId` → `pokemonTcgId` |
| `scripts/puppeteer-prices.js` | **Delete.** TCGPlayer scraping no longer needed |
| `scripts/scrape-prices.js` | **Delete.** TCGPlayer GraphQL no longer needed |
| `scripts/sync-prices.js` | **Delete.** Pokemon TCG API prices no longer needed |
| `scripts/add-sample-prices.js` | Rename fields |
| `scripts/record-price-snapshot.js` | Rename fields, change source to `"ebay"` |
| `scripts/import-cards.js` | Rename `tcgplayerId` → `pokemonTcgId` |

### Frontend (apps/web)

| Component | Change |
|-----------|--------|
| `marketplace/[id]/page.tsx` | Update `CardPrice` interface, show Buy Now price, add stale indicator |
| `components/cards/CardDetailPage.tsx` | Update `CardPrice` interface, rename field refs |
| `marketplace/page.tsx` | Remove TCGPlayer affiliate link |
| `portfolio/page.tsx` | Remove TCGPlayer affiliate link |
| `components/PriceHistoryChart.tsx` | No structural changes (already uses generic `price` field) |

### Environment

| Remove | Add |
|--------|-----|
| `TCGPLAYER_PUBLIC_KEY` | `EBAY_APP_ID` (Client ID) |
| `TCGPLAYER_PRIVATE_KEY` | `EBAY_DEV_ID` (Developer ID) |
| Hardcoded key in `nightlySync.ts` line 7 | `EBAY_CERT_ID` (Client Secret) |

---

## 5. Data Display

### Card Detail Page

```
Market Price:  $45.50          Buy Now From: $42.99
Low: $38.00  |  High: $62.00

[Price History Chart - 7D / 30D / 90D / 1Y]

⚠ Price data may be outdated (if isStale)
```

### Portfolio View

```
Card Name       Set              Price      Qty    Value
Charizard ex    Obsidian Flames  $45.50     2      $91.00
────────────────────────────────────────────────────────
Total Value: $1,234.56
```

Price = `priceMarket` from latest `CardPrice` record.

---

## 6. Future Enhancements (V2+)

- **Sold/completed listing data** — When Marketplace Insights access is approved, add `ebaySoldAvg` (average sold price) as the primary market price, with `ebayBuyNowLow` as the "available now" price
- **Search quality scoring** — Compare listing titles against expected card details to filter irrelevant results
- **eBay affiliate links** — Deep links to eBay search results for specific cards
- **Higher API tier** — Apply for increased rate limits as user base grows

---

## 7. Implementation Phases

| Phase | Scope | Dependencies |
|-------|-------|--------------|
| 1. Schema Migration | Rename columns, add new fields, remove PriceAlert model, custom SQL migration | None |
| 2. eBay Service | New `ebay.ts` with auth, search, card matching, trimmed mean price calculation | Phase 1 |
| 3. Sync Engine | Two-Tiered Hybrid Sync: bulk discovery pass + precision cleanup pass with budget enforcement | Phase 1 + 2 |
| 4. Aggregator Update | Swap fetcher, update field names | Phase 1 + 2 |
| 5. API Routes | Rename fields across all route handlers, delete alerts route | Phase 1 |
| 6. Frontend | Update interfaces, add Buy Now price, stale indicator, remove alert UI | Phase 5 |
| 7. Cleanup | Delete TCGPlayer files, alert code, update scripts, env vars | Phase 1 |
| 8. Tests | Update existing tests, add eBay service + sync engine tests | All phases |

---

## 8. Success Metrics

- All cards in user portfolios have eBay-sourced prices within 1 week of launch
- Zero remaining references to TCGPlayer in the codebase
- Price history chart shows continuous data across the migration (no gaps)
- Nightly sync completes without exceeding eBay rate limits
- Frontend displays both market price and Buy Now price for cards with eBay data
