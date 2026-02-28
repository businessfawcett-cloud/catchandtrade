# Catch and Trade - Project Status

## Overview

Catch and Trade is a trading card portfolio and marketplace application supporting multiple card games (Pokemon, MTG, Yu-Gi-Oh!, Sports, One Piece, Lorcana). The platform allows users to track their collections, scan cards, buy/sell on a marketplace, and monitor price movements.

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Web | Next.js 14 (App Router), React 18 |
| Mobile | Expo React Native |
| API | Express.js, Node.js |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Authentication | JWT, Passport (Google, Apple) |
| Payments | Stripe |
| Card Scanning | Google Cloud Vision OCR |
| Scheduling | node-cron |

### Project Structure

```
catchandtrade/
├── apps/
│   ├── web/           # Next.js web application (port 3002)
│   └── mobile/       # Expo React Native app
├── packages/
│   ├── api/          # Express API server (port 3003)
│   ├── db/           # Prisma ORM & database
│   ├── scanning/     # Card scanning pipeline
│   └── shared/       # Shared types & constants
├── docker-compose.yml # PostgreSQL, Redis, Mailhog
└── turbo.json        # Monorepo build config
```

---

## Database Models

### Core Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with auth, profiles, social links |
| `PokemonSet` | Pokemon card sets (Base Set, Jungle, etc.) |
| `Card` | Individual cards with metadata, prices |
| `CardPrice` | Historical price snapshots |
| `Portfolio` | User's card collections |
| `PortfolioItem` | Cards in portfolios with condition/grading |
| `Listing` | Cards for sale on marketplace |
| `Bid` | Offers on listings |
| `Order` | Completed purchases |
| `WatchlistItem` | Card price watching |
| `PriceAlert` | Price threshold notifications |
| `SyncLog` | Nightly sync job history |

### Enums

- `GameType`: POKEMON, MTG, YUGIOH, SPORTS, ONE_PIECE, LORCANA, OTHER
- `OrderStatus`: PENDING, PAID, SHIPPED, DELIVERED, DISPUTED, REFUNDED, CANCELLED
- `AlertType`: PRICE_ABOVE, PRICE_BELOW, PERCENT_CHANGE
- `Condition`: MINT, NEAR_MINT, LIGHTLY_PLAYED, MODERATELY_PLAYED, HEAVILY_PLAYED, DAMAGED

---

## Features Implemented

### Authentication
- [x] Email/password registration & login
- [x] JWT-based sessions
- [x] Google OAuth
- [x] Apple OAuth
- [x] Protected routes

### Portfolio Management
- [x] Create multiple portfolios
- [x] Add/remove cards from portfolios
- [x] Track card condition and grading
- [x] Search and add cards via TCGPlayer API
- [x] Public portfolio sharing via slug

### Collection Tracking
- [x] `/collection` - View all Pokemon sets with progress bars
- [x] `/collection/[code]` - Set detail with owned/missing cards
- [x] Progress calculation by portfolio ownership
- [x] Color-coded progress (green >75%, yellow >25%, gray <25%)
- [x] Affiliate links (TCGPlayer, Amazon) for missing cards

### Marketplace
- [x] List cards for sale
- [x] Browse marketplace listings
- [x] Make offers/bids
- [x] Accept/reject offers
- [x] Order fulfillment workflow
- [x] Price history charts

### Card Scanning
- [x] Image upload and preprocessing
- [x] Google Cloud Vision OCR
- [x] Card matching algorithm
- [x] Auto-add to portfolio

### Pricing & Alerts
- [x] Real-time price fetching (TCGPlayer API)
- [x] Price history tracking
- [x] Price alerts (above/below thresholds)
- [x] Price change notifications
- [x] Watchlist for tracking cards

### Data Sync (Nightly)
- [x] Auto-sync Pokemon sets from Pokemon TCG API
- [x] Auto-sync card data (new cards, updated info)
- [x] Auto-sync prices daily
- [x] Triggered alerts notification
- [x] Sync logging and history
- [x] Manual sync trigger (admin endpoint)
- [x] Scheduled at 2:00 AM daily

### Admin Functions
- [x] POST `/api/admin/sync` - Manual sync trigger
- [x] GET `/api/admin/sync/logs` - View sync history
- [x] Protected by `X-Admin-Key` header

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login |
| `/api/users` | GET/PUT | JWT | Get/update profile |
| `/api/cards` | GET | No | List featured cards |
| `/api/cards/search` | GET | No | Search cards |
| `/api/cards/:id` | GET | No | Get card details |
| `/api/sets` | GET | No | List Pokemon sets |
| `/api/sets/:code/progress` | GET | JWT | Get collection progress |
| `/api/portfolios` | GET/POST | JWT | List/create portfolios |
| `/api/portfolios/:id/items` | POST | JWT | Add card to portfolio |
| `/api/listings` | GET/POST | JWT | Browse/create listings |
| `/api/listings/:id/bids` | POST | JWT | Make offer |
| `/api/pricing/:cardId` | GET | No | Get price history |
| `/api/alerts` | GET/POST | JWT | Manage price alerts |
| `/api/watchlist` | GET/POST | JWT | Manage watchlist |
| `/api/seller/profile` | GET/PUT | JWT | Seller profile |
| `/api/admin/sync` | POST | Admin | Trigger sync |
| `/api/admin/sync/logs` | GET | Admin | View sync logs |

