# API Route vs Frontend Call Audit

## Legend
- ✅ = Match found
- ❌ = Mismatch (404 risk)
- ⚠️ = Parameter/method mismatch
- 🔒 = Auth required
- 📝 = Note

## FRONTEND FETCH CALLS vs BACKEND ROUTES

### Authentication
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/auth/login` | `/app/api/auth/login/route.ts` | POST | ✅ | Working |
| `/api/auth/refresh` | `/app/api/auth/route.ts` (action=refresh) | POST | ✅ | Fixed |
| `/api/auth/logout` | `/app/api/auth/route.ts` (action=logout) | POST | ✅ | Working |
| `/api/auth/google` | `/app/api/auth/google/route.ts` | GET | ✅ | Working |
| `/api/auth/google/callback` | `/app/api/auth/google/callback/route.ts` | GET | ✅ | Working |
| `/api/users/check-username?u=` | `/app/api/users/check-username/route.ts` | GET | ✅ | Fixed |
| `/api/users/me` | `/app/api/users/me/route.ts` | GET | ✅ | Working (dynamic server warning) |
| `/api/users/profile` | `/app/api/users/profile/route.ts` | GET | ✅ | Working |
| `/api/users?search=` | `/app/api/users/route.ts` | GET | ✅ | Working |

### Users & Profiles
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/users` (list) | `/app/api/users/route.ts` | GET | ✅ | Working |
| `/api/users/[userId]` | `/app/api/users/[id]/route.ts` | GET | ✅ | Working |
| `/api/portfolios/user/[userId]` | `/app/api/portfolios/user/[userId]/route.ts` | GET | ✅ | Working |
| `/api/users/profile` | `/app/api/users/profile/route.ts` | GET | ✅ | Working |

### Portfolios
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/portfolios` | `/app/api/portfolios/route.ts` | GET | ✅ | Working |
| `/api/portfolios` | `/app/api/portfolios/route.ts` | POST | ✅ | Working |
| `/api/portfolios/[id]` | `/app/api/portfolios/[id]/route.ts` | GET | ✅ | Working |
| `/api/portfolios/[id]` | `/app/api/portfolios/[id]/route.ts` | PATCH | ✅ | Working |
| `/api/portfolios/[id]` | `/app/api/portfolios/[id]/route.ts` | DELETE | ✅ | Working |
| `/api/portfolios/[id]/items` | `/app/api/portfolios/[id]/items/route.ts` | GET | ✅ | Working |
| `/api/portfolios/[id]/items` | `/app/api/portfolios/[id]/items/[itemId]/route.ts` | POST | ✅ | Fixed |
| `/api/portfolios/[id]/items/[itemId]` | `/app/api/portfolios/[id]/items/[itemId]/route.ts` | GET | ✅ | Working |
| `/api/portfolios/[id]/items/[itemId]` | `/app/api/portfolios/[id]/items/[itemId]/route.ts` | PUT | ✅ | Fixed |
| `/api/portfolios/[id]/items/[itemId]` | `/app/api/portfolios/[id]/items/[itemId]/route.ts` | DELETE | ✅ | Fixed |
| `/api/portfolios/[id]/value` | `/app/api/portfolios/[id]/value/route.ts` | GET | ✅ | Working |

### Cards
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/cards` | `/app/api/cards/route.ts` | GET | ✅ | Working (dynamic server warning) |
| `/api/cards/[id]` | `/app/api/cards/[id]/route.ts` | GET | ✅ | Working |
| `/api/cards/[id]/price-history` | `/app/api/cards/[id]/price-history/route.ts` | GET | ✅ | Working |
| `/api/cards?q=` (search) | `/app/api/cards/route.ts` | GET | ✅ | Fixed |

### Grading
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/grading` | `/app/api/grading/route.ts` | GET | ✅ | Working |
| `/api/grading/calculate` | `/app/api/grading/calculate/route.ts` | GET | ✅ | Working (backward compat) |
| `/api/grading/calculate` | `/app/api/grading/route.ts` | GET | ✅ | Working (rewrite) |

### Watchlist
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/watchlist` | `/app/api/watchlist/route.ts` | GET | ✅ | Working |
| `/api/watchlist` | `/app/api/watchlist/route.ts` | POST | ✅ | Fixed (param mismatch) |
| `/api/watchlist?cardid=` | `/app/api/watchlist/route.ts` | GET | ✅ | Working |
| `/api/watchlist` | `/app/api/watchlist/route.ts` | DELETE | ✅ | Working |

