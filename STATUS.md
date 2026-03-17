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
| Card Scanning | ML Kit (on-device) + server match API |
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
| `PokemonSet` | Pokemon card sets with totalCards and printedTotal |
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
- [x] On-device ML Kit text recognition (replaced Google Cloud Vision)
- [x] OCR text parser with noise filtering (BASIC, Pokemon, illustrator, body text)
- [x] Server-side card matching API (`POST /api/scan/match`)
- [x] Match priority: setCode > cardNumber+name > cardNumber+setTotal > name > rawText
- [x] printedTotal field for exact set matching (vs totalCards which includes secret rares)
- [x] rawText disambiguation when multiple cards match
- [x] Manual photo capture with react-native-vision-camera
- [x] Gallery image picker for scanning saved photos
- [x] Debug Alert dialog showing OCR results (temporary)
- [ ] Auto-add to portfolio from scan

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
| `/api/scan/match` | POST | No | Match card from OCR data |
| `/api/admin/sync` | POST | Admin | Trigger sync |
| `/api/admin/sync/logs` | GET | Admin | View sync logs |
| `/api/cron/sync` | GET | Token | Trigger nightly sync (24hr rate limit) |
| `/api/auth/refresh` | POST | No | Refresh JWT access token |

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
| @catchandtrade/web | 22 | ⚠️ Some Setup Issues |
| @catchandtrade/api | 71 | ✅ Pass |
| **Total** | **121** | ✅ Pass |

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

- **Card Count**: 20,000+ Pokemon cards
- **Set Count**: 170+ Pokemon sets
- **Seeded**: Feb 2026, nightly sync keeps data current
- **PokemonSet fields**: totalCards (with secret rares), printedTotal (number on card)

### Production Environment Variables

```
DATABASE_URL=<render-internal-url>
JWT_SECRET=catchandtrade_super_secret_jwt_key_2025
NODE_ENV=production
POKEMON_TCG_API_KEY=a3751a33-9ed6-4662-9ae3-870939002fcc
PORT=3003
ADMIN_SECRET=71296641415217621118352958456008

NEXT_PUBLIC_API_URL=https://api.catchandtrade.com
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=catchandtrade-20
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

### Production Ready (March 2026)

All critical issues resolved:
- JWT authentication working
- Google OAuth creating portfolios automatically
- Dashboard correctly displays user data from localStorage
- Legal pages (Terms, Privacy) added

### Future Enhancements

- [ ] Email notifications for price alerts
- [ ] Stripe Connect for seller payouts
- [ ] Improve scanner OCR accuracy (gold/stylized text, card name detection)
- [ ] Remove scanner debug Alert dialog once stable
- [ ] Auto-add scanned cards to portfolio
- [ ] Price expectedValue calculation (90-day linear regression)
- [x] Production deployment to Render
- [x] Full Pokemon card database (20,000+ cards)
- [x] Google OAuth authentication
- [x] Apple OAuth authentication
- [x] User portfolio creation on signup
- [x] Legal pages (Terms of Service, Privacy Policy)
- [x] Mobile app with card scanner (ML Kit OCR)
- [x] On-device OCR replacing server-side Tesseract
- [x] printedTotal field for accurate set matching
- [x] Automatic token refresh to prevent 401 errors
- [x] Redesigned login/register pages
- [x] Redesigned logged-in homepage with dashboard

---

## Recent Changes

### March 11, 2026 - Mobile Scanner & Set Matching

1. **On-Device OCR Migration**
   - Replaced server-side Google Cloud Vision/Tesseract with ML Kit on-device text recognition
   - Added OCR text parser with noise filtering (BASIC variants, Pokemon, illustrator, body text)
   - Manual photo capture via react-native-vision-camera

2. **Server-Side Card Matching API**
   - New `POST /api/scan/match` endpoint for text-based card matching
   - Priority matching: setCode > cardNumber+name > cardNumber+setTotal > name > rawText
   - rawText disambiguation when multiple cards share same card number across sets

3. **printedTotal Fix**
   - Added `printedTotal` field to PokemonSet schema
   - Pokemon TCG API provides both `total` (with secret rares) and `printedTotal` (number on card)
   - Exact matching on printedTotal instead of fuzzy range on totalCards
   - Backfill endpoint to populate printedTotal for all existing sets

4. **UI Redesigns**
   - Redesigned login and register pages with split-layout, floating Pokemon cards
   - Redesigned logged-in homepage with premium dashboard and Recent Drops section
   - Improved Pokedex icon with gradient

5. **Auth Improvements**
   - Automatic token refresh to prevent 401 errors
   - Refresh token stored in localStorage

### March 7, 2026 - Production Ready

1. **Dashboard Username Fix**
   - Fixed hardcoded "User" placeholder overwriting real username
   - Now correctly reads displayName and username from localStorage
   - Navbar and dashboard show consistent username

2. **OAuth Portfolio Creation**
   - Google OAuth now creates "My Portfolio" automatically for new users
   - Apple OAuth now creates "My Portfolio" automatically for new users
   - Same behavior as email/password registration

3. **Legal Pages**
   - Added Terms of Service page (/legal/terms)
   - Added Privacy Policy page (/legal/privacy)
   - Footer links on homepage

### March 6, 2026 - OAuth & Auth Fixes

1. **Google OAuth Implementation**
   - Added `/auth/callback` page for OAuth redirect handling
   - Fixed WEB_URL fallback for production (https://catchandtrade.com)
   - Fixed passport-google-oauth20 strategy registration
   - Added missing `next` callback to passport.authenticate middleware

2. **Render Build Fixes**
   - Removed prisma migrate deploy from build command (P1002 timeout)
   - Build now only runs prisma generate

3. **User Experience Improvements**
   - Login/register pages redirect logged-in users to dashboard
   - Dashboard reads fresh user data from localStorage
   - Added username display in navbar
   - Added onboarding redirect for users without username

4. **API Fixes**
   - Added `/api/users/me` endpoint for fetching current user
   - Fixed JWT_SECRET default mismatch between auth and users routes
   - Explicitly set JWT_SECRET in render.yaml

### February 2026 - Initial Production Deploy
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
