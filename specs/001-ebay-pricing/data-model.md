# Data Model: eBay Pricing Integration

**Feature**: 001-ebay-pricing | **Date**: 2026-02-28

## Entity Changes

### Card (modified)

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `tcgplayerId` | `String? @unique` | renamed → `pokemonTcgId` | Stores Pokemon TCG data API IDs (e.g., `base1-4`), not TCGPlayer product IDs |
| `priceAlerts` | `PriceAlert[]` | **removed** | Price Alerts feature deleted |

All other Card fields unchanged.

### CardPrice (modified)

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `tcgplayerLow` | `Float?` | renamed → `priceLow` | Source-agnostic |
| `tcgplayerMid` | `Float?` | renamed → `priceMid` | Source-agnostic |
| `tcgplayerHigh` | `Float?` | renamed → `priceHigh` | Source-agnostic |
| `tcgplayerMarket` | `Float?` | renamed → `priceMarket` | Primary market price |
| `ebayRecentAvg` | `Float?` | renamed → `ebaySoldAvg` | Reserved for V2 sold data |
| — | — | add `ebayBuyNowLow Float?` | Lowest active Buy It Now price (no trimming) |
| — | — | add `lastUpdated DateTime?` | When eBay data was last fetched |
| — | — | add `isStale Boolean @default(false)` | Whether price data may be outdated |
| — | — | add `listingCount Int @default(0)` | Number of matched listings used for calculation |

Existing fields unchanged: `id`, `cardId`, `card`, `date`, `priceChartingValue`, `gradedPSA10`, `gradedPSA9`, `gradedBGS10`, `gradedBGS95`, `expectedValue`, `@@index([cardId, date])`.

### PriceHistory (modified)

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `source` | `String @default("tcgplayer")` | `String @default("ebay")` | New records tagged "ebay"; existing "tcgplayer" records preserved |

All other PriceHistory fields unchanged.

### PriceAlert (deleted)

```prisma
// REMOVED — entire model and relations
model PriceAlert {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(...)
  cardId        String
  card          Card       @relation(...)
  alertType     AlertType
  targetPrice   Float
  isActive      Boolean    @default(true)
  triggeredAt   DateTime?
  createdAt     DateTime   @default(now())
}

enum AlertType {
  PRICE_ABOVE
  PRICE_BELOW
  PERCENT_CHANGE
}
```

### User (modified)

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `priceAlerts` | `PriceAlert[]` | **removed** | Relation deleted with PriceAlert model |

### SyncLog (modified)

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `triggeredAlerts` | `Int @default(0)` | **removed** | No longer relevant without Price Alerts |

---

## New Runtime Entities (not persisted in DB)

### EbayToken (in-memory)

```typescript
interface EbayToken {
  accessToken: string;
  expiresAt: number;  // Unix timestamp ms
}
```

Cached in `EbayPriceFetcher` instance. Refreshed 5 minutes before expiry.

### BudgetTracker (in-memory)

```typescript
interface BudgetState {
  dailyCount: number;
  lastResetDate: string;  // YYYY-MM-DD UTC
  totalBudget: number;    // default 5000
  reservedBudget: number; // 500 for on-demand
}
```

Resets at midnight UTC. Singleton shared across sync tiers.

### MatchedListing (transient)

```typescript
interface MatchedListing {
  cardId: string;
  price: number;        // Buy It Now price from listing
  listingTitle: string;
  cardNumber: string;   // Extracted card number
}
```

Used during sync to group listings by card before price calculation.

---

## Validation Rules

| Field | Rule |
|-------|------|
| `pokemonTcgId` | Unique, nullable. Format: `{setCode}-{number}` (e.g., `base1-4`) |
| `priceMarket` | >= 0 when present. Null if no listings found |
| `priceLow` | <= `priceMarket` <= `priceHigh` when all present |
| `ebayBuyNowLow` | <= `priceLow` (absolute minimum, no trimming applied) |
| `listingCount` | >= 0. 0 means no listings matched |
| `isStale` | true when `lastUpdated` is older than `STALE_THRESHOLD_HOURS` env var (default 48) |
| `source` (PriceHistory) | One of: `"tcgplayer"` (legacy), `"ebay"` (new) |

## State Transitions

### Card Price Lifecycle

```
[No Price Data] → first sync match → [Fresh Price]
[Fresh Price] → sync updates → [Fresh Price] (lastUpdated refreshed)
[Fresh Price] → staleness check (>48h since lastUpdated) → [Stale Price]
[Stale Price] → precision pass re-prices → [Fresh Price]
[Stale Price] → no listings found → [Stale Price] (keeps last known price)
```

### Daily Sync Budget Lifecycle

```
[Full Budget (5000)] → midnight UTC reset
  → Tier 1 bulk pass consumes calls
  → [Partial Budget] → budget low (<=500 remaining)
  → Tier 2 precision pass consumes remaining calls
  → [Empty/Reserved Budget] → sync stops
  → Next midnight → [Full Budget (5000)]
```
