# API Contracts: eBay Pricing Integration

**Feature**: 001-ebay-pricing | **Date**: 2026-02-28

## Modified Endpoints

### GET /api/pricing/cards/:id/prices

Price history and expected value for a card.

**Query Params**: `?days=90` (default 90)

**Response** (updated field names):
```json
{
  "history": [
    {
      "date": "2026-02-28T00:00:00.000Z",
      "priceMarket": 45.50,
      "priceLow": 38.00,
      "priceMid": 44.00,
      "priceHigh": 62.00,
      "ebaySoldAvg": null,
      "ebayBuyNowLow": 42.99,
      "priceChartingValue": null,
      "lastUpdated": "2026-02-28T02:15:00.000Z",
      "isStale": false,
      "listingCount": 23
    }
  ],
  "expectedValue": 46.20,
  "trend": "rising"
}
```

**Changes from current**: `tcgplayerMarket` → `priceMarket`, `tcgplayerLow/Mid/High` → `priceLow/Mid/High`, `ebayRecentAvg` → `ebaySoldAvg`, added `ebayBuyNowLow`, `lastUpdated`, `isStale`, `listingCount`.

---

### POST /api/pricing/cards/:id/snapshot

Creates an on-demand price snapshot using eBay API (consumes from reserved budget).

**Response**: `{ "success": true }`

**Changes from current**: Now calls eBay API instead of TCGPlayer. Subject to daily budget (reserved 500 calls).

---

### GET /api/cards

Card listing with current price.

**Response** (per card):
```json
{
  "id": "clx...",
  "name": "Charizard ex",
  "setName": "Obsidian Flames",
  "setCode": "sv3",
  "cardNumber": "125",
  "gameType": "POKEMON",
  "rarity": "Rare Ultra",
  "imageUrl": "https://...",
  "currentPrice": 45.50
}
```

**Changes from current**: `currentPrice` now sourced from `priceMarket` instead of `tcgplayerMarket`. No response shape change — frontend-transparent.

---

### GET /api/cards/search

**Changes**: Same as GET /api/cards — `currentPrice` sourced from `priceMarket`.

---

### GET /api/cards/:id

Full card detail with prices.

**Response**: Full Card object with `prices[]` array. Price fields renamed:
- `tcgplayerLow/Mid/High/Market` → `priceLow/Mid/High/Market`
- Added: `ebayBuyNowLow`, `lastUpdated`, `isStale`, `listingCount`

---

### GET /api/cards/:id/price-history

**Response** (unchanged shape):
```json
{
  "data": [{ "date": "2026-02-28", "price": 45.50 }],
  "currentPrice": 45.50,
  "change": "5.20",
  "hasRealData": true
}
```

**Changes from current**: `currentPrice` sourced from `priceMarket`. PriceHistory `price` field unchanged. No response shape change.

---

### GET /api/portfolios/:id/value

**Response** (unchanged shape):
```json
{
  "totalValue": 1234.56,
  "cardCount": 47,
  "uniqueCards": 32
}
```

**Changes from current**: `totalValue` calculated from `priceMarket` instead of `tcgplayerMarket`. No response shape change.

---

### GET /api/portfolios/:id/summary

**Response** (unchanged shape):
```json
{
  "totalCurrentValue": 1234.56,
  "totalCostBasis": 890.00,
  "gainLoss": 344.56,
  "gainLossPercent": 38.71,
  "itemCount": 15
}
```

**Changes from current**: `totalCurrentValue` calculated from `priceMarket`. No response shape change.

---

### GET /api/watchlist

**Response** (per item, updated):
```json
{
  "id": "clx...",
  "cardId": "clx...",
  "addedAt": "2026-02-01T00:00:00.000Z",
  "card": { "..." },
  "currentPrice": 45.50
}
```

**Changes from current**: `currentPrice` sourced from `priceMarket`.

---

## Deleted Endpoints

### GET /api/alerts — REMOVED
### POST /api/alerts — REMOVED
### DELETE /api/alerts/:id — REMOVED

Price Alerts feature has been completely removed.

---

## New Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EBAY_APP_ID` | (required) | eBay App ID / Client ID for OAuth2 |
| `EBAY_CERT_ID` | (required) | eBay Cert ID / Client Secret for OAuth2 |
| `STALE_THRESHOLD_HOURS` | `48` | Hours before a card's price is marked stale |
| `EBAY_DAILY_BUDGET` | `5000` | Maximum eBay API calls per day |

## Removed Environment Variables

| Variable | Reason |
|----------|--------|
| `TCGPLAYER_PUBLIC_KEY` | TCGPlayer integration removed |
| `TCGPLAYER_PRIVATE_KEY` | TCGPlayer integration removed |
| `TCGPLAYER_AFFILIATE_ID` | TCGPlayer affiliate links removed |
