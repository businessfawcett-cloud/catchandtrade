# Research: eBay Pricing Integration

**Feature**: 001-ebay-pricing | **Date**: 2026-02-28

## R1: eBay Browse API Authentication

**Decision**: Use OAuth2 Client Credentials Grant (application-level access token).

**Rationale**: The Browse API's `item_summary/search` endpoint only requires application-level access (no user consent needed). Client Credentials is the simplest flow — a single POST request returns a bearer token. No PKCE, no redirect URI, no user interaction.

**Alternatives considered**:
- Authorization Code Grant — unnecessarily complex; requires user consent flow, which isn't needed for reading public listing data.

**Key details**:
- Endpoint: `POST https://api.ebay.com/identity/v1/oauth2/token`
- Auth header: `Basic {Base64(EBAY_APP_ID:EBAY_CERT_ID)}`
- Body: `grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope`
- Token lifetime: ~7200 seconds (2 hours)
- `EBAY_DEV_ID` is NOT needed for Client Credentials — only APP_ID and CERT_ID
- Strategy: Cache token in-memory with `expiresAt` timestamp, refresh 5 minutes before expiry

## R2: eBay Browse API Search Optimization

**Decision**: Use set-level bulk queries (200 results/call) as the primary pricing strategy, supplemented by single-card precision queries.

**Rationale**: With a 5,000 call/day budget and ~170 sets, the bulk approach can cover the entire catalog in ~170 calls, leaving 4,800+ calls for precision follow-ups. A naive one-card-per-call approach would exhaust the budget on ~5,000 cards (out of 15,000+).

**Alternatives considered**:
- One card per API call — would price only ~5,000 cards/day, never reaching full coverage.
- Pagination through all listings — each additional page costs another API call; diminishing returns after the first 200 results per set.

**Key details**:
- Endpoint: `GET https://api.ebay.com/buy/browse/v1/item_summary/search`
- Required headers: `Authorization: Bearer {token}`, `X-EBAY-C-MARKETPLACE-ID: EBAY_US`
- Params: `q`, `category_ids=183454`, `filter`, `fieldgroups=EXTENDED`, `limit=200`
- `EXTENDED` fieldgroup includes `localizedAspects` which contains structured card attributes
- Filter: `buyingOptions:{FIXED_PRICE},conditions:{NEW|LIKE_NEW|VERY_GOOD}`
- Results cap: 200 per call (eBay max), no pagination needed for bulk pass

## R3: Card Number Matching Algorithm

**Decision**: Two-step extraction — first check `localizedAspects` for structured "Card Number" data, then fall back to regex on listing title.

**Rationale**: eBay's `EXTENDED` fieldgroup returns `localizedAspects` which often includes structured item specifics like "Card Number: 025/165". This is the most reliable source. Many sellers also include card numbers in titles (e.g., "Pikachu 025/165 Scarlet & Violet 151"), so title regex serves as a fallback for listings without structured aspects.

**Alternatives considered**:
- Title-only matching — less reliable; titles vary wildly in format and may not include card numbers.
- Image recognition — too complex for V1; would require ML infrastructure.
- Using eBay item specifics API — requires additional API calls per item, eating into budget.

**Key details**:
- Primary: Parse `localizedAspects` array for `name: "Card Number"` or similar aspect names
- Fallback: Regex patterns on `title`:
  - `/(\d{1,3})\s*\/\s*(\d{1,3})/` — matches "025/165" format
  - `/(?:#|No\.?)\s*(\d{1,3})/i` — matches "#025" or "No. 025" format
- Match extracted number to `Card.cardNumber` where `Card.setCode` matches the queried set
- Cards with no extractable number from any listing are skipped (not matched)

## R4: Prisma Migration Strategy

**Decision**: Use `prisma migrate dev` to generate a migration, then hand-edit the SQL to use `ALTER TABLE ... RENAME COLUMN` instead of drop-and-recreate.

**Rationale**: Prisma's default migration generator may create drop-column + add-column SQL for renames, which would destroy existing price data. By editing the generated SQL to use RENAME COLUMN, all data is preserved. PostgreSQL supports `ALTER TABLE ... RENAME COLUMN` natively.

**Alternatives considered**:
- `prisma db push` — skips migration files entirely; fine for dev but unsuitable for production since there's no migration history.
- Manual SQL migration without Prisma — adds maintenance burden; Prisma migration tracking is preferred.

**Key details**:
- Generate: `npx prisma migrate dev --name ebay-pricing-rename --create-only`
- Edit SQL: Replace any `DROP COLUMN` + `ADD COLUMN` pairs with `RENAME COLUMN`
- Apply: `npx prisma migrate dev` (applies the edited SQL)
- For model deletion (PriceAlert, AlertType): Prisma's generated `DROP TABLE` / `DROP TYPE` is correct — no data to preserve
- For new columns: Prisma's `ADD COLUMN` with defaults is correct

## R5: Trimmed Mean Price Calculation

**Decision**: Implement tiered calculation based on listing count (per spec clarification):
- `< 3 listings`: use raw average of available prices
- `3-4 listings`: use untrimmed average (all prices included)
- `>= 5 listings`: remove top and bottom 10% of prices, then average the remainder

**Rationale**: Trimmed mean requires a minimum sample size to be meaningful. With 1-2 listings, trimming would eliminate all data. The tiered approach ensures every card with at least 1 listing gets a market price while applying statistical filtering when the sample size supports it.

**Alternatives considered**:
- Median only — loses information about price distribution; less useful for market valuation.
- Winsorizing (capping outliers instead of removing) — more complex with marginal benefit at this scale.
- Fixed-count trimming (remove exactly 1 from each end) — less adaptable to varying sample sizes.

**Key details**:
- Sort prices ascending
- Calculate trim count: `Math.floor(prices.length * 0.1)`
- Slice: `prices.slice(trimCount, prices.length - trimCount)`
- Average the remaining prices → `priceMarket`
- Median: middle value of full (untrimmed) sorted list → `priceMid`
- `priceLow`: min of trimmed list
- `priceHigh`: max of trimmed list
- `ebayBuyNowLow`: absolute minimum of all listings (no trimming)

## R6: Budget Enforcement Strategy

**Decision**: In-memory daily counter with midnight UTC reset. Global singleton shared across sync tiers.

**Rationale**: The 5,000 call/day limit is a hard constraint from eBay's basic API tier. A simple counter is sufficient since the sync runs in a single process. No need for distributed locking or database-backed counters.

**Alternatives considered**:
- Database-backed counter — adds unnecessary complexity; sync runs single-process.
- Redis counter — overkill for a single-server deployment.

**Key details**:
- `BudgetTracker` class with `dailyCount`, `lastResetDate`
- Reset at midnight UTC: compare current date to `lastResetDate`
- `canMakeCall()`: returns `dailyCount < (totalBudget - reservedBudget)`
- `recordCall()`: increments counter
- `totalBudget`: env `EBAY_DAILY_BUDGET` (default 5000)
- `reservedBudget`: 500 calls for on-demand snapshots
- Effective budget for sync: 4,500 calls
- Log budget usage at sync end for operational visibility