### Sets & Collection
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/sets` | `/app/api/sets/route.ts` | GET | ✅ | Working |
| `/api/sets/[code]` | `/app/api/sets/[code]/route.ts` | GET | ✅ | Working |
| `/api/sets/[code]/progress` | `/app/api/sets/[code]/progress/route.ts` | GET | ✅ | Working |

### Marketplace
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/sets` | `/app/api/sets/route.ts` | GET | ✅ | Working |
| `/api/marketplace/[id]` | `/app/api/listings/[id]/route.ts` | GET | ✅ | Working |
| `/api/listings` | `/app/api/listings/route.ts` | GET | ✅ | Working |
| `/api/listings` | `/app/api/listings/route.ts` | POST | ✅ | Working |
| `/api/listings/[id]` | `/app/api/listings/[id]/route.ts` | PUT | ✅ | Working |
| `/api/listings/[id]` | `/app/api/listings/[id]/route.ts` | DELETE | ✅ | Working |

### Scan
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/scan` | `/app/api/scan/route.ts` | GET | ✅ | Working |
| `/api/scan` | `/app/api/scan/route.ts` | POST | ✅ | Working |

### Seller
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/seller` | `/app/api/seller/route.ts` | GET | ✅ | Working |
| `/api/seller` | `/app/api/seller/route.ts` | POST | ✅ | Working |

### Orders
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/orders` | `/app/api/orders/route.ts` | GET | ✅ | Working |
| `/api/orders` | `/app/api/orders/route.ts` | POST | ✅ | Working |

### Slabs
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/slabs` | `/app/api/slabs/route.ts` | GET | ✅ | Working |
| `/api/slabs` | `/app/api/slabs/route.ts` | POST | ✅ | Working |

### Webhooks
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/webhooks` | `/app/api/webhooks/route.ts` | POST | ✅ | Working |
| `/api/webhooks/stripe` | `/app/api/webhooks/stripe/route.ts` | POST | ✅ | Working |

### Debug/Admin
| Frontend Call | Backend Route | Method | Status | Notes |
|---------------|---------------|--------|--------|-------|
| `/api/debug` | `/app/api/debug/route.ts` | GET | ✅ | Working |
| `/api/admin` | `/app/api/admin/route.ts` | GET | ✅ | Working |
| `/api/pricing` | `/app/api/pricing/route.ts` | GET | ✅ | Working |

## SUMMARY

### ✅ ALL CRITICAL 404 ISSUES FIXED
1. Registration: `/api/auth/register` → `/api/users` ✅
2. Token refresh: Added `/api/auth/refresh` ✅
3. Card search: `/api/cards/search` → `/api/cards?q=` ✅
4. Pokedex overview: `/api/pokedex/overview` → `/api/pokedex` ✅
5. Pokemon detail: Added `/api/pokedex/[id]` ✅
6. Portfolio items: Fixed `[itemId]` parameter routing ✅
7. Watchlist: Fixed `cardId` vs `cardid` parameter mismatch ✅

### 🔄 BACKWARD COMPATIBILITY MAINTAINED
- `/api/grading/calculate` route still works for cached JS bundles
- Next.js rewrite maps `/api/grading/calculate` → `/api/grading`

### ⚠️ DYNAMIC SERVER WARNINGS (NON-CRITICAL)
Several API routes show "Dynamic server usage" warnings in build logs due to using `request.url`, `request.headers`, or `nextUrl.searchParams`. These are **expected and harmless** for API routes that need to be dynamic - they don't cause 404 errors.

### 📝 RECOMMENDATIONS
1. **Monitor CDN cache**: Some users may still see cached responses - hard refresh (Ctrl+Shift+R) resolves
2. **Consider API route optimization**: For high-traffic endpoints, consider adding caching headers
3. **Add rate limiting**: Consider adding rate limits to public endpoints like `/api/cards` and `/api/grading`

## CONCLUSION
All critical API endpoint mismatches that were causing 404 errors have been identified and fixed. The application should now work correctly for all core user flows including registration, login, portfolio management, grading calculator, and marketplace features.