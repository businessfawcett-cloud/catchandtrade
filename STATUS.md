# Catch & Trade - Project Status

## 🚀 DEPLOYMENT (April 2026)

| Item | Value |
|------|-------|
| **Production URL** | https://catchandtrade.com |
| **Vercel Project** | businessfawcett-clouds-projects/web |
| **Database** | Supabase PostgreSQL (ijnajdpcplapwiyvzsdh) |
| **Hosting** | Vercel |
| **Migration** | From Render + Neon → Vercel + Supabase |
| **Last Deployed** | April 8, 2026 |

---

## ✅ COMPLETED - APRIL 2026 UPDATES

### API Endpoints - All 404s Fixed ✅

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/users` | GET/POST | ✅ Working | Fixed from `/api/auth/register` |
| `/api/auth/login` | POST | ✅ Working | |
| `/api/auth/refresh` | POST | ✅ ADDED | New endpoint for token refresh |
| `/api/auth/google` | GET | ✅ Working | OAuth now functional |
| `/api/auth/google/callback` | GET | ✅ Working | OAuth callback |
| `/api/portfolios` | GET/POST | ✅ Working | |
| `/api/portfolios/[id]` | GET/PATCH/DELETE | ✅ Working | |
| `/api/portfolios/[id]/items` | GET/POST | ✅ Working | |
| `/api/portfolios/[id]/items/[itemId]` | GET/PUT/DELETE | ✅ FIXED | Added itemId parameter |
| `/api/cards` | GET | ✅ Working | Fixed from `/api/cards/search` |
| `/api/cards/[id]` | GET | ✅ Working | |
| `/api/pokedex` | GET | ✅ Working | Fixed from `/api/pokedex/overview` |
| `/api/pokedex/[id]` | GET | ✅ ADDED | New endpoint |
| `/api/grading` | GET | ✅ Working | Main grading endpoint |
| `/api/grading/calculate` | GET | ✅ ADDED | Backward compatibility |
| `/api/watchlist` | GET/POST/DELETE | ✅ Working | Fixed cardId vs cardid mismatch |
| `/api/wishlist` | GET/POST/DELETE | ✅ ADDED | New wishlist API |
| `/api/scan` | POST | ✅ Working | Free Tesseract.js OCR |
| `/api/sets` | GET | ✅ Working | |
| `/api/sets/[code]` | GET | ✅ Working | |
| `/api/sets/[code]/progress` | GET | ✅ Working | |

### Frontend Pages ✅

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ Working | Homepage/Marketplace |
| `/login` | ✅ Working | Login + Google OAuth |
| `/register` | ✅ Working | Registration |
| `/onboarding` | ✅ Working | New user flow |
| `/portfolio` | ✅ Working | Portfolio management |
| `/portfolio/search` | ✅ Working | Card search |
| `/collection` | ✅ Working | Collection overview |
| `/collection/pokedex` | ✅ Working | Pokédex browser |
| `/collection/pokedex/[id]` | ✅ Working | Individual Pokémon |
| `/collection/[code]` | ✅ Working | Set detail |
| `/marketplace` | ✅ Working | Marketplace |
| `/marketplace/[id]` | ✅ Working | Listing detail |
| `/grading` | ✅ Working | Grading ROI calculator |
| `/watchlist` | ✅ Working | Watchlist page |
| `/scan` | ✅ Working | Mobile app funnel |
| `/u/[username]` | ✅ Working | Public profile |
| `/legal/terms` | ✅ Working | |
| `/legal/privacy` | ✅ Working | |

### Core Features Working ✅

- User registration & login (email/password + Google OAuth)
- JWT authentication with token refresh
- Portfolio management (add/remove/update cards)
- Grading ROI calculator (PSA, BGS, CGC, SGC supported)
- Price history charts with mock data
- Card search functionality
- Marketplace browsing
- Collection/Pokédex tracking
- Scanner API (free Tesseract.js OCR - for mobile app)

---

## 🔴 INCOMPLETE / NEEDS WORK

### High Priority (From User Requests)
| Feature | Status | Notes |
|---------|--------|-------|
| Wishlist UI | Not built | API exists at `/api/wishlist` but no frontend |
| Value over time graph | Not built | Users want portfolio growth tracking |
| Set completion % | Not built | Collectr users miss this feature |
| Manual condition entry | Not built | Users hate forced scan for condition |

### Medium Priority
| Feature | Status | Notes |
|---------|--------|-------|
| Japanese card support | Not available | Dex has this |
| Multi-TCG support | Pokémon only | Collectr has 20+ TCGs |
| Creator partnerships | Not built | Rare Candy has Leonhart deals |
| Push notifications | Not built | Need for wishlist alerts |

### Lower Priority
| Feature | Status | Notes |
|---------|--------|-------|
| Native mobile app | Not built | Scanner funnels to app |
| Barcode scanning | API ready | Needs mobile app integration |
| Advanced analytics | Basic | Room for growth |
| Tax reporting | Not built | Future feature |

---

## 🐛 KNOWN ISSUES

1. **Google OAuth App Name**: Shows "Ai Secretary" instead of "Catch & Trade"
   - Cosmetic issue only - OAuth works fine
   - Requires domain verification to fix display name

2. **Prisma Schema Mismatch**: User table has `password` column but code uses `passwordHash`
   - Working around via Supabase REST API for inserts

3. **CDN Caching**: Some users see stale responses
   - Hard refresh (Ctrl+Shift+R) resolves

---

## 📊 COMPETITIVE POSITION (April 2026)

### Your Advantages ✅
- Free scanner API (Dex charges $4/mo)
- Grading ROI calculator (unique - no competitor has this)
- PSA + BGS + CGC + SGC support (Collectr only has PSA)
- Web app (Dex/Collectr are mobile-only)
- Built-in marketplace (Dex/Collectr/DittoDex don't have P2P trading)

### Gaps vs Competitors ❌
- No wishlist UI (users request this everywhere)
- No value over time graph (Dex & Collectr users ask for it)
- No set completion percentage
- No Japanese card support (Dex advantage)
- No multi-TCG support (Collectr has 20+ games)

---

## 📝 ENVIRONMENT VARIABLES (Production)

```
NEXT_PUBLIC_WEB_URL=https://catchandtrade.com
NEXT_PUBLIC_SUPABASE_URL=https://ijnajdpcplapwiyvzsdh.supabase.co
SUPABASE_SERVICE_KEY=***
DATABASE_URL=postgresql://postgres:***@db.ijnajdpcplapwiyvzsdh.supabase.co:6543/postgres
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
JWT_SECRET=***
JWT_REFRESH_SECRET=***
NEXT_PUBLIC_API_URL=https://catchandtrade.com
```

---

## 📈 RECENT CHANGES - APRIL 2026

### April 8 - API Fixes & Competitive Analysis

1. **Critical API 404 Fixes**
   - Fixed registration: `/api/auth/register` → `/api/users`
   - Added token refresh: `/api/auth/refresh`
   - Fixed card search: `/api/cards/search` → `/api/cards`
   - Fixed pokedex: `/api/pokedex/overview` → `/api/pokedex`
   - Added individual pokemon: `/api/pokedex/[id]`
   - Fixed portfolio items: Added `[itemId]` parameter
   - Fixed watchlist: `cardId` → `cardid` parameter mapping

2. **Competitive Analysis**
   - Mapped features vs Dex ($4/mo scanner), Collectr (PSA only), Rare Candy (marketplace)
   - Identified key differentiators: free scanner, grading ROI calculator, multi-company grading
   - Listed user complaints from App Store reviews across all apps

3. **Free Scanner Implementation**
   - Replaced Google Cloud Vision with Tesseract.js (free OCR)
   - Scanner API ready for mobile app integration
   - Web scanner page funnels to mobile app (no web camera)

4. **Wishlist API**
   - Created `/api/wishlist` endpoint
   - Ready for frontend UI implementation

5. **Google OAuth Fix**
   - Fixed `redirect_uri_mismatch` error
   - NEXT_PUBLIC_WEB_URL was set to `https://catchandtrade.com/api` (wrong)
   - OAuth now working

---

## 🔧 PROJECT STRUCTURE

```
catchandtrade/
├── apps/web/               # Next.js 14 web app (Vercel)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities (API, auth, password)
│   │   └── hooks/         # Custom React hooks
│   ├── prisma/            # Prisma schema
│   └── package.json
└── STATUS.md              # This file
```

---

## ✅ TESTING STATUS

- All critical API endpoints verified working
- Grading calculator returns proper ROI calculations
- Google OAuth login functional
- Portfolio management (add/remove cards) working
- Marketplace browse functional
- Pokédex/Collection browsing functional

---

## 📋 NEXT STEPS (Recommended)

1. **Build Wishlist UI** - Highest value retention feature
2. **Add Value Over Time Graph** - Portfolio growth tracking
3. **Set Completion Percentage** - Collection progress
4. **Manual Condition Entry** - Don't force scan for condition

---

## 📞 SUPPORT

- Production: https://catchandtrade.com
- Issues: Check Vercel logs or Supabase dashboard
- Database: Supabase (ijnajdpcplapwiyvzsdh)