---

## Web Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with featured cards |
| `/login` | Login page |
| `/register` | Registration page |
| `/onboarding` | New user onboarding |
| `/portfolio` | User portfolio management |
| `/portfolio/search` | Search cards to add |
| `/collection` | Pokemon collection progress |
| `/collection/[code]` | Set detail with owned/missing |
| `/marketplace` | Browse listings |
| `/marketplace/[id]` | Listing detail |
| `/scan` | Card scanner |
| `/user-profile` | User profile settings |

---

## Test Coverage

### Test Summary

| Package | Tests | Status |
|---------|-------|--------|
| @catchandtrade/db | 5 | ✅ Pass |
| @catchandtrade/shared | 12 | ✅ Pass |
| @catchandtrade/scanning | 11 | ✅ Pass |
| @catchandtrade/web | 42 | ✅ Pass |
| @catchandtrade/api | 71 | ✅ Pass |
| **Total** | **141** | ✅ Pass |

### Test Categories

- **API Tests**: Auth, cards, sets, portfolios, listings, seller, health, admin-sync, sync-jobs
- **Web Tests**: Login, register, marketplace, portfolio search, navbar, homepage, onboarding, scan
- **DB Tests**: Card model validation
- **Scanning Tests**: OCR, image preprocessing, card matching
- **Shared Tests**: Constants, affiliate links

---

## Environment Variables

### Development (.env)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/catchandtrade_dev
JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-refresh-secret
API_URL=http://localhost:3003
WEB_URL=http://localhost:3002
PORT=3003
STRIPE_SECRET_KEY=sk_test_...
ADMIN_SECRET=local-admin-secret-change-in-production
POKEMON_TCG_API_KEY=
NODE_ENV=development
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5435 | Development database |
| PostgreSQL Test | 5436 | Test database |
| Redis | 6380 | Caching |
| Mailhog | 1025/8025 | Email testing |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# Clone and install
git clone <repo>
cd catchandtrade
npm install

# Start infrastructure
docker-compose up -d

# Database setup
npm run db:seed

# Run development
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Web App | http://localhost:3002 |
| API | http://localhost:3003 |
| Health | http://localhost:3003/health |

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| buyer@test.com | TestPassword123! | Buyer |
| seller@test.com | TestPassword123! | Seller |

---

## Production Deployment

### Live URLs

| Service | URL |
|---------|-----|
| Web App | https://catchandtrade.com |
| API | https://api.catchandtrade.com |
| Database | PostgreSQL on Render (dpg-d6gge4p4tr6s73b81asg-a) |

### Production Database

- **Card Count**: 20,083 Pokemon cards
- **Set Count**: 171 Pokemon sets
- **Seeded**: Feb 2026

### Production Environment Variables

```
DATABASE_URL=<render-internal-url>
JWT_SECRET=catchandtrade_super_secret_jwt_key_2025
NODE_ENV=production
POKEMON_TCG_API_KEY=a3751a33-9ed6-4662-9ae3-870939002fcc
PORT=3003

NEXT_PUBLIC_API_URL=https://api.catchandtrade.com
NEXT_PUBLIC_AMAZON_ASSIST_TAG=catchandtrade-20
NEXT_PUBLIC_EBAY_CAMPAIGN_ID=5339143267
```

### Render Services

| Service | Name | Status |
|---------|------|--------|
| Web | catchandtrade-web | Deployed |
| API | catchandtrade-api | Deployed |
| Database | Catchandtrade-db | Available |

---

## Known Issues / TODO

- [ ] Email notifications for alerts
- [ ] Stripe Connect for seller payouts
- [ ] Mobile app completion
- [ ] Price expectedValue calculation (90-day linear regression)
- [x] Production deployment to Render
- [x] Full Pokemon card database (20,000+ cards)

---

## Recent Changes

### Latest Features Added

1. **Production Deployment** (Feb 2026)
   - Deployed to Render (catchandtrade.com, api.catchandtrade.com)
   - PostgreSQL database with 20,083 Pokemon cards
   - Express.json middleware fix for API requests
   - NEXT_PUBLIC_API_URL configuration for production

2. **Collection Progress** (Feb 2026)
   - Pokemon set tracking with progress bars
   - Owned/missing card views
   - TCGPlayer & Amazon affiliate links

3. **Nightly Sync Worker** (Feb 2026)
   - Automated Pokemon set/card sync
   - Daily price updates
   - Price alert triggers
   - Admin manual trigger endpoint

---

## Contributing

Run tests before committing:
```bash
npm test
```

Build check:
```bash
npm run build
```
